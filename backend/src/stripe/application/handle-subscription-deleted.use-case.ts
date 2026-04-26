import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { SUBSCRIPTION_REPOSITORY } from '../ports/tokens';
import type { SubscriptionRepository } from '../ports/subscription.repository';

const SubscriptionSchema = z.object({
  customer: z.union([z.string(), z.object({ id: z.string() })]),
});

@Injectable()
export class HandleSubscriptionDeletedUseCase {
  private readonly logger = new Logger(HandleSubscriptionDeletedUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(rawSub: unknown): Promise<void> {
    const parsed = SubscriptionSchema.safeParse(rawSub);
    if (!parsed.success) {
      this.logger.warn(
        `customer.subscription.deleted: malformed payload — ${parsed.error.message}`,
      );
      return;
    }
    const customer = parsed.data.customer;
    const customerId = typeof customer === 'string' ? customer : customer.id;
    await this.subscriptions.cancelByCustomerId(customerId);
  }
}
