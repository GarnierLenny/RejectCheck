import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';

export type CreateAnalysisUnlockCheckoutSessionCommand = {
  /** Authenticated user email — required, not user-controllable client side. */
  email: string;
  /** The analysis to unlock (must belong to the authenticated user). */
  analysisId: number;
  /** Locale for the return URL ('en' | 'fr'). */
  locale?: string;
};

export type CreateAnalysisUnlockCheckoutSessionResult = {
  url: string | null;
};

/** One-time "unlock this CV" price, in euro cents. */
export const ANALYSIS_UNLOCK_PRICE_CENTS = 299; // €2.99

/**
 * One-time Checkout Session (`mode: 'payment'`) that unlocks the CV rewrite for
 * a SINGLE analysis — the low-commitment offer for episodic job seekers who
 * don't want a subscription. Mirrors the credits checkout flow; the webhook
 * discriminates on `metadata.type === 'analysis_unlock'`.
 *
 * Security: identification at webhook time relies on `customer_details.email`
 * (verified by Stripe). The analysisId in metadata is re-checked against that
 * email before the unlock is granted (markPremiumUnlocked is email-scoped).
 */
@Injectable()
export class CreateAnalysisUnlockCheckoutSessionUseCase {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: CreateAnalysisUnlockCheckoutSessionCommand,
  ): Promise<CreateAnalysisUnlockCheckoutSessionResult> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'https://rejectcheck.com';
    const locale = cmd.locale === 'fr' ? 'fr' : 'en';
    const productName =
      locale === 'fr'
        ? 'Réécriture de CV — déblocage de cette analyse'
        : 'CV rewrite — unlock for this analysis';

    const meta = {
      type: 'analysis_unlock',
      email: cmd.email,
      analysisId: String(cmd.analysisId),
    };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: ANALYSIS_UNLOCK_PRICE_CENTS,
            product_data: { name: productName },
          },
        },
      ],
      success_url: `${frontendUrl}/${locale}/analyze?id=${cmd.analysisId}&unlock_success=true`,
      cancel_url: `${frontendUrl}/${locale}/analyze?id=${cmd.analysisId}&unlock_canceled=true`,
      customer_email: cmd.email,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });

    return { url: session.url };
  }
}
