import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import { EMAIL_QUEUE, QUEUE_ENABLED } from '../../queue/queue.constants';
import type { EmailJobPayload } from '../domain/email.types';
import { RenderAndSendEmailUseCase } from './render-and-send-email.use-case';

/**
 * Façade for sending an email out-of-band. Mirrors LlmJobsService:
 *  - BullMQ wired (REDIS_URL set) → persisted, retried, rate-limited job.
 *  - otherwise → setImmediate, so the request handler returns immediately and
 *    the email renders/sends in the same Node process.
 * The dedupeKey becomes the BullMQ jobId, so a duplicate enqueue is a no-op.
 */
@Injectable()
export class EmailJobsService {
  private readonly logger = new Logger(EmailJobsService.name);

  constructor(
    @Optional()
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue<EmailJobPayload> | undefined,
    private readonly moduleRef: ModuleRef,
  ) {}

  async enqueue(payload: EmailJobPayload): Promise<void> {
    if (QUEUE_ENABLED && this.emailQueue) {
      await this.emailQueue.add('email', payload, {
        ...(payload.dedupeKey ? { jobId: payload.dedupeKey } : {}),
      });
      return;
    }
    this.runInline(payload);
  }

  private runInline(payload: EmailJobPayload): void {
    setImmediate(() => {
      const uc = this.moduleRef.get(RenderAndSendEmailUseCase, { strict: false });
      uc.execute(payload).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Inline email send failed (type=${payload.context.type}, to=${payload.to}): ${msg}`,
        );
      });
    });
  }
}
