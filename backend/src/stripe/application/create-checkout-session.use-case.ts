import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';
import { FOUNDER_SEAT_CAP, countActiveFounderSeats } from '../domain/founder';

export type CreateCheckoutSessionCommand = {
  // 'founder' is a pricing SKU, not an access tier: it checks out on a cheaper
  // price but grants (and is stored as) the 'hired' plan.
  plan: 'shortlisted' | 'hired' | 'founder';
  customerEmail?: string;
};

export type CreateCheckoutSessionResult = {
  url: string | null;
  // Only set for the founder plan: true when the deal is unavailable (not
  // configured, or all seats taken) so the caller can show a "sold out" state
  // rather than a generic failure.
  soldOut?: boolean;
};

@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: CreateCheckoutSessionCommand,
  ): Promise<CreateCheckoutSessionResult> {
    const isFounder = cmd.plan === 'founder';

    let priceId: string;
    if (isFounder) {
      const founderPriceId = this.config.get<string>('STRIPE_FOUNDER_PRICE_ID');
      // Deal not configured yet → behave as sold out, never fall through to a
      // full-price checkout.
      if (!founderPriceId) return { url: null, soldOut: true };
      // Best-effort seat cap (the frontend counter can be stale, so re-check
      // here). Note this counts *subscriptions*, but a checkout session only
      // becomes one once the customer pays — so several open founder checkouts
      // can coexist and slightly oversell past the cap near the boundary. That
      // soft cap is fine for a launch deal; for a hard stop, archive the
      // founder price in Stripe once ~100 subscriptions exist.
      const taken = await countActiveFounderSeats(this.stripe, founderPriceId);
      if (taken >= FOUNDER_SEAT_CAP) return { url: null, soldOut: true };
      priceId = founderPriceId;
    } else if (cmd.plan === 'shortlisted') {
      priceId = this.config.get<string>('STRIPE_SHORTLISTED_PRICE_ID')!;
    } else {
      priceId = this.config.get<string>('STRIPE_HIRED_PRICE_ID')!;
    }

    // A founder subscriber IS a hired subscriber (cheaper price, same access).
    // `metadata.plan` is what the checkout.session.completed handler persists,
    // and that handler only accepts 'shortlisted' | 'hired' — so we write
    // 'hired' and flag the founder origin separately for analytics.
    const persistedPlan = isFounder ? 'hired' : cmd.plan;

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'https://rejectcheck.com';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${frontendUrl}/dashboard?success=true`,
      cancel_url: `${frontendUrl}/pricing?error=true`,
      ...(cmd.customerEmail ? { customer_email: cmd.customerEmail } : {}),
      metadata: {
        plan: persistedPlan,
        email: cmd.customerEmail || '',
        ...(isFounder ? { founder: 'true' } : {}),
      },
    });

    return { url: session.url };
  }
}
