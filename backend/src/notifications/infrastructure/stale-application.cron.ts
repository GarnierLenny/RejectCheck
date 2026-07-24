import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EnqueueEmailUseCase } from '../application/enqueue-email.use-case';
import {
  STALE_AFTER_DAYS,
  STALE_UNTIL_DAYS,
  daysSinceApplied,
  selectNudgeable,
  type StaleCandidate,
} from '../domain/stale-applications';
import type { EmailLocale } from '../domain/email.types';

/**
 * The product's first EVENT-triggered email: a tracked application has gone
 * quiet. Everything else is calendar-based off signup, so nothing the user
 * actually does can bring them back.
 *
 * OFF BY DEFAULT (STALE_APPLICATION_EMAILS_ENABLED). The application tracker UI
 * ships behind APPLICATIONS_TAB_ENABLED=false, so users cannot currently see or
 * update the applications this would email them about, and no new ones are being
 * created. Emailing someone about a record they can't act on is worse than
 * silence, so this stays dark until that flag is flipped. Nothing about the flag
 * is load-bearing beyond that: flip both and it runs.
 *
 * Idempotency is NOT this cron's job. A stale application stays stale until the
 * user acts, so every run re-selects the same rows; `defaultDedupeKey` makes it
 * once-per-application at the EmailLog layer, which is also concurrency-safe.
 */
@Injectable()
export class StaleApplicationCron {
  private readonly logger = new Logger(StaleApplicationCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enqueue: EnqueueEmailUseCase,
    private readonly config: ConfigService,
  ) {}

  private get enabled(): boolean {
    return (
      this.config.get<string>('STALE_APPLICATION_EMAILS_ENABLED') === 'true'
    );
  }

  /** Hourly: this measures days, so a tighter cadence buys nothing. */
  @Cron('7 * * * *')
  async run(): Promise<void> {
    if (!this.enabled) return;

    const now = new Date();
    const oldest = new Date(now.getTime() - STALE_UNTIL_DAYS * 86_400_000);
    const newest = new Date(now.getTime() - STALE_AFTER_DAYS * 86_400_000);

    // Bound in SQL so the window doesn't grow with the table; the domain
    // predicate then re-checks on exact values rather than trusting the query.
    const rows = await this.prisma.application.findMany({
      where: {
        status: 'applied',
        appliedAt: { gte: oldest, lte: newest },
      },
      select: {
        id: true,
        email: true,
        jobTitle: true,
        company: true,
        status: true,
        appliedAt: true,
      },
      take: 200,
      orderBy: { appliedAt: 'asc' },
    });
    if (rows.length === 0) return;

    const candidates = selectNudgeable(rows as StaleCandidate[], now);
    if (candidates.length === 0) return;

    // There is no per-user locale column: it's captured from the request at
    // signup and only persisted onto the emails we've already sent them. The
    // most recent one is the best signal available, so read it once for the
    // whole batch rather than per row.
    const localeByEmail = await this.localesFor([
      ...new Set(candidates.map((a) => a.email)),
    ]);

    let enqueued = 0;
    let skipped = 0;

    for (const app of candidates) {
      try {
        const locale: EmailLocale = localeByEmail.get(app.email) ?? 'en';

        const res = await this.enqueue.execute({
          to: app.email,
          locale,
          context: {
            type: 'application_stale',
            applicationId: app.id,
            jobTitle: app.jobTitle,
            company: app.company,
            daysSince: daysSinceApplied(app.appliedAt, now),
          },
        });
        if (res.enqueued) enqueued++;
        else skipped++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`stale nudge for application ${app.id} failed: ${msg}`);
      }
    }

    if (enqueued > 0) {
      this.logger.log(
        `stale-application nudges: ${enqueued} enqueued, ${skipped} already sent`,
      );
    }
  }

  /** Last known email locale per recipient. Absent = never emailed = default. */
  private async localesFor(
    emails: string[],
  ): Promise<Map<string, EmailLocale>> {
    const rows = await this.prisma.emailLog.findMany({
      where: { email: { in: emails } },
      select: { email: true, locale: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const out = new Map<string, EmailLocale>();
    for (const r of rows) {
      // Rows are newest-first, so the first hit per email wins.
      if (!out.has(r.email)) out.set(r.email, r.locale === 'fr' ? 'fr' : 'en');
    }
    return out;
  }
}
