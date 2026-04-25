import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY, CLAUDE_PROVIDER } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import { AnalysisNotFoundException } from '../../common/exceptions';
import type { RewriteResponse } from '../dto/rewrite-response.dto';

/**
 * Premium gating is enforced at the route level via @RequiresPremium() — the
 * use case only owns the rewrite business rules (CV must exist, must have a
 * stored analysis context). Adding a redundant subscription check here would
 * violate SRP and make integration tests harder to set up.
 */
@Injectable()
export class RewriteCvUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
  ) {}

  async execute(
    analysisId: number,
    email: string,
    locale = 'en',
  ): Promise<RewriteResponse> {
    const analysis = await this.analyses.findById(analysisId, email);
    if (!analysis) throw new AnalysisNotFoundException(analysisId);
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

    return rewrite;
  }
}
