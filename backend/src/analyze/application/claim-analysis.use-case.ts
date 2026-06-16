import { Inject, Injectable, Logger } from '@nestjs/common';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';

/**
 * Attaches an unclaimed anonymous analysis to the authenticated user. The
 * client holds the one-time claimToken (returned in the analysis_done event)
 * and posts it right after signup, so the anonymous result they just saw
 * lands in their account. Returns null if the token is unknown or already
 * claimed (idempotent / safe to retry).
 */
@Injectable()
export class ClaimAnalysisUseCase {
  private readonly logger = new Logger(ClaimAnalysisUseCase.name);

  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
  ) {}

  async execute(
    email: string,
    claimToken: string,
  ): Promise<{ analysisId: number } | null> {
    const claimed = await this.analyses.claimByToken(email, claimToken);
    if (!claimed) return null;
    this.logger.log(`anonymous analysis ${claimed.id} claimed by ${email}`);
    return { analysisId: claimed.id };
  }
}
