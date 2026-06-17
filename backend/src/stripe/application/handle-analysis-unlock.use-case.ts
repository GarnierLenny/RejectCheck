import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { ANALYSIS_UNLOCK_PRICE_CENTS } from './create-analysis-unlock-checkout-session.use-case';

/**
 * Handles `checkout.session.completed` events whose `mode === 'payment'` and
 * `metadata.type === 'analysis_unlock'`. Marks the CV rewrite unlocked for a
 * single analysis (premiumUnlockedAt), scoped to the verified buyer's email.
 *
 * Idempotent by nature: re-marking just refreshes the timestamp, so replayed
 * webhooks (Stripe CLI resend, 5xx retries) are harmless — no ledger key needed.
 *
 * Security: `customer_details.email` (verified by Stripe) is the source of
 * truth; the update is scoped to (id = analysisId AND email = buyer), so a
 * tampered metadata.analysisId can only ever unlock the buyer's OWN analyses.
 */
const SessionSchema = z.object({
  mode: z.literal('payment'),
  payment_status: z.string(),
  customer_details: z
    .object({ email: z.string().email().nullable().optional() })
    .nullish(),
  amount_total: z.number().int().nullable().optional(),
  metadata: z
    .object({
      type: z.string().optional(),
      analysisId: z.string().optional(),
    })
    .passthrough()
    .nullish(),
});

@Injectable()
export class HandleAnalysisUnlockUseCase {
  private readonly logger = new Logger(HandleAnalysisUnlockUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(rawSession: unknown): Promise<void> {
    const parsed = SessionSchema.safeParse(rawSession);
    if (!parsed.success) {
      this.logger.warn(
        `analysis_unlock: malformed payload — ${parsed.error.message}`,
      );
      return;
    }
    const session = parsed.data;

    if (session.payment_status !== 'paid') {
      this.logger.log(
        `analysis_unlock: skipping non-paid session (status=${session.payment_status})`,
      );
      return;
    }

    const email = session.customer_details?.email ?? null;
    if (!email) {
      this.logger.warn(
        `analysis_unlock: missing customer_details.email — unlock skipped`,
      );
      return;
    }

    const analysisId = Number(session.metadata?.analysisId ?? '');
    if (!Number.isInteger(analysisId) || analysisId <= 0) {
      this.logger.warn(
        `analysis_unlock: invalid analysisId in metadata=${session.metadata?.analysisId}`,
      );
      return;
    }

    // Defensive: warn (don't refuse) if the paid amount doesn't match the known
    // unlock price — the user already paid, so we grant anyway and log.
    if (
      typeof session.amount_total === 'number' &&
      session.amount_total !== ANALYSIS_UNLOCK_PRICE_CENTS
    ) {
      this.logger.warn(
        `analysis_unlock: amount_total=${session.amount_total} mismatches expected=${ANALYSIS_UNLOCK_PRICE_CENTS}. Unlocking anyway.`,
      );
    }

    const res = await this.prisma.analysis.updateMany({
      where: { id: analysisId, email },
      data: { premiumUnlockedAt: new Date() },
    });

    if (res.count === 0) {
      this.logger.warn(
        `analysis_unlock: no analysis matched id=${analysisId} for the buyer — nothing unlocked`,
      );
      return;
    }

    this.logger.log(
      `analysis_unlock: unlocked CV rewrite for analysis ${analysisId}`,
    );
  }
}
