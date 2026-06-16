import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ANALYSIS_REPOSITORY,
  CLAUDE_PROVIDER,
  PROFILE_REPOSITORY,
} from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import type { ProfileRepository } from '../ports/profile.repository';
import type {
  AnalyzeResponse,
  DeepAnalyzeResponse,
  HotAnalyzeResponse,
} from '../dto/analyze-response.dto';
import { AnalysisNotFoundException } from '../../common/exceptions';
import { EnqueueEmailUseCase } from '../../notifications/application/enqueue-email.use-case';
import type { EmailLocale } from '../../notifications/domain/email.types';

/**
 * Re-runs the deep pass for an analysis whose first deep generation failed
 * (silent failure during the SSE flow). Authentication is enforced by the
 * controller via SupabaseGuard.
 *
 * If the analysis already has a stored deepAnalysis, we return it unchanged
 * (fast path for users that retry while a previous attempt actually succeeded).
 */
@Injectable()
export class RegenerateDeepUseCase {
  private readonly logger = new Logger(RegenerateDeepUseCase.name);

  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
    private readonly enqueueEmail: EnqueueEmailUseCase,
  ) {}

  async execute(
    analysisId: number,
    email: string,
    generateBridgeProject = true,
  ): Promise<DeepAnalyzeResponse> {
    const stored = await this.analyses.findById(analysisId, email);
    if (!stored || !stored.result) {
      throw new AnalysisNotFoundException(analysisId);
    }

    if (stored.deepAnalysis) return stored.deepAnalysis;

    if (!stored.jobDescription) {
      throw new BadRequestException(
        'Job description not available for this analysis',
      );
    }

    const profile = await this.profiles.findByEmail(email).catch(() => null);

    const hot = extractHot(stored.result, stored.deepAnalysis);

    const deep = await this.claude.analyzeApplicationDeep({
      hot,
      jobText: stored.jobDescription,
      cvText: stored.cvText ?? '',
      githubInfo: stored.githubInfo ?? '',
      linkedinText: stored.linkedinText ?? '',
      motivationLetterText: stored.motivationLetter ?? '',
      challengeStats: null,
      locale: stored.jdLanguage ?? 'en',
      userRoleType: profile?.roleType ?? null,
      userRoleTypeOther: profile?.roleTypeOther ?? null,
      userExperienceLevel: profile?.experienceLevel ?? null,
      userTechStack: profile?.techStack ?? [],
      userLanguages: profile?.languages ?? [],
      generateBridgeProject,
    });

    await this.analyses.attachDeepAnalysis(analysisId, email, deep);

    // Fresh deep completion → notify the user. Fire-and-forget + idempotent
    // (dedupeKey analysis_ready:email:analysisId), so it never fires twice for
    // the same analysis and never blocks/fails the deep pass. The early return
    // above (cached deepAnalysis) means this only runs on a real completion.
    void this.enqueueEmail
      .execute({
        to: email,
        locale: stored.jdLanguage === 'fr' ? 'fr' : ('en' as EmailLocale),
        context: {
          type: 'analysis_ready',
          analysisId,
          role: stored.result.job_details?.title ?? null,
        },
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `analysis_ready enqueue failed (analysisId=${analysisId}): ${msg}`,
        );
      });

    return deep;
  }
}

/**
 * Strips the deep-pass fields from a stored AnalyzeResponse to recover the
 * hot-pass shape needed by `analyzeApplicationDeep` for grounding.
 *
 * `technical_analysis` may live in either `result` (new format) or
 * `deepAnalysis` (mid-format) — we accept both for backward compatibility.
 */
function extractHot(
  result: AnalyzeResponse,
  deepAnalysis: { technical_analysis?: unknown } | null,
): HotAnalyzeResponse {
  return {
    score: result.score,
    verdict: result.verdict,
    confidence: result.confidence,
    breakdown: result.breakdown,
    ats_simulation: {
      would_pass: result.ats_simulation.would_pass,
      score: result.ats_simulation.score,
      threshold: result.ats_simulation.threshold,
      reason: result.ats_simulation.reason,
    },
    seniority_analysis: {
      expected: result.seniority_analysis.expected,
      detected: result.seniority_analysis.detected,
      gap: result.seniority_analysis.gap,
      strength: result.seniority_analysis.strength,
    },
    cv_tone: {
      detected: result.cv_tone.detected,
      examples: result.cv_tone.examples,
    },
    audit: {
      cv: {
        score: result.audit.cv.score,
        strengths: result.audit.cv.strengths,
        issues: result.audit.cv.issues.map(({ fix: _fix, ...rest }) => rest),
      },
      github: {
        score: result.audit.github.score,
        strengths: result.audit.github.strengths,
        issues: result.audit.github.issues.map(
          ({ fix: _fix, ...rest }) => rest,
        ),
      },
      linkedin: {
        score: result.audit.linkedin.score,
        strengths: result.audit.linkedin.strengths,
        issues: result.audit.linkedin.issues.map(
          ({ fix: _fix, ...rest }) => rest,
        ),
      },
      jd_match: result.audit.jd_match,
    },
    hidden_red_flags: result.hidden_red_flags.map(
      ({ fix: _fix, ...rest }) => rest,
    ),
    correlation: result.correlation,
    job_details: result.job_details,
    // New format: technical_analysis is part of `result` (hot). Mid-format:
    // it was stored on `deepAnalysis`. Either way, surface it to the deep
    // pass for grounding context. Cast through unknown — the consumers only
    // read the shape, the Zod schema doesn't re-validate here.
    technical_analysis: (result.technical_analysis ??
      (deepAnalysis?.technical_analysis as
        | HotAnalyzeResponse['technical_analysis']
        | undefined))!,
    challenge_analysis: result.challenge_analysis,
  };
}
