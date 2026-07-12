import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY, SUBSCRIPTION_GATE } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import type { AnalysisDetail } from '../domain/analysis.types';
import { mergeHotAndDeep } from '../dto/analyze-response.dto';
import { shapeStoredResultForPlan } from '../domain/analysis-shaper';
import { AnalysisNotFoundException } from '../../common/exceptions';

@Injectable()
export class GetAnalysisUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(SUBSCRIPTION_GATE) private readonly subs: SubscriptionGate,
  ) {}

  async execute(id: number, email: string): Promise<AnalysisDetail> {
    const detail = await this.analyses.findDetailById(id, email);
    if (!detail) throw new AnalysisNotFoundException(id);

    // For analyses created during the hot/deep split, `result` is the hot-only
    // shape and `deepAnalysis` holds the cold-path content. Re-merge here so
    // the frontend always receives the full shape it expects.
    //
    // Legacy and post-split analyses already have everything in `result` —
    // `deepAnalysis` is null and the merge becomes a no-op.
    if (detail.result && detail.deepAnalysis) {
      detail.result = mergeHotAndDeep(detail.result, detail.deepAnalysis);
    }

    // Merge the negotiation analysis into the result so the frontend can read
    // `result.negotiation_analysis` regardless of how the analysis was loaded.
    if (detail.result && detail.negotiationAnalysis) {
      detail.result.negotiation_analysis = detail.negotiationAnalysis;
    }

    // The stored result is always complete — redact premium content here,
    // according to the requester's plan (or the one-time unlock on this
    // analysis). This is the real gate; the frontend only styles it.
    if (detail.result) {
      const state = await this.subs.getState(email);
      detail.result = shapeStoredResultForPlan(detail.result, {
        premium: state.hasActiveSubscription || detail.premiumUnlocked,
        hired: state.isHired,
      });
    }

    return detail;
  }
}
