import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { AnalysisDetail } from '../domain/analysis.types';
import { mergeHotAndDeep } from '../dto/analyze-response.dto';
import { AnalysisNotFoundException } from '../../common/exceptions';

@Injectable()
export class GetAnalysisUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
  ) {}

  async execute(id: number, email: string): Promise<AnalysisDetail> {
    const detail = await this.analyses.findDetailById(id, email);
    if (!detail) throw new AnalysisNotFoundException(id);

    // For analyses created since the hot/deep split, `result` is the hot-only
    // shape and `deepAnalysis` holds the cold-path content. Re-merge here so
    // the frontend always receives the full shape it expects.
    //
    // Legacy analyses (created before the split) already have everything in
    // `result` — `deepAnalysis` is null and the merge becomes a no-op (deep
    // fields stay as they were stored on the legacy `result`).
    if (detail.result && detail.deepAnalysis) {
      detail.result = mergeHotAndDeep(detail.result, detail.deepAnalysis);
    }

    // Merge the negotiation analysis into the result so the frontend can read
    // `result.negotiation_analysis` regardless of how the analysis was loaded.
    if (detail.result && detail.negotiationAnalysis) {
      detail.result.negotiation_analysis = detail.negotiationAnalysis;
    }

    return detail;
  }
}
