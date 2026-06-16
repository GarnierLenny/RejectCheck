import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE, QUEUE_ENABLED } from '../queue/queue.constants';
import { emailSenderProvider } from './infrastructure/email-sender.provider';
import { EmailRenderer } from './infrastructure/email-renderer';
import { EmailProcessor } from './infrastructure/queue/email.processor';
import { RenderAndSendEmailUseCase } from './application/render-and-send-email.use-case';
import { EmailJobsService } from './application/email-jobs.service';
import { EnqueueEmailUseCase } from './application/enqueue-email.use-case';
import { EmailDevController } from './email-dev.controller';
import { EMAIL_SENDER } from './ports/tokens';

// Register the EMAIL_QUEUE only when Redis is wired. forRoot (the shared
// connection) is already set up globally by AnalyzeModule's QueueModule.register()
// — BullModule.forRoot is `global: true` — so here we only add the queue, never
// a second connection. When REDIS_URL is unset, EmailJobsService falls back to
// in-process execution (setImmediate), so the worker isn't registered either.
const queueImports = QUEUE_ENABLED
  ? [
      BullModule.registerQueue({
        name: EMAIL_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 500 },
        },
      }),
    ]
  : [];

const workers = QUEUE_ENABLED ? [EmailProcessor] : [];

/**
 * Outbound notifications (email today). Exports the EMAIL_SENDER port and the
 * EmailJobsService enqueue façade so feature modules can fire emails without
 * touching Resend or BullMQ. Templates/idempotency-log/triggers build on top.
 */
@Module({
  imports: [...queueImports],
  controllers: [EmailDevController],
  providers: [
    emailSenderProvider,
    EmailRenderer,
    RenderAndSendEmailUseCase,
    EmailJobsService,
    EnqueueEmailUseCase,
    ...workers,
  ],
  // EnqueueEmailUseCase is the public API (idempotent send). EMAIL_SENDER stays
  // exported for tests/diagnostics; EmailJobsService is internal transport.
  exports: [EMAIL_SENDER, EnqueueEmailUseCase],
})
export class NotificationsModule {}
