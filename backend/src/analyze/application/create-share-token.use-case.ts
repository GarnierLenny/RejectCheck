import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';

@Injectable()
export class CreateShareTokenUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
  ) {}

  async execute(analysisId: number, email: string): Promise<{ token: string }> {
    const token = await this.analyses.createShareToken(analysisId, email);
    return { token };
  }

  /**
   * Anonymous (logged-out) share: mint a public token from the analysis's
   * claimToken. Returns null if the token is unknown/claimed/empty.
   */
  async executeForClaim(claimToken: string): Promise<{ token: string } | null> {
    const token = await this.analyses.createShareTokenForClaim(claimToken);
    return token ? { token } : null;
  }
}
