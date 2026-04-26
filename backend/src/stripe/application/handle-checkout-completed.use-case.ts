import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { STRIPE_CLIENT, SUBSCRIPTION_REPOSITORY } from '../ports/tokens';
import type { StripeClient } from '../ports/stripe-client';
import type { SubscriptionRepository } from '../ports/subscription.repository';

/**
 * Validates the Stripe-controlled fields of a checkout.session.completed event
 * and persists / refreshes the subscription. The user-controlled
 * `metadata.email` is intentionally ignored — only `customer_details.email`
 * (verified by Stripe) is trusted.
 */

const PlanSchema = z.enum(['shortlisted', 'hired']);

const SessionSchema = z.object({
  customer_details: z
    .object({ email: z.string().email().nullable().optional() })
    .nullish(),
  customer: z.union([
    z.string(),
    z.object({ id: z.string() }),
    z.null(),
    z.undefined(),
  ]),
  subscription: z.union([
    z.string(),
    z.object({ id: z.string() }),
    z.null(),
    z.undefined(),
  ]),
  metadata: z.object({ plan: z.string().optional() }).passthrough().nullish(),
});

@Injectable()
export class HandleCheckoutCompletedUseCase {
  private readonly logger = new Logger(HandleCheckoutCompletedUseCase.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(rawSession: unknown): Promise<void> {
    const sessionParse = SessionSchema.safeParse(rawSession);
    if (!sessionParse.success) {
      this.logger.warn(
        `checkout.session.completed: malformed payload — ${sessionParse.error.message}`,
      );
      return;
    }
    const session = sessionParse.data;

    const planParse = PlanSchema.safeParse(session.metadata?.plan);
    if (!planParse.success) {
      this.logger.warn(
        `checkout.session.completed: invalid metadata.plan=${session.metadata?.plan}`,
      );
      return;
    }

    const email = session.customer_details?.email ?? undefined;
    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;
    const subscriptionRef = session.subscription;
    const subscriptionId =
      typeof subscriptionRef === 'string'
        ? subscriptionRef
        : subscriptionRef?.id;

    if (!email || !customerId || !subscriptionId) {
      this.logger.warn(
        `checkout.session.completed: missing required fields (email/customerId/subscription)`,
      );
      return;
    }

    const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
    const periodEndUnix = (sub as unknown as { current_period_end: number })
      .current_period_end;

    await this.subscriptions.upsert({
      email,
      stripeCustomerId: customerId,
      plan: planParse.data as SubscriptionPlan,
      status: sub.status as SubscriptionStatus,
      currentPeriodEnd: new Date(periodEndUnix * 1000),
    });
  }
}
