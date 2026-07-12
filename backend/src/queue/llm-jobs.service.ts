import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import {
  NEGOTIATION_QUEUE,
  QUEUE_ENABLED,
  type NegotiationJobPayload,
} from './queue.constants';
import { GenerateNegotiationUseCase } from '../analyze/application/generate-negotiation.use-case';

/**
 * Façade for offloading LLM-heavy work (negotiation pass) out of the HTTP
 * request handler.
 *
 *  - If BullMQ queues are wired (REDIS_URL set), jobs are persisted and run
 *    by registered processors with retries and concurrency control.
 *  - If not, the work is scheduled via setImmediate so the SSE response can
 *    close immediately while the negotiation runs in the same Node event
 *    loop. The frontend polls to pick up the result.
 *
 * GenerateNegotiationUseCase is idempotent — it returns the cached row if a
 * previous attempt already succeeded, so duplicate enqueues are safe.
 */
@Injectable()
export class LlmJobsService {
  private readonly logger = new Logger(LlmJobsService.name);

  constructor(
    @Optional()
    @InjectQueue(NEGOTIATION_QUEUE)
    private readonly negotiationQueue: Queue<NegotiationJobPayload> | undefined,
    private readonly moduleRef: ModuleRef,
  ) {}

  async enqueueNegotiation(payload: NegotiationJobPayload): Promise<void> {
    if (QUEUE_ENABLED && this.negotiationQueue) {
      await this.negotiationQueue.add('negotiation', payload, {
        jobId: `nego-${payload.analysisId}`,
      });
      return;
    }
    this.runInlineNegotiation(payload);
  }

  private runInlineNegotiation(payload: NegotiationJobPayload): void {
    setImmediate(() => {
      const uc = this.moduleRef.get(GenerateNegotiationUseCase, {
        strict: false,
      });
      uc.execute(payload.analysisId, payload.email, payload.locale).catch(
        (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Inline negotiation pass failed (analysisId=${payload.analysisId}): ${msg}`,
          );
        },
      );
    });
  }
}
