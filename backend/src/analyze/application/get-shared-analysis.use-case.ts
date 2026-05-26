import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY, PROFILE_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ProfileRepository } from '../ports/profile.repository';
import { mergeHotAndDeep } from '../dto/analyze-response.dto';
import type { AnalyzeResponse } from '../dto/analyze-response.dto';

export type SharedAnalysis = {
  id: number;
  jobLabel: string | null;
  company: string | null;
  result: AnalyzeResponse | null;
  profile: { displayName: string | null; avatarUrl: string | null } | null;
  createdAt: Date;
};

@Injectable()
export class GetSharedAnalysisUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
  ) {}

  async execute(token: string): Promise<SharedAnalysis | null> {
    const detail = await this.analyses.findByShareToken(token);
    if (!detail) return null;

    if (detail.result && detail.deepAnalysis) {
      detail.result = mergeHotAndDeep(detail.result, detail.deepAnalysis);
    }
    if (detail.result && detail.negotiationAnalysis) {
      (detail.result as any).negotiation_analysis = detail.negotiationAnalysis;
    }

    let profile: { displayName: string | null; avatarUrl: string | null } | null = null;
    if (detail.email) {
      const p = await this.profiles.findByEmail(detail.email);
      if (p) profile = { displayName: p.displayName, avatarUrl: p.avatarUrl };
    }

    return {
      id: detail.id,
      jobLabel: detail.jobLabel,
      company: detail.company,
      result: detail.result,
      profile,
      createdAt: detail.createdAt,
    };
  }
}
