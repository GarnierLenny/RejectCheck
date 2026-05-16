import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';

export type CreateCreditsCheckoutSessionCommand = {
  /** Authenticated user email — required, not user-controllable client side. */
  email: string;
  /** Must be one of the allowed pack sizes: 1, 5, or 10. */
  quantity: number;
};

export type CreateCreditsCheckoutSessionResult = {
  url: string | null;
};

/**
 * Pack prices in euro cents. Each pack has a fixed total price that gives a
 * discount over buying individual credits — the unit price decreases as the
 * pack size increases.
 *
 * 5 crédits  → 4,99 € (1,00 €/crédit)
 * 10 crédits → 8,99 € (0,90 €/crédit, -10 %)
 * 20 crédits → 15,99 € (0,80 €/crédit, -20 %)
 */
export const CREDIT_PACKS: Record<number, { amountCents: number; label: string }> = {
  5:  { amountCents: 499,  label: '5 crédits d\'analyse' },
  10: { amountCents: 899,  label: '10 crédits d\'analyse' },
  20: { amountCents: 1599, label: '20 crédits d\'analyse' },
};

/**
 * Creates a Stripe Checkout Session in `payment` mode (one-time charge).
 * Each pack is priced as a flat total via `price_data` so the discount is
 * real — no new Stripe Price objects needed.
 *
 * Identification at webhook time relies on `customer_details.email` (verified
 * by Stripe), NOT on `metadata.email` — metadata is technically user-
 * controllable. The metadata is duplicated for human debuggability only.
 */
@Injectable()
export class CreateCreditsCheckoutSessionUseCase {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: CreateCreditsCheckoutSessionCommand,
  ): Promise<CreateCreditsCheckoutSessionResult> {
    const pack = CREDIT_PACKS[cmd.quantity];
    if (!pack) {
      throw new BadRequestException(
        `quantity must be one of: ${Object.keys(CREDIT_PACKS).join(', ')}`,
      );
    }

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'https://rejectcheck.com';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: pack.amountCents,
            product_data: { name: pack.label },
          },
        },
      ],
      success_url: `${frontendUrl}/dashboard?credit_success=true`,
      cancel_url: `${frontendUrl}/dashboard?credit_canceled=true`,
      customer_email: cmd.email,
      metadata: {
        type: 'credit_purchase',
        email: cmd.email,
        quantity: String(cmd.quantity),
      },
      payment_intent_data: {
        metadata: {
          type: 'credit_purchase',
          email: cmd.email,
          quantity: String(cmd.quantity),
        },
      },
    });

    return { url: session.url };
  }
}
