import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ANALYSIS_REPOSITORY,
  CLAUDE_PROVIDER,
  PROFILE_REPOSITORY,
} from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ProfileRepository } from '../ports/profile.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import { AnalysisNotFoundException } from '../../common/exceptions';

export type GenerateCoverLetterResult = {
  coverLetter: string;
  detectedLanguage: string;
};

/**
 * Premium gating ('hired' tier) is enforced at the route level via
 * @RequiresPremium('hired') — the use case only owns the generation flow.
 */
@Injectable()
export class GenerateCoverLetterUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
  ) {}

  async execute(
    email: string,
    analysisId: number,
    language: string,
  ): Promise<GenerateCoverLetterResult> {
    const analysis = await this.analyses.findById(analysisId, email);
    if (!analysis || !analysis.result) {
      throw new AnalysisNotFoundException(analysisId);
    }
    if (!analysis.jobDescription) {
      throw new BadRequestException(
        'Job description not available for this analysis',
      );
    }

    const profile = await this.profiles.findByEmail(email);
    const candidateName =
      profile?.coverLetterName || profile?.displayName || null;

    const detectedLanguage =
      language === 'auto' ? (analysis.jdLanguage ?? 'en') : language;

    const coverLetter = await this.claude.generateCoverLetter({
      jobDescription: analysis.jobDescription,
      cvText: analysis.cvText,
      linkedinText: analysis.linkedinText,
      githubInfo: analysis.githubInfo,
      result: analysis.result,
      jobLabel: analysis.jobLabel,
      company: analysis.company,
      candidateName,
      language: detectedLanguage,
    });

    await this.analyses.attachCoverLetter(analysisId, email, coverLetter);

    return { coverLetter, detectedLanguage };
  }
}
