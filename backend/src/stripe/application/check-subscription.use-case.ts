import { Inject, Injectable } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY } from '../ports/tokens';
import type { SubscriptionRepository } from '../ports/subscription.repository';
import { isActive, isHiredAndActive } from '../domain/subscription.types';

@Injectable()
export class CheckSubscriptionUseCase {
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
