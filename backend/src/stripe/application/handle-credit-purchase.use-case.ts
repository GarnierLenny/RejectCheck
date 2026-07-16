import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { CREDIT_LEDGER_REPOSITORY } from '../../credits/ports/tokens';
import type { CreditLedgerRepository } from '../../credits/ports/credit-ledger.repository';
import { CREDIT_PACK_AMOUNTS } from '../../credits/domain/credit-packs';
import { ANALYTICS_TRACKER } from '../../common/ports/tokens';
import type { AnalyticsTracker } from '../../common/ports/analytics.tracker';

/**
 * Handles `checkout.session.completed` events whose `mode === 'payment'`
 * and `metadata.type === 'credit_purchase'`. Grants credits in the ledger,
 * keyed by the underlying PaymentIntent id for idempotency — replayed
 * webhooks (Stripe CLI `events resend`, retry on 5xx) are noops at the
 * repository layer thanks to the unique `(type, referenceId)` index.
 *
 * Security: `customer_details.email` (verified by Stripe) is the source of
 * truth. `metadata.email` is mirrored for human debugging only and never
 * trusted for routing the grant.
 */
const SessionSchema = z.object({
  mode: z.literal('payment'),
  payment_status: z.string(),
  customer_details: z
    .object({ email: z.string().email().nullable().optional() })
    .nullish(),
  payment_intent: z.union([
    z.string(),
    z.object({ id: z.string() }),
    z.null(),
    z.undefined(),
  ]),
  amount_total: z.number().int().nullable().optional(),
  metadata: z
    .object({
      type: z.string().optional(),
      quantity: z.string().optional(),
    })
    .passthrough()
    .nullish(),
});

@Injectable()
export class HandleCreditPurchaseUseCase {
  private readonly logger = new Logger(HandleCreditPurchaseUseCase.name);

  constructor(
    @Inject(CREDIT_LEDGER_REPOSITORY)
    private readonly creditLedger: CreditLedgerRepository,
    @Inject(ANALYTICS_TRACKER) private readonly analytics: AnalyticsTracker,
  ) {}

  async execute(rawSession: unknown): Promise<void> {
    const parsed = SessionSchema.safeParse(rawSession);
    if (!parsed.success) {
      this.logger.warn(
        `credit_purchase: malformed payload — ${parsed.error.message}`,
      );
      return;
    }
    const session = parsed.data;

    // Async payment methods (SEPA, bank transfer) fire this event before the
    // money has actually moved. We only grant on confirmed paid sessions.
    // For async paid flows, listen to `checkout.session.async_payment_succeeded`
    // in a future iteration if those payment methods are enabled in Stripe.
    if (session.payment_status !== 'paid') {
      this.logger.log(
        `credit_purchase: skipping non-paid session (status=${session.payment_status})`,
      );
      return;
    }

    const email = session.customer_details?.email ?? null;
    if (!email) {
      this.logger.warn(
        `credit_purchase: missing customer_details.email — grant skipped`,
      );
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!paymentIntentId) {
      this.logger.warn(
        `credit_purchase: missing payment_intent id — cannot idempotently grant`,
      );
      return;
    }

    const quantityFromMetadata = Number(session.metadata?.quantity ?? '');
    if (!Number.isInteger(quantityFromMetadata) || quantityFromMetadata <= 0) {
      this.logger.warn(
        `credit_purchase: invalid quantity in metadata=${session.metadata?.quantity}`,
      );
      return;
    }

    // Defensive cross-check: amount_total must match the known pack price.
    // We warn on mismatch but trust the quantity from metadata — the user
    // already paid, refusing the grant would be worse than a logged anomaly.
    const expectedTotal = CREDIT_PACK_AMOUNTS[quantityFromMetadata];
    if (
      typeof session.amount_total === 'number' &&
      expectedTotal !== undefined &&
      session.amount_total !== expectedTotal
    ) {
      this.logger.warn(
        `credit_purchase: amount_total=${session.amount_total} mismatches expected=${expectedTotal} ` +
          `(qty=${quantityFromMetadata}). Granting anyway.`,
      );
    }

    await this.creditLedger.grant({
      email,
      amount: quantityFromMetadata,
      source: 'purchase',
      referenceId: paymentIntentId,
    });

    this.analytics.capture({
      event: 'credit_pack_purchased',
      distinctId: email,
      properties: { quantity: quantityFromMetadata },
    });

    this.logger.log(
      `credit_purchase: granted email=${email} amount=${quantityFromMetadata} ref=${paymentIntentId}`,
    );
  }
}
