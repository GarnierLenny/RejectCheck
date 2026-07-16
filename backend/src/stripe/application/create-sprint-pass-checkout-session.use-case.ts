import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';

export type CreateSprintPassCheckoutSessionCommand = {
  /** Authenticated user email — required, taken from the JWT, not the body. */
  email: string;
  /** Locale for the return URLs ('en' | 'fr'). */
  locale?: string;
};

export type CreateSprintPassCheckoutSessionResult = {
  url: string | null;
  /** True when STRIPE_SPRINT_PRICE_ID is unset — the deal isn't configured yet,
   *  so the caller shows a fallback rather than a generic failure. */
  unavailable?: boolean;
};

/**
 * One-time Checkout Session (`mode: 'payment'`) for the Sprint pass — a single
 * up-front payment that grants hired-tier access for a bounded window (see
 * SPRINT_PASS_DURATION_DAYS). Mirrors the credits / analysis-unlock one-time
 * flows; the webhook discriminates on `metadata.type === 'sprint_pass'`.
 *
 * Uses a Stripe Price id (STRIPE_SPRINT_PRICE_ID) rather than inline price_data
 * so the amount is managed in the Stripe Dashboard, consistent with the
 * subscription and founder prices.
 *
 * Security: identification at webhook time relies on `customer_details.email`
 * (verified by Stripe); the email here is only used to prefill checkout.
 */
@Injectable()
export class CreateSprintPassCheckoutSessionUseCase {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: CreateSprintPassCheckoutSessionCommand,
  ): Promise<CreateSprintPassCheckoutSessionResult> {
    const priceId = this.config.get<string>('STRIPE_SPRINT_PRICE_ID');
    // Not configured yet → report unavailable; never fall through to a checkout
    // without a real price.
    if (!priceId) return { url: null, unavailable: true };

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'https://rejectcheck.com';
    const locale = cmd.locale === 'fr' ? 'fr' : 'en';

    const meta = {
      type: 'sprint_pass',
      email: cmd.email,
    };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${frontendUrl}/${locale}/dashboard?sprint_success=true`,
      cancel_url: `${frontendUrl}/${locale}/pricing?error=true`,
      customer_email: cmd.email,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });

    return { url: session.url };
  }
}
