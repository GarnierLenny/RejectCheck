import { Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY, PROFILE_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ProfileRepository } from '../ports/profile.repository';
import { mergeHotAndDeep } from '../dto/analyze-response.dto';
import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import { shapeStoredResultForPlan } from '../domain/analysis-shaper';

export type SharedAnalysis = {
  id: number;
  jobLabel: string | null;
  company: string | null;
  result: AnalyzeResponse | null;
  profile: { displayName: string | null; avatarUrl: string | null } | null;
  createdAt: Date;
  // Source documents, so the public view renders the exact same split-panel
  // (parsed CV + highlights on the left) the owner sees. The owner opted into
  // a public link, so exposing these is intentional.
  cvTextFormatted: string | null;
  cvFileUrl: string | null;
  linkedinTextFormatted: string | null;
  liFileUrl: string | null;
  coverLetter: string | null;
  mlFileUrl: string | null;
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
    // Public share links are always shaped free, whatever the owner's plan —
    // this both protects paid content and strips negotiation entirely.
    if (detail.result) {
      detail.result = shapeStoredResultForPlan(detail.result, {
        premium: false,
        hired: false,
      });
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
      cvTextFormatted: detail.cvTextFormatted,
      cvFileUrl: detail.cvFileUrl,
      linkedinTextFormatted: detail.linkedinTextFormatted,
      liFileUrl: detail.liFileUrl,
      // Cover letter parsed text lives in `motivationLetter`; `coverLetter` is
      // the HIRED-generated one. Prefer whichever the owner has.
      coverLetter: detail.coverLetter ?? detail.motivationLetter,
      mlFileUrl: detail.mlFileUrl,
    };
  }
}
