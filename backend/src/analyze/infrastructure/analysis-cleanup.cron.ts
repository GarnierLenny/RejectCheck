import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';

const TTL_DAYS = 7;

/**
 * GDPR TTL for anonymous analyses: once a day, scrub the payload (CV, result,
 * etc.) of unclaimed anonymous analyses older than TTL_DAYS. The row itself is
 * kept (ip + createdAt) so IP rate-limiting is unaffected; it just no longer
 * holds PII and can no longer be claimed.
 */
@Injectable()
export class AnalysisCleanupCron {
  private readonly logger = new Logger(AnalysisCleanupCron.name);

  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async run(): Promise<void> {
    const cutoff = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000);
    const scrubbed = await this.analyses.scrubUnclaimedOlderThan(cutoff);
    if (scrubbed > 0) {
      this.logger.log(
        `scrubbed ${scrubbed} unclaimed anonymous analyses (> ${TTL_DAYS}d)`,
      );
    }
  }
}
