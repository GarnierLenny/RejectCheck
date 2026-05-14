import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import {
  NEGOTIATION_QUEUE,
  type NegotiationJobPayload,
} from '../../../queue/queue.constants';
import { GenerateNegotiationUseCase } from '../../application/generate-negotiation.use-case';

/**
 * BullMQ worker for the negotiation pass (hired-tier only). Delegates to
 * GenerateNegotiationUseCase, which is idempotent — it returns the cached
 * negotiation row if present.
 */
@Processor(NEGOTIATION_QUEUE, { concurrency: 1 })
export class NegotiationProcessor extends WorkerHost {
  private readonly logger = new Logger(NegotiationProcessor.name);

  constructor(
    private readonly generateNegotiation: GenerateNegotiationUseCase,
  ) {
    super();
  }

  async process(job: Job<NegotiationJobPayload>): Promise<void> {
    const { analysisId, email, locale } = job.data;
    const startedAt = Date.now();
    try {
      await this.generateNegotiation.execute(analysisId, email, locale);
      this.logger.log(
        `Negotiation pass completed (analysisId=${analysisId}, ms=${
          Date.now() - startedAt
        })`,
      );
    } catch (err: unknown) {
      Sentry.captureException(err, {
        tags: { queue: NEGOTIATION_QUEUE, analysisId: String(analysisId) },
      });
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Negotiation job failed (analysisId=${analysisId}): ${msg}`,
      );
      throw err;
    }
  }
}
