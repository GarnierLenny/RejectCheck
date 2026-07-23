import { Inject, Injectable, Logger } from '@nestjs/common';
import { SubscriptionProvider, SubscriptionStatus } from '@prisma/client';
import { REVENUECAT_WEBHOOK_VERIFIER } from '../ports/tokens';
import type { RevenueCatWebhookVerifier } from '../ports/webhook-verifier';
import { SUBSCRIPTION_REPOSITORY } from '../../stripe/ports/tokens';
import type { SubscriptionRepository } from '../../stripe/ports/subscription.repository';
import {
  RevenueCatEventSchema,
  ACTIVATING_EVENTS,
  REVOKING_EVENTS,
  entitlementToPlan,
  type RevenueCatEvent,
} from '../domain/revenuecat-event.types';

/**
 * RevenueCat webhook orchestrator. Verifies the Authorization secret first (the
 * sole trust boundary), then maps the event onto our entitlement model. It
 * writes into the SAME email-keyed Subscription table the Stripe webhook uses
 * (provider='revenuecat'), so the existing SubscriptionGate / quota path
 * aggregates both providers with no extra read and no live RevenueCat call.
 *
 * Integration contract (Phase 2): the mobile app calls
 * `Purchases.logIn(authEmail)`, so RevenueCat's `app_user_id` IS the user's
 * email — which is how this whole backend keys users.
 *
 * Activating a plan only requires writing the Subscription row (status=active,
 * plan, currentPeriodEnd in the future): the monthly caps (300/1500/3000) are
 * enforced at analysis time against the plan, not granted as a balance.
 */
@Injectable()
export class HandleRevenueCatWebhookUseCase {
  private readonly logger = new Logger(HandleRevenueCatWebhookUseCase.name);

  constructor(
    @Inject(REVENUECAT_WEBHOOK_VERIFIER)
    private readonly verifier: RevenueCatWebhookVerifier,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(
    authorizationHeader: string | undefined,
    rawBody: unknown,
  ): Promise<void> {
    // Auth is the sole trust boundary — verify BEFORE reading the body.
    this.verifier.verify(authorizationHeader);

    const parsed = RevenueCatEventSchema.safeParse(rawBody);
    if (!parsed.success) {
      this.logger.warn(
        `revenuecat: malformed payload — ${parsed.error.message}`,
      );
      return;
    }
    const event = parsed.data.event;

    if (ACTIVATING_EVENTS.has(event.type)) {
      await this.activate(event);
      return;
    }
    if (REVOKING_EVENTS.has(event.type)) {
      await this.revoke(event);
      return;
    }
    // CANCELLATION (auto-renew off, still active), BILLING_ISSUE, TEST, TRANSFER,
    // SUBSCRIPTION_PAUSED, etc. — no entitlement change. Logged, never rejected
    // (RevenueCat retries non-2xx).
    this.logger.debug(`revenuecat: ignoring event type=${event.type}`);
  }

  /**
   * app_user_id IS the user's email (see class doc). Normalize to lowercase to
   * match how the rest of the system keys users; reject anything that isn't an
   * email so a misconfigured app_user_id can't create an orphan row.
   */
  private resolveEmail(event: RevenueCatEvent): string | null {
    const id = event.app_user_id?.trim().toLowerCase();
    if (!id || !id.includes('@')) return null;
    return id;
  }

  private async activate(event: RevenueCatEvent): Promise<void> {
    const email = this.resolveEmail(event);
    if (!email) {
      this.logger.warn(
        `revenuecat: ${event.type} with non-email app_user_id=${event.app_user_id} — skipped`,
      );
      return;
    }

    const entitlementIds =
      event.entitlement_ids ??
      (event.entitlement_id ? [event.entitlement_id] : []);
    const plan = entitlementToPlan(entitlementIds);
    if (!plan) {
      this.logger.warn(
        `revenuecat: ${event.type} email=${email} unmapped entitlements=${JSON.stringify(
          entitlementIds,
        )} — skipped`,
      );
      return;
    }

    if (typeof event.expiration_at_ms !== 'number') {
      this.logger.warn(
        `revenuecat: ${event.type} email=${email} missing expiration_at_ms — skipped`,
      );
      return;
    }

    await this.subscriptions.upsert({
      email,
      provider: SubscriptionProvider.revenuecat,
      stripeCustomerId: null,
      externalRef: event.app_user_id ?? email,
      plan,
      status: SubscriptionStatus.active,
      currentPeriodEnd: new Date(event.expiration_at_ms),
    });

    this.logger.log(
      `revenuecat: activated email=${email} plan=${plan} until=${new Date(
        event.expiration_at_ms,
      ).toISOString()} env=${event.environment ?? 'n/a'}`,
    );
  }

  private async revoke(event: RevenueCatEvent): Promise<void> {
    const email = this.resolveEmail(event);
    if (!email) {
      this.logger.warn(
        `revenuecat: ${event.type} with non-email app_user_id=${event.app_user_id} — skipped`,
      );
      return;
    }
    // Cancels only the RevenueCat-sourced row — never a Stripe sub for the same
    // email (those are revoked by Stripe's own customer.subscription.deleted).
    await this.subscriptions.cancelByEmailAndProvider(
      email,
      SubscriptionProvider.revenuecat,
    );
    this.logger.log(`revenuecat: revoked email=${email} (event=${event.type})`);
  }
}
