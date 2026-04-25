import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type {
  AnalysisRepository,
  HistoryPage,
} from '../ports/analysis.repository';

@Injectable()
export class ListHistoryUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
  ) {}

  execute(email: string, page: number, limit: number): Promise<HistoryPage> {
    return this.analyses.paginateByEmail(email, page, limit);
  }
}
