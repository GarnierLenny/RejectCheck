import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY, SUBSCRIPTION_GATE } from '../ports/tokens';
import type {
  AnalysisRepository,
  HistoryPage,
} from '../ports/analysis.repository';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import { shapeStoredResultForPlan } from '../domain/analysis-shaper';

@Injectable()
export class ListHistoryUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(SUBSCRIPTION_GATE) private readonly subs: SubscriptionGate,
  ) {}

  async execute(
    email: string,
    page: number,
    limit: number,
  ): Promise<HistoryPage> {
    const [historyPage, state] = await Promise.all([
      this.analyses.paginateByEmail(email, page, limit),
      this.subs.getState(email),
    ]);

    // History rows carry the full stored result — redact premium content for
    // non-subscribers. Note: per-analysis one-time unlocks are not resolved
    // here (the list select skips that column); the detail endpoint applies
    // them when the analysis is opened.
    const ctx = {
      premium: state.hasActiveSubscription,
      hired: state.isHired,
    };
    return {
      ...historyPage,
      data: historyPage.data.map((row) =>
        row.result
          ? { ...row, result: shapeStoredResultForPlan(row.result, ctx) }
          : row,
      ),
    };
  }
}
