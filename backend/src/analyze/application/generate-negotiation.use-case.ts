import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY, CLAUDE_PROVIDER } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';
import { extractRoadmapItems } from '../domain/roadmap-items';
import { AnalysisNotFoundException } from '../../common/exceptions';

/**
 * Lazy fallback for HIRED users opening the Negotiation tab on an analysis
 * that was created before the feature shipped (or whose initial generation
 * failed). Premium gating ('hired' tier) is enforced at the route level via
 * @RequiresPremium('hired') — this use case only owns the generation flow.
 *
 * If a cached negotiation already exists on the analysis row, we return it
 * unchanged; otherwise we call Claude, persist, and return the new playbook.
 */
@Injectable()
export class GenerateNegotiationUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
  ) {}

  async execute(
    analysisId: number,
    email: string,
    locale = 'en',
  ): Promise<NegotiationAnalysis> {
    const detail = await this.analyses.findDetailById(analysisId, email);
    if (!detail || !detail.result) {
      throw new AnalysisNotFoundException(analysisId);
    }

    // Cache hit only if the stored entry has the `period` field. Pre-period
    // entries (generated before period awareness shipped) get regenerated so
    // the frontend renders correct units (/day vs /year).
    if (detail.negotiationAnalysis && (detail.negotiationAnalysis as { period?: string }).period) {
      return detail.negotiationAnalysis;
    }

    if (!detail.jobDescription) {
      throw new BadRequestException(
        'Job description not available for this analysis',
      );
    }

    const negotiation = await this.claude.generateNegotiation({
      jobText: detail.jobDescription,
      result: detail.result,
      roadmapItems: extractRoadmapItems(detail.result),
      locale,
    });

    await this.analyses.attachNegotiation(analysisId, email, negotiation);

    return negotiation;
  }
}
