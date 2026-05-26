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
}
