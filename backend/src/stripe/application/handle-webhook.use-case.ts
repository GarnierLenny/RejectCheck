import { Inject, Injectable, Logger } from '@nestjs/common';
import { WEBHOOK_PARSER } from '../ports/tokens';
import type { StripeWebhookParser } from '../ports/webhook-parser';
import { HandleCheckoutCompletedUseCase } from './handle-checkout-completed.use-case';
import { HandleSubscriptionDeletedUseCase } from './handle-subscription-deleted.use-case';

/**
 * Webhook orchestrator. Verifies the signature first (delegated to the parser),
 * then dispatches to a per-event use case. Unknown event types are logged but
 * not rejected — Stripe retries 4xx, so we only fail when something is truly
 * malformed.
 */
@Injectable()
export class HandleWebhookUseCase {
  private readonly logger = new Logger(HandleWebhookUseCase.name);

  constructor(
    @Inject(WEBHOOK_PARSER) private readonly parser: StripeWebhookParser,
    private readonly checkoutCompleted: HandleCheckoutCompletedUseCase,
    private readonly subscriptionDeleted: HandleSubscriptionDeletedUseCase,
  ) {}

  async execute(rawBody: Buffer, signature: string): Promise<void> {
    const event = this.parser.parseAndVerify(rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.checkoutCompleted.execute(event.data.object);
        return;
      case 'customer.subscription.deleted':
        await this.subscriptionDeleted.execute(event.data.object);
        return;
      default:
        this.logger.debug(`Ignoring unhandled Stripe event: ${event.type}`);
    }
  }
}
