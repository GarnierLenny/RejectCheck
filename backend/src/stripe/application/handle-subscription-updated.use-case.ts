import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { z } from 'zod';
import { SUBSCRIPTION_REPOSITORY } from '../ports/tokens';
import type { SubscriptionRepository } from '../ports/subscription.repository';

/**
 * Handles `customer.subscription.updated` — the event Stripe emits on every
 * renewal, status transition (past_due, unpaid, paused…) and plan change.
 *
 * Before this handler existed, `currentPeriodEnd` was written only once at
 * checkout, so a normally-renewing subscriber fell out of `isActive()` (which
 * requires currentPeriodEnd > now) at the start of their second billing period
 * while still being charged. This keeps the local row in sync with Stripe.
 *
 * Period-end is read defensively from the subscription root
 * (`current_period_end`, API ≤ 2025-03-31) and from the first item
 * (`items.data[].current_period_end`, newer API) so the handler is correct
 * regardless of the API version the webhook endpoint is pinned to.
 *
 * The row is matched by `stripeCustomerId`; if none exists yet the update is a
 * no-op (the row is created by `checkout.session.completed`).
 */

const SubscriptionSchema = z.object({
  customer: z.union([z.string(), z.object({ id: z.string() })]),
  status: z.nativeEnum(SubscriptionStatus),
  current_period_end: z.number().optional(),
  items: z
    .object({
      data: z
        .array(
          z.object({
            current_period_end: z.number().optional(),
            price: z.object({ id: z.string() }).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

@Injectable()
export class HandleSubscriptionUpdatedUseCase {
  private readonly logger = new Logger(HandleSubscriptionUpdatedUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SubscriptionRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(rawSub: unknown): Promise<void> {
    const parsed = SubscriptionSchema.safeParse(rawSub);
    if (!parsed.success) {
      this.logger.warn(
        `customer.subscription.updated: malformed payload — ${parsed.error.message}`,
      );
      return;
    }
    const sub = parsed.data;

    const customer = sub.customer;
    const customerId = typeof customer === 'string' ? customer : customer.id;

    const firstItem = sub.items?.data?.[0];
    const periodEndUnix =
      sub.current_period_end ?? firstItem?.current_period_end;
    if (typeof periodEndUnix !== 'number') {
      this.logger.warn(
        `customer.subscription.updated: missing current_period_end for customer=${customerId}`,
      );
      return;
    }

    const plan = this.resolvePlan(firstItem?.price?.id);

    await this.subscriptions.refreshByCustomerId(customerId, {
      status: sub.status,
      currentPeriodEnd: new Date(periodEndUnix * 1000),
      // undefined → repository preserves the stored plan (legacy/unmapped price)
      plan,
    });

    this.logger.log(
      `customer.subscription.updated: synced customer=${customerId} status=${sub.status} until=${new Date(
        periodEndUnix * 1000,
      ).toISOString()}${plan ? ` plan=${plan}` : ''}`,
    );
  }

  /** Maps a Stripe price id back to a plan; undefined for unknown/legacy prices. */
  private resolvePlan(priceId?: string): SubscriptionPlan | undefined {
    if (!priceId) return undefined;
    const shortlisted = this.config.get<string>('STRIPE_SHORTLISTED_PRICE_ID');
    const hired = this.config.get<string>('STRIPE_HIRED_PRICE_ID');
    const founder = this.config.get<string>('STRIPE_FOUNDER_PRICE_ID');
    // Founder is a discounted Hired price — it resolves to the hired plan so
    // renewals keep granting hired-tier access.
    if (priceId === hired || (founder && priceId === founder)) {
      return SubscriptionPlan.hired;
    }
    if (priceId === shortlisted) return SubscriptionPlan.shortlisted;
    return undefined;
  }
}
