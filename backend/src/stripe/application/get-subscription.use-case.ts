import { Inject, Injectable } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY } from '../ports/tokens';
import type { SubscriptionRepository } from '../ports/subscription.repository';
import type { SubscriptionSummary } from '../domain/subscription.types';

@Injectable()
export class GetSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(email: string): Promise<SubscriptionSummary | null> {
    const sub = await this.subscriptions.findByEmail(email);
    if (!sub) return null;
    return {
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }
}
