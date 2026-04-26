import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';

@Injectable()
export class DeleteAnalysisUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
  ) {}

  execute(id: number, email: string): Promise<void> {
    return this.analyses.deleteByIdForEmail(id, email);
  }
}
