import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EnqueueEmailUseCase } from '../application/enqueue-email.use-case';
import type { EmailLocale } from '../domain/email.types';

/**
 * Sends due drips. Every 10 min it scans `pending` ScheduledEmail rows whose
 * sendAfter has passed and, per row:
 *   - suppress-on-conversion: if an analysis_ready email was logged for this
 *     user AFTER the drip was scheduled, they're active → cancel the drip.
 *   - otherwise enqueue it (EnqueueEmailUseCase applies suppression/opt-out and
 *     idempotency downstream) and mark it sent.
 * In-process via @nestjs/schedule, so it runs without Redis.
 */
@Injectable()
export class DripSchedulerCron {
  private readonly logger = new Logger(DripSchedulerCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enqueue: EnqueueEmailUseCase,
  ) {}

  @Cron('*/10 * * * *')
  async run(): Promise<void> {
    const due = await this.prisma.scheduledEmail.findMany({
      where: { status: 'pending', sendAfter: { lte: new Date() } },
      take: 100,
      orderBy: { sendAfter: 'asc' },
    });
    if (due.length === 0) return;

    let sent = 0;
    let cancelled = 0;
    for (const drip of due) {
      try {
        // Active since this drip was scheduled? (ran a deep analysis → got an
        // analysis_ready). If so, the "come back" nudge is unwanted → cancel.
        const activity = await this.prisma.emailLog.count({
          where: {
            email: drip.email,
            type: 'analysis_ready',
            createdAt: { gt: drip.createdAt },
          },
        });

        if (activity > 0) {
          await this.markProcessed(drip.id, 'cancelled');
          cancelled++;
          continue;
        }

        await this.enqueue.execute({
          to: drip.email,
          locale: drip.locale as EmailLocale,
          context: { type: drip.type as 'drip_d1' | 'drip_d3' },
        });
        await this.markProcessed(drip.id, 'sent');
        sent++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`drip ${drip.id} (${drip.type}) failed: ${msg}`);
      }
    }
    this.logger.log(`drips processed: ${sent} sent, ${cancelled} cancelled`);
  }

  private markProcessed(id: number, status: 'sent' | 'cancelled') {
    return this.prisma.scheduledEmail.update({
      where: { id },
      data: { status, processedAt: new Date() },
    });
  }
}
