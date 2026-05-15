import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { createHash } from 'crypto';
import {
  ANALYSIS_REPOSITORY,
  CHALLENGE_STATS_PROVIDER,
  CLAUDE_PROVIDER,
  DIGEST_REPOSITORY,
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
import type { DigestRepository } from '../ports/digest.repository';
import type { GithubProvider } from '../ports/github.provider';
import type { PdfParser } from '../ports/pdf.parser';
import type { ProfileRepository } from '../ports/profile.repository';
import type { ChallengeStatsProvider } from '../ports/challenge-stats.provider';
import { GenerateProfileDigestUseCase } from './generate-profile-digest.use-case';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import type {
  AnalyzeResponse,
  DeepAnalyzeResponse,
} from '../dto/analyze-response.dto';
import { mergeHotAndDeep } from '../dto/analyze-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';
import type {
  DigestSourceHashes,
  ProfileDigest,
} from '../dto/profile-digest.dto';
import { QuotaExceededException } from '../../common/exceptions';
import { LlmJobsService } from '../../queue/llm-jobs.service';
import { CREDIT_LEDGER_REPOSITORY } from '../../credits/ports/tokens';
import type { CreditLedgerRepository } from '../../credits/ports/credit-ledger.repository';
import type { Plan, QuotaDecision } from '../domain/quota.policy';
import { decideQuota, startOfMonthUTC } from '../domain/quota.policy';

const MAX_TEXT_CHARS = 12000;

/**
 * Maps the use-case's legacy 3-value plan ('rejected' = no active sub,
 * 'shortlisted', 'hired') into the new quota policy's `Plan` type, where
 * 'rejected' becomes 'free'.
 */
function toQuotaPlan(legacyPlan: 'rejected' | 'shortlisted' | 'hired'): Plan {
  return legacyPlan === 'rejected' ? 'free' : legacyPlan;
}

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
    @Inject(DIGEST_REPOSITORY)
    private readonly digests: DigestRepository,
    @Inject(CREDIT_LEDGER_REPOSITORY)
    private readonly creditLedger: CreditLedgerRepository,
    private readonly generateDigestUc: GenerateProfileDigestUseCase,
    private readonly llmJobs: LlmJobsService,
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
      digest_ms: 0,
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

    const plan = toQuotaPlan(subscriptionState.plan);
    const quotaIntent = await this.reserveQuotaIntent(cmd.email, cmd.ip, plan);

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

    // Resolve a fresh ProfileDigest for registered users. Anonymous users
    // skip this — they pass raw cvText/linkedinText/githubInfo to the
    // provider as before. The digest contains a synthesized version of CV +
    // LinkedIn + GitHub + portfolio and unlocks cross-profile mismatch
    // detection in the analysis output.
    const digestStart = Date.now();
    let digest: ProfileDigest | null = null;
    if (cmd.email && cmd.isRegistered) {
      digest = await this.resolveDigest({
        email: cmd.email,
        cvBuffer: cmd.cvBuffer,
        cvText,
        linkedinText,
        githubUsername: cmd.githubUsername ?? profile?.githubUsername ?? null,
        portfolioUrl: profile?.portfolioUrl ?? null,
        locale: cmd.locale,
      });
    }
    timings.digest_ms = Date.now() - digestStart;

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
      digest,
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

    // Surface the digest's pre-computed cross-profile inconsistencies on the
    // result so the frontend can render the "Consistency check" section as
    // soon as analysis_done fires. The Claude analyzer also sees these in
    // the user message and can react in audit/red_flags — this is the
    // *display* copy of the same data.
    if (digest && digest.cross_profile_inconsistencies.length > 0) {
      result.cross_profile_inconsistencies =
        digest.cross_profile_inconsistencies;
    }
    // Same passthrough for the per-source timeline_entries — drives the
    // Consistency tab chronology visualization. Optional on the digest
    // (older digests generated before this field was added won't have it).
    if (
      digest &&
      digest.timeline_entries &&
      digest.timeline_entries.length > 0
    ) {
      result.timeline_entries = digest.timeline_entries;
    }

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

    // Debit one-time credits only if the user actually overflowed their
    // monthly cap. Idempotent on analysisId so a retry can't double-debit.
    // A crash between persist() and consume() leaves the row counted as
    // monthly use rather than a credit consume — a benign under-debit we
    // accept to keep the flow non-transactional.
    if (quotaIntent.consume === 'credit' && cmd.email && analysisId !== null) {
      await this.creditLedger.consume({ email: cmd.email, analysisId });
    }

    emit({ type: 'analysis_done', result, analysisId });

    // From this point on, the SSE response is allowed to close. Registered
    // users get deep + negotiation passes off the HTTP request thread (via
    // BullMQ when REDIS_URL is set, or setImmediate fallback otherwise); the
    // frontend polls GET /api/analyze/:id to pick up the persisted results.
    //
    // Anonymous users have no row to update, so we keep the deep pass inline
    // — they still receive deep_done over the SSE stream before the response
    // ends. Negotiation is hired-only and therefore registered-only.
    if (cmd.email && cmd.isRegistered && analysisId !== null) {
      await this.llmJobs.enqueueDeep({ analysisId, email: cmd.email });
      if (subscriptionState.plan === 'hired') {
        await this.llmJobs.enqueueNegotiation({
          analysisId,
          email: cmd.email,
          locale: cmd.locale ?? 'en',
        });
      }
    } else {
      // Anonymous fallback: keep deep inline so the SSE stream still emits
      // deep_delta / deep_done before closing.
      emitStep('deep_analysis');
      const deepStart = Date.now();
      try {
        const deep = await this.claude.analyzeApplicationDeep({
          ...claudeInput,
          hot,
          onDelta: (delta) => emit({ type: 'deep_delta', delta }),
        });
        Object.assign(result, mergeHotAndDeep(hot, deep));
        emit({ type: 'deep_done', deep });
      } catch (err: any) {
        this.logger.warn(
          `Inline deep pass failed (anonymous user, no retry path): ${err?.message || err}`,
        );
      }
      timings.claude_deep_ms = Date.now() - deepStart;
    }

    const totalMs = Date.now() - executeStartedAt;
    this.logger.log(
      `[ANALYZE_TIMING_USECASE] total_ms=${totalMs} ` +
        `parse_inputs_ms=${timings.parse_inputs_ms} ` +
        `profile_ctx_ms=${timings.profile_ctx_ms} ` +
        `digest_ms=${timings.digest_ms} ` +
        `claude_hot_ms=${timings.claude_hot_ms} ` +
        `claude_deep_ms=${timings.claude_deep_ms} ` +
        `persist_ms=${timings.persist_ms} ` +
        `negotiation_ms=${timings.negotiation_ms} ` +
        `tier=${subscriptionState.tier} plan=${subscriptionState.plan} ` +
        `digest_used=${!!digest} ` +
        `has_github=${!!cmd.githubUsername} ` +
        `has_linkedin=${!!cmd.linkedinBuffer} ` +
        `has_motiv=${!!(cmd.motivationLetterBuffer || cmd.motivationLetterText)}`,
    );

    return { result, analysisId };
  }

  /**
   * Decides whether the user is allowed to start a new analysis and which
   * bucket (monthly allowance vs one-time credit) the cost will come from.
   * Throws QuotaExceededException with `details: { plan, monthlyCap }` so
   * the frontend can render the right paywall.
   *
   * Race condition note: two simultaneous calls from the same user at
   * `monthlyUsed = cap - 1` can both pass through. We accept the rare
   * 1-overshoot rather than pay the cost of a pessimistic lock. The ledger
   * `consume` calls are still idempotent per analysisId.
   */
  private async reserveQuotaIntent(
    email: string | undefined,
    ip: string | undefined,
    plan: Plan,
  ): Promise<Extract<QuotaDecision, { allowed: true }>> {
    const monthStart = startOfMonthUTC();
    const [monthlyUsed, countByIpLifetime, creditsBalance] = await Promise.all([
      email
        ? this.analyses.countByEmailSince(email, monthStart)
        : Promise.resolve(0),
      ip && !email ? this.analyses.countByIp(ip) : Promise.resolve(0),
      email ? this.creditLedger.getBalance(email) : Promise.resolve(0),
    ]);

    const decision = decideQuota({
      email,
      ip,
      plan,
      monthlyUsed,
      countByIpLifetime,
      creditsBalance,
    });

    if (!decision.allowed) {
      this.logger.log(
        `Quota refused: plan=${decision.plan} cap=${decision.monthlyCap} ` +
          `used=${monthlyUsed} balance=${creditsBalance} ` +
          `anon=${!email}`,
      );
      throw new QuotaExceededException(
        'Analysis limit reached. Upgrade or buy credits to continue.',
        { plan: decision.plan, monthlyCap: decision.monthlyCap },
      );
    }

    return decision;
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

  /**
   * Resolve a fresh ProfileDigest for the user. The flow:
   *  1. Compute current source hashes (CV PDF buffer + LinkedIn text +
   *     GitHub username + portfolio URL — see `digest-source-hashes` doc on
   *     the Profile model).
   *  2. Fetch the stored digest. If hashes match → return it as-is (cache
   *     hit, ~5ms).
   *  3. Otherwise, regenerate via GenerateProfileDigestUseCase. This adds
   *     10-15s to the FIRST analysis (or any analysis after the user
   *     updates a source), then subsequent analyses hit cache.
   *
   * Returns `null` if regeneration fails — the analysis falls back to raw
   * sources transparently (no user-facing error).
   */
  private async resolveDigest(input: {
    email: string;
    cvBuffer: Buffer;
    cvText: string;
    linkedinText: string;
    githubUsername: string | null;
    portfolioUrl: string | null;
    locale?: string;
  }): Promise<ProfileDigest | null> {
    // Count active non-CV sources. The CV is always present (it's required to
    // run an analysis at all), so the meaningful question is whether we have
    // ANYTHING to cross-check it against. With CV alone, cross-profile
    // mismatch detection is structurally impossible and the timeline view
    // collapses to a single lane — the digest would cost ~$0.02-0.03 for no
    // user-visible payoff. Skip it.
    const extraSourceCount =
      (input.linkedinText ? 1 : 0) +
      (input.githubUsername ? 1 : 0) +
      (input.portfolioUrl ? 1 : 0);
    if (extraSourceCount === 0) {
      this.logger.log(
        '[DIGEST_CACHE] hit=skip reason=single_source (CV-only — no cross-profile value)',
      );
      return null;
    }

    const currentHashes: DigestSourceHashes = {
      cv: sha256Hex(input.cvBuffer),
      linkedin: input.linkedinText
        ? sha256Hex(Buffer.from(input.linkedinText))
        : null,
      githubUsername: input.githubUsername
        ? input.githubUsername.toLowerCase()
        : null,
      portfolioUrl: input.portfolioUrl
        ? input.portfolioUrl.trim().toLowerCase()
        : null,
    };

    const stored = await this.digests
      .findByEmail(input.email)
      .catch(() => null);

    if (stored && hashesMatch(stored.hashes, currentHashes)) {
      const ageMin = Math.round(
        (Date.now() - stored.updatedAt.getTime()) / 60000,
      );
      this.logger.log(
        `[DIGEST_CACHE] hit=true age_min=${ageMin} ` +
          `work=${stored.digest.work_history.length} ` +
          `projects=${stored.digest.projects.length} ` +
          `inconsistencies=${stored.digest.cross_profile_inconsistencies.length}`,
      );
      return stored.digest;
    }

    const reason = diffReason(stored?.hashes ?? null, currentHashes);
    this.logger.log(
      `[DIGEST_CACHE] hit=false reason=${reason} ` +
        `had_stored=${!!stored} ` +
        `has_cv=${!!currentHashes.cv} has_li=${!!currentHashes.linkedin} ` +
        `has_gh=${!!currentHashes.githubUsername} has_pf=${!!currentHashes.portfolioUrl}`,
    );

    // Stale or missing → regenerate. Best-effort: never fail the analysis
    // because the digest couldn't be built.
    try {
      const { digest } = await this.generateDigestUc.execute({
        email: input.email,
        cvBuffer: input.cvBuffer,
        cvText: input.cvText,
        linkedinText: input.linkedinText || null,
        githubUsername: input.githubUsername,
        portfolioUrl: input.portfolioUrl,
        locale: input.locale,
      });
      return digest;
    } catch (err: any) {
      this.logger.warn(
        `[DIGEST_CACHE] regen_failed err=${err?.message || err}`,
      );
      return null;
    }
  }
}

function sha256Hex(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function hashesMatch(a: DigestSourceHashes, b: DigestSourceHashes): boolean {
  return (
    a.cv === b.cv &&
    a.linkedin === b.linkedin &&
    a.githubUsername === b.githubUsername &&
    a.portfolioUrl === b.portfolioUrl
  );
}

/**
 * Tag the SPECIFIC source that triggered a cache miss. Powers the
 * [DIGEST_CACHE] log so we can see whether regenerations are mostly
 * driven by CV changes, portfolio updates, etc. — useful to tune cache
 * TTL strategies later.
 */
function diffReason(
  stored: DigestSourceHashes | null,
  current: DigestSourceHashes,
): string {
  if (!stored) return 'missing';
  if (stored.cv !== current.cv) return 'cv_changed';
  if (stored.linkedin !== current.linkedin) return 'linkedin_changed';
  if (stored.githubUsername !== current.githubUsername) return 'github_changed';
  if (stored.portfolioUrl !== current.portfolioUrl) return 'portfolio_changed';
  return 'unknown';
}

function notMentioned(value: string | null | undefined): string | null {
  return value === 'not-mentioned' ? null : (value ?? null);
}
