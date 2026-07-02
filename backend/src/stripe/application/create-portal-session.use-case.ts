import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STRIPE_CLIENT, SUBSCRIPTION_REPOSITORY } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';
import type { SubscriptionRepository } from '../ports/subscription.repository';

export type CreatePortalSessionCommand = {
  /** Authenticated user email — from the Supabase JWT, never the body. */
  email: string;
  /** Where Stripe returns the user after they close the portal. */
  returnUrl?: string;
};

export type CreatePortalSessionResult = { url: string };

/**
 * Opens a Stripe Billing Portal session so a subscriber can self-serve
 * cancellation, payment-method changes, invoices, and plan upgrades/downgrades
 * (Stripe handles proration). Requires a configured portal in the Stripe
 * Dashboard (Settings → Billing → Customer portal) for the active mode.
 */
@Injectable()
export class CreatePortalSessionUseCase {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SubscriptionRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: CreatePortalSessionCommand,
  ): Promise<CreatePortalSessionResult> {
    const customerId = await this.subscriptions.findStripeCustomerIdByEmail(
      cmd.email,
    );
    if (!customerId) {
      // No Stripe customer: either never subscribed on the web, or the
      // subscription lives in RevenueCat (managed in the App/Play Store).
      throw new NotFoundException(
        'No Stripe billing account for this user. Mobile subscriptions are managed in the App Store or Google Play.',
      );
    }

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'https://rejectcheck.com';

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: cmd.returnUrl || `${frontendUrl}/dashboard`,
    });

    if (!session.url) {
      throw new ConflictException('Stripe did not return a portal URL');
    }
    return { url: session.url };
  }
}
