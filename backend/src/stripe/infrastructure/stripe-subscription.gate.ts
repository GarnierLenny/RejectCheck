import { Inject, Injectable } from '@nestjs/common';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import { SUBSCRIPTION_REPOSITORY } from '../ports/tokens';
import type { SubscriptionRepository } from '../ports/subscription.repository';
import { isActive, isHiredAndActive } from '../domain/subscription.types';

/**
 * Adapter that backs the project-wide SubscriptionGate by reading directly
 * from our subscription store (synced by the Stripe webhook). Keeping the
 * gate on the local repository — instead of calling Stripe live — avoids
 * latency on every premium-gated request and lets us treat the DB as the
 * single source of truth.
 */
@Injectable()
export class StripeSubscriptionGate implements SubscriptionGate {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async isPremium(email: string): Promise<boolean> {
    const sub = await this.subscriptions.findByEmail(email);
    return isActive(sub);
  }

  async isHired(email: string): Promise<boolean> {
    const sub = await this.subscriptions.findByEmail(email);
    return isHiredAndActive(sub);
  }
}
