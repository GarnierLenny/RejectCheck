import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';

export type CreateCreditsCheckoutSessionCommand = {
  /** Authenticated user email — required, not user-controllable client side. */
  email: string;
  /** 1..100 — sanity-checked here so the controller stays a thin DTO layer. */
  quantity: number;
};

export type CreateCreditsCheckoutSessionResult = {
  url: string | null;
};

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 100;

/**
 * Creates a Stripe Checkout Session in `payment` mode (one-time charge) for
 * the analysis credit Price. Quantity is chosen by the user upstream in our
 * Tailwind modal — we don't enable `adjustable_quantity` on Stripe's side
 * because the UX lives in our app.
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
    if (
      !Number.isInteger(cmd.quantity) ||
      cmd.quantity < MIN_QUANTITY ||
      cmd.quantity > MAX_QUANTITY
    ) {
      throw new BadRequestException(
        `quantity must be an integer between ${MIN_QUANTITY} and ${MAX_QUANTITY}`,
      );
    }

    const priceId = this.config.get<string>('STRIPE_CREDIT_PRICE_ID')!;
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'https://rejectcheck.com';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: cmd.quantity }],
      success_url: `${frontendUrl}/dashboard?credit_success=true`,
      cancel_url: `${frontendUrl}/dashboard?credit_canceled=true`,
      customer_email: cmd.email,
      metadata: {
        type: 'credit_purchase',
        email: cmd.email,
        quantity: String(cmd.quantity),
      },
      // Mirrored on the underlying PaymentIntent so any flow that inspects
      // the intent (refund tooling, manual reconciliation) carries the same
      // hints. Webhook code still trusts session-level fields.
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
