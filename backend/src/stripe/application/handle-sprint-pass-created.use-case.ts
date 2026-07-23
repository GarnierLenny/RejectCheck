import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionProvider,
} from '@prisma/client';
import { SUBSCRIPTION_REPOSITORY } from '../ports/tokens';
import type { SubscriptionRepository } from '../ports/subscription.repository';
import { SPRINT_PASS_DURATION_MS } from '../domain/sprint-pass';
import { ANALYTICS_TRACKER } from '../../common/ports/tokens';
import type { AnalyticsTracker } from '../../common/ports/analytics.tracker';

/**
 * Handles `checkout.session.completed` events whose `mode === 'payment'` and
 * `metadata.type === 'sprint_pass'`. Grants a time-boxed hired-tier entitlement
 * by upserting a Subscription row with provider `stripe_sprint`.
 *
 * The row is keyed on (email, provider), so it never clobbers a recurring
 * `stripe` subscription, and `pickEffective()` picks it up as the active hired
 * plan for the window. `currentPeriodEnd` holds the expiry, so `isActive()`
 * expires it naturally with no extra column and no cleanup job.
 *
 * Idempotency: the expiry is derived from the session's `created` timestamp
 * (not server `now`), so a replayed webhook (Stripe retry / CLI resend) upserts
 * the exact same `currentPeriodEnd` — a no-op. A genuine second purchase has a
 * later `created`, so it extends the window.
 *
 * Security: `customer_details.email` (verified by Stripe) is the source of
 * truth. `metadata.email` is mirrored for human debugging only.
 */
const SessionSchema = z.object({
  mode: z.literal('payment'),
  payment_status: z.string(),
  // Unix seconds; when the checkout session was created. Anchors the expiry so
  // replays are idempotent.
  created: z.number().int().optional(),
  customer_details: z
    .object({ email: z.string().email().nullable().optional() })
    .nullish(),
  customer: z.union([
    z.string(),
    z.object({ id: z.string() }),
    z.null(),
    z.undefined(),
  ]),
  metadata: z.object({ type: z.string().optional() }).passthrough().nullish(),
});

@Injectable()
export class HandleSprintPassCreatedUseCase {
  private readonly logger = new Logger(HandleSprintPassCreatedUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SubscriptionRepository,
    @Inject(ANALYTICS_TRACKER) private readonly analytics: AnalyticsTracker,
  ) {}

  async execute(rawSession: unknown): Promise<void> {
    const parsed = SessionSchema.safeParse(rawSession);
    if (!parsed.success) {
      this.logger.warn(
        `sprint_pass: malformed payload — ${parsed.error.message}`,
      );
      return;
    }
    const session = parsed.data;

    // Async payment methods (SEPA, bank transfer) fire this before the money
    // moves. Only grant on confirmed paid sessions.
    if (session.payment_status !== 'paid') {
      this.logger.log(
        `sprint_pass: skipping non-paid session (status=${session.payment_status})`,
      );
      return;
    }

    const email = session.customer_details?.email ?? null;
    if (!email) {
      this.logger.warn(
        `sprint_pass: missing customer_details.email — grant skipped`,
      );
      return;
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    // Deterministic expiry so webhook replays are idempotent (same created →
    // same currentPeriodEnd). Falls back to now only if Stripe omitted created.
    const createdMs = (session.created ?? Math.floor(Date.now() / 1000)) * 1000;
    const expiresAt = new Date(createdMs + SPRINT_PASS_DURATION_MS);

    await this.subscriptions.upsert({
      email,
      provider: SubscriptionProvider.stripe_sprint,
      stripeCustomerId: customerId ?? null,
      externalRef: null,
      plan: SubscriptionPlan.hired,
      status: SubscriptionStatus.active,
      currentPeriodEnd: expiresAt,
    });

    this.analytics.capture({
      event: 'sprint_pass_purchased',
      distinctId: email,
      properties: { expiresAt: expiresAt.toISOString() },
    });

    this.logger.log(
      `sprint_pass: granted email=${email} until=${expiresAt.toISOString()}`,
    );
  }
}
