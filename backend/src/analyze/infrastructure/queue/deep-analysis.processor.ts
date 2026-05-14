import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import {
  DEEP_ANALYSIS_QUEUE,
  type DeepAnalysisJobPayload,
} from '../../../queue/queue.constants';
import { RegenerateDeepUseCase } from '../../application/regenerate-deep.use-case';

/**
 * BullMQ worker for the deep analysis pass. Delegates to the existing
 * RegenerateDeepUseCase, which is idempotent — it returns cached deep
 * analysis if one is already attached to the row. That makes retries safe.
 *
 * Concurrency: 1 — on Railway Hobby (1 vCPU, ~1GB) we let jobs run one at
 * a time to keep memory predictable. Bump this when Railway is upgraded.
 */
@Processor(DEEP_ANALYSIS_QUEUE, { concurrency: 1 })
export class DeepAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(DeepAnalysisProcessor.name);

  constructor(private readonly regenerateDeep: RegenerateDeepUseCase) {
    super();
  }

  async process(job: Job<DeepAnalysisJobPayload>): Promise<void> {
    const { analysisId, email } = job.data;
    const startedAt = Date.now();
    try {
      await this.regenerateDeep.execute(analysisId, email);
      this.logger.log(
        `Deep pass completed (analysisId=${analysisId}, ms=${
          Date.now() - startedAt
        })`,
      );
    } catch (err: unknown) {
      Sentry.captureException(err, {
        tags: { queue: DEEP_ANALYSIS_QUEUE, analysisId: String(analysisId) },
      });
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Deep pass job failed (analysisId=${analysisId}): ${msg}`,
      );
      throw err;
    }
  }
}
