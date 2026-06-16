import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  defaultDedupeKey,
  emailCategoryOf,
  type EmailJobPayload,
} from '../domain/email.types';
import { EmailJobsService } from './email-jobs.service';

/**
 * Public entry point for sending an email. Writes a `queued` EmailLog row keyed
 * by a unique dedupeKey FIRST — so a duplicate enqueue (retry, double event,
 * replayed webhook) is a no-op at the DB level — then hands the job to the
 * transport (BullMQ or in-process). Feature modules depend on this, never on
 * Resend or BullMQ directly.
 */
@Injectable()
export class EnqueueEmailUseCase {
  private readonly logger = new Logger(EnqueueEmailUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: EmailJobsService,
  ) {}

  async execute(input: EmailJobPayload): Promise<{ enqueued: boolean }> {
    const dedupeKey = input.dedupeKey ?? defaultDedupeKey(input);
    const payload: EmailJobPayload = { ...input, dedupeKey };
    const type = payload.context.type;

    try {
      await this.prisma.emailLog.create({
        data: {
          email: payload.to,
          type,
          category: emailCategoryOf(type),
          locale: payload.locale,
          status: 'queued',
          dedupeKey,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // Already enqueued/sent for this dedupeKey — idempotent no-op.
        this.logger.log(`email skipped (duplicate) dedupeKey=${dedupeKey}`);
        return { enqueued: false };
      }
      throw err;
    }

    try {
      await this.jobs.enqueue(payload);
    } catch (err) {
      // The log row is written before enqueue for concurrency-safe idempotency.
      // If enqueue then fails, roll it back so the unique dedupeKey doesn't
      // block a later retry (otherwise the email would be stuck forever).
      await this.prisma.emailLog
        .delete({ where: { dedupeKey } })
        .catch(() => undefined);
      throw err;
    }
    return { enqueued: true };
  }
}
