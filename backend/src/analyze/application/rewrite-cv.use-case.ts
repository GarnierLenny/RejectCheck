import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY, CLAUDE_PROVIDER } from '../ports/tokens';
import { SUBSCRIPTION_GATE } from '../../common/ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import {
  AnalysisNotFoundException,
  PremiumRequiredException,
} from '../../common/exceptions';
import type { RewriteResponse } from '../dto/rewrite-response.dto';

/**
 * Max CV rewrites generated per analysis. Bounds the worst-case LLM cost of a
 * single unlock/subscription (each generation ≈ a Claude call). Applies to
 * subscribers AND one-time unlocks alike.
 */
export const REWRITE_REGEN_CAP = 5;

/**
 * Entitlement is enforced HERE (not via @RequiresPremium) because the CV
 * rewrite unlocks two ways: an active subscription, OR a one-time "unlock this
 * CV" purchase scoped to this specific analysis. The use case is the only place
 * with the analysisId needed for the per-analysis check.
 */
@Injectable()
export class RewriteCvUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
    @Inject(SUBSCRIPTION_GATE) private readonly subscription: SubscriptionGate,
  ) {}

  async execute(
    analysisId: number,
    email: string,
    locale = 'en',
  ): Promise<RewriteResponse> {
    const entitled =
      (await this.subscription.isPremium(email)) ||
      (await this.analyses.isPremiumUnlocked(analysisId, email));
    if (!entitled) {
      throw new PremiumRequiredException(
        'CV rewrite requires a subscription or a one-time unlock for this analysis.',
        { requiredPlan: 'shortlisted' },
      );
    }

    const analysis = await this.analyses.findById(analysisId, email);
    if (!analysis) throw new AnalysisNotFoundException(analysisId);

    // Cost cap: bound rewrites per analysis (subscribers + unlocks alike).
    if (analysis.rewriteCount >= REWRITE_REGEN_CAP) {
      throw new BadRequestException({
        message:
          locale === 'fr'
            ? `Limite de régénérations atteinte (${REWRITE_REGEN_CAP} max pour ce CV).`
            : `Regeneration limit reached (${REWRITE_REGEN_CAP} max for this CV).`,
        code: 'REWRITE_LIMIT_REACHED',
      });
    }
    if (!analysis.cvText) {
      throw new BadRequestException('CV text not available for this analysis');
    }
    if (!analysis.result) {
      throw new BadRequestException(
        'Analysis result not available — cannot rewrite without context',
      );
    }

    const rewrite = await this.claude.rewriteCv({
      cvText: analysis.cvText,
      result: analysis.result,
      locale,
    });

    await this.analyses.attachRewrite(analysisId, email, {
      reconstructed_cv: rewrite.reconstructed_cv,
    });
    // Count only successful generations (the call that incurred the cost).
    await this.analyses.incrementRewriteCount(analysisId, email);

    return rewrite;
  }
}
