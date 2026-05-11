import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import {
  ANALYSIS_REPOSITORY,
  CHALLENGE_STATS_PROVIDER,
  CLAUDE_PROVIDER,
  GITHUB_PROVIDER,
  PDF_PARSER,
  PROFILE_REPOSITORY,
  SUBSCRIPTION_GATE,
} from '../ports/tokens';
import type {
  AnalysisRepository,
  ApplicationUpsertInput,
} from '../ports/analysis.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import type { GithubProvider } from '../ports/github.provider';
import type { PdfParser } from '../ports/pdf.parser';
import type { ProfileRepository } from '../ports/profile.repository';
import type { ChallengeStatsProvider } from '../ports/challenge-stats.provider';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import { decideQuota } from '../domain/quota.policy';
import type {
  AnalyzeResponse,
  DeepAnalyzeResponse,
} from '../dto/analyze-response.dto';
import { mergeHotAndDeep } from '../dto/analyze-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';
import { extractRoadmapItems } from '../domain/roadmap-items';
import { QuotaExceededException } from '../../common/exceptions';

const MAX_TEXT_CHARS = 12000;

export type AnalyzeCvCommand = {
  cvBuffer?: Buffer;
  jobDescription: string;
  jobLabel?: string;
  linkedinBuffer?: Buffer;
  motivationLetterBuffer?: Buffer;
  motivationLetterText?: string;
  githubUsername?: string;
  email?: string;
  ip?: string;
  isRegistered: boolean;
  locale?: string;
};

export type AnalyzeCvResult = {
  result: AnalyzeResponse;
  analysisId: number | null;
};

export type AnalyzeEvent =
  | { type: 'step'; step: string }
  | { type: 'analysis_delta'; delta: string }
  | {
      type: 'analysis_done';
      /**
       * Merged response with deep fields undefined — the frontend renders
       * skeletons for those sections until `deep_done` arrives.
       */
      result: AnalyzeResponse;
      analysisId: number | null;
    }
  | { type: 'deep_delta'; delta: string }
  | { type: 'deep_done'; deep: DeepAnalyzeResponse }
  | { type: 'negotiation_delta'; delta: string }
  | { type: 'negotiation_done'; negotiation: NegotiationAnalysis };

/**
 * Orchestrates the full analyze flow:
 *  1. quota check (subscription + per-email/per-IP counts)
 *  2. parse CV / LinkedIn / motivation letter PDFs
 *  3. fetch optional GitHub snapshot
 *  4. delegate the model call to ClaudeProvider
 *  5. persist the result (registered users) or a thin GDPR row (anonymous)
 *  6. upsert the matching Application tracker entry for registered users
 *
 * The `onStep` callback streams progress to the SSE controller without leaking
 * any HTTP concern into the use case.
 */
@Injectable()
export class AnalyzeCvUseCase {
  private readonly logger = new Logger(AnalyzeCvUseCase.name);

  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
    @Inject(GITHUB_PROVIDER) private readonly github: GithubProvider,
    @Inject(PDF_PARSER) private readonly pdf: PdfParser,
    @Inject(SUBSCRIPTION_GATE) private readonly subs: SubscriptionGate,
    @Inject(CHALLENGE_STATS_PROVIDER)
    private readonly challengeStats: ChallengeStatsProvider,
    @Inject(PROFILE_REPOSITORY)
    private readonly profiles: ProfileRepository,
  ) {}

  async execute(
    cmd: AnalyzeCvCommand,
    onEvent?: (event: AnalyzeEvent) => void,
  ): Promise<AnalyzeCvResult> {
    if (!cmd.cvBuffer) throw new BadRequestException('CV is required');

    const executeStartedAt = Date.now();
    const timings = {
      parse_inputs_ms: 0,
      profile_ctx_ms: 0,
      claude_hot_ms: 0,
      claude_deep_ms: 0,
      persist_ms: 0,
      negotiation_ms: 0,
    };

    const emit = (event: AnalyzeEvent) => onEvent?.(event);
    const emitStep = (step: string) => emit({ type: 'step', step });

    const subscriptionState = await this.resolveSubscriptionState(cmd.email);
    Sentry.setTag('tier', subscriptionState.tier);
    Sentry.setTag('plan', subscriptionState.plan);

    await this.assertQuota(
      cmd.email,
      cmd.ip,
      subscriptionState.hasActiveSubscription,
    );

    // Emit step labels eagerly so the SSE timeline still reflects the work
    // about to start; the operations themselves run in parallel below.
    emitStep('parsing_cv');
    emitStep('matching_skills');
    if (cmd.motivationLetterBuffer && !cmd.motivationLetterText) {
      emitStep('parsing_motivation_letter');
    }
    if (cmd.githubUsername) emitStep('analyzing_github');

    const jobText = cmd.jobDescription.trim().slice(0, 8000);

    const parseStart = Date.now();
    const [cvText, linkedinText, motivationLetterText, githubSnapshot] =
      await Promise.all([
        this.pdf.parse(cmd.cvBuffer),
        this.tryParse(cmd.linkedinBuffer),
        this.resolveMotivationLetter(
          cmd.motivationLetterText,
          cmd.motivationLetterBuffer,
        ),
        cmd.githubUsername
          ? this.github.fetchProfile(cmd.githubUsername)
          : Promise.resolve(null),
      ]);
    timings.parse_inputs_ms = Date.now() - parseStart;

    const githubInfo = githubSnapshot
      ? JSON.stringify(githubSnapshot, null, 2)
      : '';

    const profileCtxStart = Date.now();
    // Best-effort fetch — never fail the analysis if the challenge module is
    // misbehaving; treat the user as having no track record.
    const challengeSummary =
      cmd.email && cmd.isRegistered
        ? await this.challengeStats.getSummary(cmd.email).catch((err) => {
              this.logger.warn(
                `Challenge stats fetch failed (analysis continues): ${err?.message || err}`,
              );
              return null;
            })
        : null;

    // Profile context drives prompt selection (roleType) and enriches the user
    // message (experienceLevel, techStack, languages). Anonymous users keep
    // the default software-engineer prompt.
    const profile =
      cmd.email && cmd.isRegistered
        ? await this.profiles.findByEmail(cmd.email).catch(() => null)
        : null;
    timings.profile_ctx_ms = Date.now() - profileCtxStart;

    const claudeInput = {
      jobText,
      cvText,
      githubInfo,
      linkedinText,
      motivationLetterText,
      challengeStats: challengeSummary,
      locale: cmd.locale,
      userRoleType: profile?.roleType ?? null,
      userRoleTypeOther: profile?.roleTypeOther ?? null,
      userExperienceLevel: profile?.experienceLevel ?? null,
      userTechStack: profile?.techStack ?? [],
      userLanguages: profile?.languages ?? [],
    };

    emitStep('dual_ai_analysis');
    const hotStart = Date.now();
    const hot = await this.claude.analyzeApplicationHot({
      ...claudeInput,
      onDelta: (delta) => emit({ type: 'analysis_delta', delta }),
    });
    timings.claude_hot_ms = Date.now() - hotStart;

    // Merged result — deep fields are undefined until the deep pass completes.
    // The frontend renders skeletons for those sections in the meantime.
    const result = mergeHotAndDeep(hot, null);

    // Persist before announcing analysis_done so the frontend gets a real
    // analysisId for downstream actions (rewrite, history, negotiation tab).
    const persistStart = Date.now();
    const analysisId = await this.persist({
      cmd,
      result,
      cvText,
      linkedinText,
      githubInfo,
      motivationLetterText,
    });
    timings.persist_ms = Date.now() - persistStart;

    emit({ type: 'analysis_done', result, analysisId });

    // Deep pass — silent fail: if it errors, the frontend will detect a
    // missing deep_done and show "Regenerate" buttons.
    emitStep('deep_analysis');
    const deepStart = Date.now();
    try {
      const deep = await this.claude.analyzeApplicationDeep({
        ...claudeInput,
        hot,
        onDelta: (delta) => emit({ type: 'deep_delta', delta }),
      });
      Object.assign(result, mergeHotAndDeep(hot, deep));
      if (analysisId !== null && cmd.email) {
        await this.analyses.attachDeepAnalysis(analysisId, cmd.email, deep);
      }
      emit({ type: 'deep_done', deep });
    } catch (err: any) {
      this.logger.warn(
        `Deep pass failed (analysis still succeeds, frontend will show regenerate UI): ${err?.message || err}`,
      );
    }
    timings.claude_deep_ms = Date.now() - deepStart;

    if (cmd.email && subscriptionState.plan === 'hired') {
      emitStep('negotiation_coaching');
      const negStart = Date.now();
      try {
        const negotiation = await this.claude.generateNegotiation({
          jobText,
          result,
          roadmapItems: extractRoadmapItems(result),
          locale: cmd.locale ?? 'en',
          onDelta: (delta) => emit({ type: 'negotiation_delta', delta }),
        });
        result.negotiation_analysis = negotiation;
        if (analysisId !== null) {
          await this.analyses.attachNegotiation(
            analysisId,
            cmd.email,
            negotiation,
          );
        }
        emit({ type: 'negotiation_done', negotiation });
      } catch (err: any) {
        // Negotiation is best-effort: never fail the whole analysis if it errors.
        this.logger.warn(
          `Negotiation generation failed (analysis still succeeds): ${err?.message || err}`,
        );
      }
      timings.negotiation_ms = Date.now() - negStart;
    }

    const totalMs = Date.now() - executeStartedAt;
    this.logger.log(
      `[ANALYZE_TIMING_USECASE] total_ms=${totalMs} ` +
        `parse_inputs_ms=${timings.parse_inputs_ms} ` +
        `profile_ctx_ms=${timings.profile_ctx_ms} ` +
        `claude_hot_ms=${timings.claude_hot_ms} ` +
        `claude_deep_ms=${timings.claude_deep_ms} ` +
        `persist_ms=${timings.persist_ms} ` +
        `negotiation_ms=${timings.negotiation_ms} ` +
        `tier=${subscriptionState.tier} plan=${subscriptionState.plan} ` +
        `has_github=${!!cmd.githubUsername} ` +
        `has_linkedin=${!!cmd.linkedinBuffer} ` +
        `has_motiv=${!!(cmd.motivationLetterBuffer || cmd.motivationLetterText)}`,
    );

    return { result, analysisId };
  }

  private async assertQuota(
    email: string | undefined,
    ip: string | undefined,
    hasActiveSubscription: boolean,
  ): Promise<void> {
    const [countByEmail, countByIp] = await Promise.all([
      email ? this.analyses.countByEmail(email) : Promise.resolve(0),
      ip ? this.analyses.countByIp(ip) : Promise.resolve(0),
    ]);

    const decision = decideQuota({
      email,
      ip,
      hasActiveSubscription,
      countByEmail,
      countByIp,
    });

    if (!decision.allowed) {
      throw new QuotaExceededException(
        'Analysis limit reached. Upgrade to continue.',
      );
    }
  }

  private async resolveSubscriptionState(email: string | undefined): Promise<{
    tier: 'guest' | 'connected' | 'premium';
    plan: 'rejected' | 'shortlisted' | 'hired';
    hasActiveSubscription: boolean;
  }> {
    if (!email) {
      return { tier: 'guest', plan: 'rejected', hasActiveSubscription: false };
    }
    const { hasActiveSubscription, isHired } = await this.subs.getState(email);
    if (!hasActiveSubscription) {
      return {
        tier: 'connected',
        plan: 'rejected',
        hasActiveSubscription: false,
      };
    }
    return {
      tier: 'premium',
      plan: isHired ? 'hired' : 'shortlisted',
      hasActiveSubscription: true,
    };
  }

  private async tryParse(buffer?: Buffer): Promise<string> {
    if (!buffer) return '';
    try {
      return await this.pdf.parse(buffer);
    } catch {
      // The legacy behavior swallowed PDF parse errors for optional inputs.
      return '';
    }
  }

  private async resolveMotivationLetter(
    text: string | undefined,
    buffer: Buffer | undefined,
  ): Promise<string> {
    if (text) return text.trim().slice(0, MAX_TEXT_CHARS);
    if (buffer) return this.tryParse(buffer);
    return '';
  }

  private async persist(args: {
    cmd: AnalyzeCvCommand;
    result: AnalyzeResponse;
    cvText: string;
    linkedinText: string;
    githubInfo: string;
    motivationLetterText: string;
  }): Promise<number | null> {
    const { cmd, result } = args;
    const isRegistered = !!cmd.isRegistered;

    if (!isRegistered || !cmd.email) {
      await this.analyses.saveAnonymous(cmd.ip);
      return null;
    }

    const resolvedLabel =
      cmd.jobLabel?.trim() || result.job_details?.title || null;
    const resolvedCompany =
      result.job_details?.company?.trim() || 'Unknown Company';

    const created = await this.analyses.saveRegistered({
      email: cmd.email,
      ip: cmd.ip,
      jobDescription: cmd.jobDescription,
      jobLabel: resolvedLabel,
      company: resolvedCompany,
      jdLanguage: result.job_details?.jd_language ?? 'en',
      cvText: args.cvText || null,
      linkedinText: args.linkedinText || null,
      githubInfo: args.githubInfo || null,
      motivationLetter: args.motivationLetterText || null,
      result,
    });

    const meta: ApplicationUpsertInput['meta'] = {
      seniority: notMentioned(result.job_details?.seniority),
      pay: result.job_details?.pay ?? null,
      officeLocation: result.job_details?.office_location ?? null,
      workSetting: notMentioned(result.job_details?.work_setting),
      contractType: notMentioned(result.job_details?.contract_type),
      languagesRequired: notMentioned(result.job_details?.languages_required),
      yearsOfExperience: result.job_details?.years_of_experience ?? null,
      companyStage: notMentioned(result.job_details?.company_stage),
    };

    await this.analyses.upsertApplication({
      email: cmd.email,
      jobTitle: resolvedLabel || 'Unknown',
      company: resolvedCompany,
      analysisId: created.id,
      meta,
    });

    return created.id;
  }
}

function notMentioned(value: string | null | undefined): string | null {
  return value === 'not-mentioned' ? null : (value ?? null);
}
