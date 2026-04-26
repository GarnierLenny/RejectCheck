import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { AnalysisDetail } from '../domain/analysis.types';
import { AnalysisNotFoundException } from '../../common/exceptions';

@Injectable()
export class GetAnalysisUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
  ) {}

  async execute(id: number, email: string): Promise<AnalysisDetail> {
    const detail = await this.analyses.findDetailById(id, email);
    if (!detail) throw new AnalysisNotFoundException(id);
    return detail;
  }
}
