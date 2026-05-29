import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import {
  DEEP_ANALYSIS_QUEUE,
  NEGOTIATION_QUEUE,
  QUEUE_ENABLED,
  type DeepAnalysisJobPayload,
  type NegotiationJobPayload,
} from './queue.constants';
import { RegenerateDeepUseCase } from '../analyze/application/regenerate-deep.use-case';
import { GenerateNegotiationUseCase } from '../analyze/application/generate-negotiation.use-case';

/**
 * Façade for offloading LLM-heavy work (deep pass, negotiation pass) out of
 * the HTTP request handler.
 *
 *  - If BullMQ queues are wired (REDIS_URL set), jobs are persisted and run
 *    by registered processors with retries and concurrency control.
 *  - If not, the work is scheduled via setImmediate so the SSE response can
 *    close immediately while the deep/negotiation runs in the same Node
 *    event loop. The frontend polls /api/analyze/:id to pick up the result.
 *
 * The use cases (RegenerateDeepUseCase, GenerateNegotiationUseCase) are
 * idempotent — they return the cached row if a previous attempt already
 * succeeded, so duplicate enqueues are safe.
 */
@Injectable()
export class LlmJobsService {
  private readonly logger = new Logger(LlmJobsService.name);

  constructor(
    @Optional()
    @InjectQueue(DEEP_ANALYSIS_QUEUE)
    private readonly deepQueue: Queue<DeepAnalysisJobPayload> | undefined,
    @Optional()
    @InjectQueue(NEGOTIATION_QUEUE)
    private readonly negotiationQueue: Queue<NegotiationJobPayload> | undefined,
    private readonly moduleRef: ModuleRef,
  ) {}

  async enqueueDeep(payload: DeepAnalysisJobPayload): Promise<void> {
    if (QUEUE_ENABLED && this.deepQueue) {
      await this.deepQueue.add('deep', payload, {
        jobId: `deep-${payload.analysisId}`,
      });
      return;
    }
    this.runInlineDeep(payload);
  }

  async enqueueNegotiation(payload: NegotiationJobPayload): Promise<void> {
    if (QUEUE_ENABLED && this.negotiationQueue) {
      await this.negotiationQueue.add('negotiation', payload, {
        jobId: `nego-${payload.analysisId}`,
      });
      return;
    }
    this.runInlineNegotiation(payload);
  }

  private runInlineDeep(payload: DeepAnalysisJobPayload): void {
    setImmediate(() => {
      const uc = this.moduleRef.get(RegenerateDeepUseCase, { strict: false });
      uc.execute(payload.analysisId, payload.email, payload.generateBridgeProject).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Inline deep pass failed (analysisId=${payload.analysisId}): ${msg}`,
        );
      });
    });
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
