import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import { EMAIL_QUEUE } from '../../../queue/queue.constants';
import type { EmailJobPayload } from '../../domain/email.types';
import { RenderAndSendEmailUseCase } from '../../application/render-and-send-email.use-case';

/**
 * BullMQ worker for outbound email. Delegates to RenderAndSendEmailUseCase.
 * Rate-limited so we stay under the ESP's per-second cap regardless of how
 * many jobs queue up. Throwing triggers BullMQ retry (attempts/backoff).
 */
@Processor(EMAIL_QUEUE, {
  concurrency: 5,
  limiter: { max: 8, duration: 1000 },
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly renderAndSend: RenderAndSendEmailUseCase) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    const { to, context } = job.data;
    try {
      await this.renderAndSend.execute(job.data);
    } catch (err: unknown) {
      Sentry.captureException(err, {
        tags: { queue: EMAIL_QUEUE, emailType: context.type },
      });
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Email job failed (type=${context.type}, to=${to}): ${msg}`);
      throw err;
    }
  }
}
