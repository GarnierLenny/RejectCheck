import {
  BadGatewayException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(CreatePortalSessionUseCase.name);

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

    let session: { url: string | null };
    try {
      session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: cmd.returnUrl || `${frontendUrl}/dashboard`,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `billingPortal.sessions.create failed for customer=${customerId}: ${message}`,
      );
      if (code === 'resource_missing') {
        // The stored customer id doesn't exist in the active Stripe mode —
        // e.g. a subscription created in test mode, queried with a live key.
        // A clear 404 beats an opaque 500 on the "Manage billing" button.
        throw new NotFoundException(
          'Billing account not found in Stripe. If this subscription was created in test mode, it is not available in live mode.',
        );
      }
      throw new BadGatewayException(
        'Could not open the billing portal. Please try again or contact support.',
      );
    }

    if (!session.url) {
      throw new ConflictException('Stripe did not return a portal URL');
    }
    return { url: session.url };
  }
}
