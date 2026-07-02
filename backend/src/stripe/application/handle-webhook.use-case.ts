import { Inject, Injectable, Logger } from '@nestjs/common';
import { WEBHOOK_PARSER } from '../ports/tokens';
import type { StripeWebhookParser } from '../ports/webhook-parser';
import { HandleCheckoutCompletedUseCase } from './handle-checkout-completed.use-case';
import { HandleCreditPurchaseUseCase } from './handle-credit-purchase.use-case';
import { HandleAnalysisUnlockUseCase } from './handle-analysis-unlock.use-case';
import { HandleSubscriptionUpdatedUseCase } from './handle-subscription-updated.use-case';
import { HandleSubscriptionDeletedUseCase } from './handle-subscription-deleted.use-case';

/**
 * Webhook orchestrator. Verifies the signature first (delegated to the parser),
 * then dispatches to a per-event use case. Unknown event types are logged but
 * not rejected — Stripe retries 4xx, so we only fail when something is truly
 * malformed.
 *
 * `checkout.session.completed` covers both subscription bookings and one-time
 * credit purchases. We discriminate at this layer on `session.mode` so each
 * downstream handler stays focused on a single flow.
 */
@Injectable()
export class HandleWebhookUseCase {
  private readonly logger = new Logger(HandleWebhookUseCase.name);

  constructor(
    @Inject(WEBHOOK_PARSER) private readonly parser: StripeWebhookParser,
    private readonly checkoutCompleted: HandleCheckoutCompletedUseCase,
    private readonly creditPurchase: HandleCreditPurchaseUseCase,
    private readonly analysisUnlock: HandleAnalysisUnlockUseCase,
    private readonly subscriptionUpdated: HandleSubscriptionUpdatedUseCase,
    private readonly subscriptionDeleted: HandleSubscriptionDeletedUseCase,
  ) {}

  async execute(rawBody: Buffer, signature: string): Promise<void> {
    const event = this.parser.parseAndVerify(rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          mode?: string;
          metadata?: { type?: string } | null;
        };
        if (session.mode === 'payment') {
          // Both one-time flows are mode:'payment' — discriminate on type.
          if (session.metadata?.type === 'analysis_unlock') {
            await this.analysisUnlock.execute(event.data.object);
          } else {
            await this.creditPurchase.execute(event.data.object);
          }
        } else {
          // 'subscription' (or legacy events missing mode) → subscription flow.
          await this.checkoutCompleted.execute(event.data.object);
        }
        return;
      }
      case 'customer.subscription.updated':
        // Renewals, status transitions and plan changes — keeps currentPeriodEnd
        // in sync so paying subscribers stay active past the first period.
        await this.subscriptionUpdated.execute(event.data.object);
        return;
      case 'customer.subscription.deleted':
        await this.subscriptionDeleted.execute(event.data.object);
        return;
      default:
        this.logger.debug(`Ignoring unhandled Stripe event: ${event.type}`);
    }
  }
}
