import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { EmailLocale } from '../domain/email.types';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Schedules the post-signup drip sequence (D1, D3) by inserting `pending`
 * ScheduledEmail rows. Idempotent per recipient (unique dedupeKey + skipDuplicates),
 * so calling it twice for the same user is a no-op. The DripSchedulerCron later
 * sends each row when due, skipping users who converted or opted out.
 */
@Injectable()
export class ScheduleDripsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(email: string, locale: EmailLocale): Promise<void> {
    const now = Date.now();
    await this.prisma.scheduledEmail.createMany({
      data: [
        {
          email,
          type: 'drip_d1',
          locale,
          sendAfter: new Date(now + 1 * DAY),
          dedupeKey: `drip_d1:${email}`,
        },
        {
          email,
          type: 'drip_d3',
          locale,
          sendAfter: new Date(now + 3 * DAY),
          dedupeKey: `drip_d3:${email}`,
        },
      ],
      skipDuplicates: true,
    });
  }
}
