import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';
import { SectionStreamParser } from '../infrastructure/section-stream.parser';
import {
  shapeAnalysisForPlan,
  shapeSectionForPlan,
} from '../domain/analysis-shaper';
import { isOwnerEmail } from '../domain/owner';
import { QuotaExceededException } from '../../common/exceptions';
import { LlmJobsService } from '../../queue/llm-jobs.service';
import { CREDIT_LEDGER_REPOSITORY } from '../../credits/ports/tokens';
import type { CreditLedgerRepository } from '../../credits/ports/credit-ledger.repository';
import type { Plan, QuotaDecision } from '../domain/quota.policy';
import {
  CREDIT_COSTS,
  decideQuota,
  startOfMonthUTC,
} from '../domain/quota.policy';
import {
  matchKeywords,
  type KeywordMatchResult,
} from '../domain/keyword-match/keyword-match';
import { anchorScores, anchorBreakdown } from '../domain/score/compose-score';
import { sanitizeAnalyzeFabrication } from '../domain/anti-fabrication';

const MAX_TEXT_CHARS = 12000;

/**
 * Below this many characters of extracted CV text, the upload is almost
 * certainly an image-only / scanned / corrupt PDF rather than a real CV.
 * See the minimum-evidence gate in execute().
 */
const MIN_CV_TEXT_CHARS = 200;

/**
 * Upper bound (chars) on each free-text source actually sent to the model
 * (CV, LinkedIn, GitHub snapshot). ~16k chars ≈ 4k tokens — comfortably fits
 * any real CV/profile while capping the cost of oversized/abusive uploads,
 * which the hot+deep path would otherwise send to Claude twice, uncapped.
 */
const MAX_MODEL_INPUT_CHARS = 16000;

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
  cvMimeType?: string;
  /**
   * Pre-extracted CV text, used by the INLINE re-scan loop: the user edits their
   * reconstructed CV (bullets / skills) in the app and commits the edited text
   * instead of re-uploading a file. When set, it bypasses PDF/OCR parsing and is
   * used verbatim as both the raw and formatted CV text. Exactly one of
   * cvBuffer / cvText must be provided.
   */
  cvText?: string;
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
  /** Owner teaser flag from the request; only honored for OWNER_EMAILS. */
  auditMode?: boolean;
  /**
   * Set when this analysis is a full (paid) re-scan of an earlier one. Stored
   * as `parentAnalysisId` so the result view can show a before/after chain.
   */
  parentAnalysisId?: number;
};

export type AnalyzeCvResult = {
  result: AnalyzeResponse;
  analysisId: number | null;
  /** True when the owner audit mode was actually applied (full + auto-share). */
  auditMode: boolean;
  /**
   * Deterministic keyword-match baseline (no LLM) — the verifiable coverage
   * table and the baseline the re-scan loop diffs against. Null when the CV
   * couldn't be matched (should not happen once the min-evidence gate passes).
   */
  keywordMatch: KeywordMatchResult | null;
};

export type AnalyzeEvent =
  | { type: 'step'; step: string }
  // A top-level section of the tool output started generating — drives the
  // fine-grained progress display.
  | { type: 'generating'; section: string }
  // A top-level section completed: `value` is fully parsed AND already shaped
  // for the requester's plan. Keys are the tool-schema property names, plus
  // the assembled `breakdown`.
  | { type: 'section'; key: string; value: unknown }
  | {
      type: 'analysis_done';
      result: AnalyzeResponse;
      analysisId: number | null;
      /** Anonymous analyses only — lets the client claim it after signup. */
      claimToken: string | null;
      cvTextFormatted: string;
      linkedinTextFormatted: string;
      motivationLetterText: string;
      /** Deterministic keyword coverage table, shown next to the diagnostic. */
      keywordMatch: KeywordMatchResult | null;
    }
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
    @Inject(CREDIT_LEDGER_REPOSITORY)
    private readonly creditLedger: CreditLedgerRepository,
    private readonly llmJobs: LlmJobsService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: AnalyzeCvCommand,
    onEvent?: (event: AnalyzeEvent) => void,
  ): Promise<AnalyzeCvResult> {
    if (!cmd.cvBuffer && cmd.cvText == null)
      throw new BadRequestException('CV is required');

    const executeStartedAt = Date.now();
    const timings = {
      parse_inputs_ms: 0,
      profile_ctx_ms: 0,
      claude_ms: 0,
      persist_ms: 0,
      negotiation_ms: 0,
    };

    const emit = (event: AnalyzeEvent) => onEvent?.(event);
    const emitStep = (step: string) => emit({ type: 'step', step });

    const subscriptionState = await this.resolveSubscriptionState(cmd.email);
    Sentry.setTag('tier', subscriptionState.tier);
    Sentry.setTag('plan', subscriptionState.plan);

    // Owner "audit mode": the request flag is only honored when the JWT email
    // is in OWNER_EMAILS. It runs the full evidence-led audit and bypasses the
    // quota, so public social reports contain real substance. A non-owner who
    // forces auditMode=true gets a normal, quota-counted analysis.
    const isOwnerAudit =
      (cmd.auditMode ?? false) &&
      isOwnerEmail(cmd.email, this.config.get<string>('OWNER_EMAILS'));

    const plan = toQuotaPlan(subscriptionState.plan);
    const quotaIntent = isOwnerAudit
      ? ({ allowed: true, consume: 'anonymous' } as const)
      : await this.reserveQuotaIntent(
          cmd.email,
          cmd.ip,
          plan,
          CREDIT_COSTS.analyze,
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
    const [
      cvSource,
      linkedinText,
      linkedinTextFormatted,
      motivationLetterText,
      githubSnapshot,
    ] = await Promise.all([
      cmd.cvText != null
        ? Promise.resolve({ text: cmd.cvText, formatted: cmd.cvText })
        : this.extractCvSource(cmd.cvBuffer as Buffer, cmd.cvMimeType),
      this.tryParse(cmd.linkedinBuffer),
      this.tryParseFormatted(cmd.linkedinBuffer),
      this.resolveMotivationLetter(
        cmd.motivationLetterText,
        cmd.motivationLetterBuffer,
      ),
      cmd.githubUsername
        ? this.github.fetchProfile(cmd.githubUsername)
        : Promise.resolve(null),
    ]);
    const cvText = cvSource.text;
    const cvTextFormatted = cvSource.formatted;
    timings.parse_inputs_ms = Date.now() - parseStart;

    // Minimum-evidence gate: a real CV yields hundreds of chars of extracted
    // text. Near-empty output means an image-only / scanned / corrupt PDF — we
    // refuse rather than force the model (tool_choice) to emit a confident
    // score + ATS verdict + red flags on no input. Also saves the LLM spend.
    if (cvText.trim().length < MIN_CV_TEXT_CHARS) {
      throw new BadRequestException(
        "We couldn't read enough text from your CV. It may be an image or scanned PDF. Please upload a text-based PDF.",
      );
    }

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

    // Cross-examination (cross_profile_inconsistencies + timeline_entries) is
    // now generated by the main analysis call itself from the raw CV / LinkedIn
    // / GitHub sources below — the Haiku profile-digest that used to produce it
    // out of band has been retired.

    // Cap the text actually SENT to the model (the full text is still parsed,
    // persisted and shown to the user). The hot/deep path never sliced cvText/
    // linkedinText, so an oversized PDF (e.g. a 30-page LinkedIn export) would
    // inflate input cost unbounded — sent twice (hot + deep). These caps are
    // generous for any real CV/LinkedIn yet bound the worst case. jobText is
    // already sliced to 8000 above; motivationLetterText to MAX_TEXT_CHARS.
    const claudeInput = {
      jobText,
      cvText: cvText.slice(0, MAX_MODEL_INPUT_CHARS),
      githubInfo: githubInfo.slice(0, MAX_MODEL_INPUT_CHARS),
      linkedinText: linkedinText.slice(0, MAX_MODEL_INPUT_CHARS),
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
    const claudeStart = Date.now();
    // The bridge project SPEC is part of the free core analysis (rendered
    // read-only in ProjectTab). The INTERACTIVE bridge (step tracking,
    // completion, starter-repo) stays premium — gated in the UI and by the
    // @RequiresPremium('shortlisted') starter-repo endpoint. Generating it for
    // everyone also stabilises the prompt-cache prefix (always bridge-ON).
    const generateBridgeProject = true;

    // Single unified pass for everyone, guests included: premium content is
    // generated for all and redacted at emission (see analysis-shaper), so an
    // upgrade reveals it without re-analysis. The tool schema is ordered
    // diagnostic-first and each completed top-level section streams to the
    // client as a typed `section` event — never the raw JSON deltas, which
    // would leak premium content to free clients.
    // Deterministic keyword coverage (no LLM): run on the FULL cvText, not the
    // model-truncated slice, so skills late in the CV aren't silently missed.
    // Computed BEFORE the model call so the streamed breakdown section and the
    // final payload show the same verifiable keyword number. Also the baseline
    // the re-scan loop diffs against.
    const keywordMatch = matchKeywords(cmd.jobDescription, cvText);

    const shapeCtx = {
      premium: subscriptionState.hasActiveSubscription,
      hired: subscriptionState.plan === 'hired',
    };

    // The 5 breakdown scalars stream as individual top-level values — buffer
    // them and emit a single `breakdown` section when the last one closes
    // (linkedin_signal is last in the schema order).
    const BREAKDOWN_KEYS = [
      'keyword_match',
      'experience_level',
      'tech_stack_fit',
      'github_signal',
      'linkedin_signal',
    ];
    const breakdownBuffer: Record<string, unknown> = {};
    const sectionParser = new SectionStreamParser({
      onSectionStart: (key) => {
        if (!BREAKDOWN_KEYS.includes(key)) {
          emit({ type: 'generating', section: key });
        }
      },
      onSection: (key, value) => {
        if (BREAKDOWN_KEYS.includes(key)) {
          breakdownBuffer[key] = value;
          if (key === 'linkedin_signal') {
            emit({
              type: 'section',
              key: 'breakdown',
              // Anchor the streamed breakdown so it matches the final payload:
              // keyword_match = deterministic coverage, LLM sub-scores quantized.
              value: anchorBreakdown(
                breakdownBuffer as unknown as Parameters<
                  typeof anchorBreakdown
                >[0],
                keywordMatch.coverageScore,
              ),
            });
          }
          return;
        }
        emit({
          type: 'section',
          key,
          value: shapeSectionForPlan(key, value, shapeCtx),
        });
      },
    });

    let result = await this.claude.analyzeApplication({
      ...claudeInput,
      generateBridgeProject,
      lean: false,
      onDelta: (delta) => sectionParser.push(delta),
    });
    timings.claude_ms = Date.now() - claudeStart;

    // Anchor the headline + breakdown against the deterministic keyword layer:
    // keyword_match becomes the verifiable coverage, the LLM sub-scores are
    // quantized to kill sub-bucket jitter, and overall risk/verdict are
    // recomputed from the parts so the headline can't contradict what's shown
    // beneath it (same trust guardrail as deriveAtsWouldPass). Stable, not
    // bit-deterministic — see domain/score/compose-score.ts.
    result = anchorScores(result, keywordMatch.coverageScore);

    // Neutralise any number the model invented in a bullet rewrite or ATS
    // insertion that has no basis in the CV (anti-fabrication guard).
    sanitizeAnalyzeFabrication(result, cvText);

    const persistStart = Date.now();
    const { analysisId, claimToken } = await this.persist({
      cmd,
      result,
      cvText,
      cvTextFormatted,
      linkedinText,
      linkedinTextFormatted,
      githubInfo,
      motivationLetterText,
      keywordMatch,
    });
    timings.persist_ms = Date.now() - persistStart;

    if (quotaIntent.consume === 'credit' && cmd.email && analysisId !== null) {
      await this.creditLedger.consume({
        email: cmd.email,
        analysisId,
        scope: 'analyze',
        amount: CREDIT_COSTS.analyze,
      });
    }

    // The stored result stays complete; everything sent to the client —
    // streamed sections above, this final payload, and the controller's
    // trailing `done` frame (which reuses the returned result) — is shaped
    // for the requester's plan.
    const shapedResult = shapeAnalysisForPlan(result, shapeCtx);
    emit({
      type: 'analysis_done',
      result: shapedResult,
      analysisId,
      claimToken,
      cvTextFormatted,
      linkedinTextFormatted,
      motivationLetterText,
      keywordMatch,
    });

    // Negotiation is now ON-DEMAND (generated when a hired user opens the
    // Negotiation tab → POST :id/negotiation, which is cache-or-generate). We
    // no longer auto-run a Sonnet negotiation pass on EVERY hired analysis:
    // at the real per-analysis cost it pushed the Hired tier to breakeven/
    // negative at the cap, and most analyses never have their negotiation
    // viewed. See GenerateNegotiationUseCase.

    const totalMs = Date.now() - executeStartedAt;
    this.logger.log(
      `[ANALYZE_TIMING_USECASE] total_ms=${totalMs} ` +
        `parse_inputs_ms=${timings.parse_inputs_ms} ` +
        `profile_ctx_ms=${timings.profile_ctx_ms} ` +
        `claude_ms=${timings.claude_ms} ` +
        `persist_ms=${timings.persist_ms} ` +
        `negotiation_ms=${timings.negotiation_ms} ` +
        `tier=${subscriptionState.tier} plan=${subscriptionState.plan} ` +
        `has_github=${!!cmd.githubUsername} ` +
        `has_linkedin=${!!cmd.linkedinBuffer} ` +
        `has_motiv=${!!(cmd.motivationLetterBuffer || cmd.motivationLetterText)}`,
    );

    return {
      result: shapedResult,
      analysisId,
      auditMode: isOwnerAudit,
      keywordMatch,
    };
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
    actionCost: number,
  ): Promise<Extract<QuotaDecision, { allowed: true }>> {
    const monthStart = startOfMonthUTC();
    const [monthlyUsed, countByIpLifetime, creditsBalance] = await Promise.all([
      email
        ? this.analyses.creditsSince(email, monthStart)
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
      actionCost,
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

  /**
   * Resolve the CV's text + formatted text from the upload, transparently
   * handling image-based sources via Claude vision OCR:
   *  - image/* upload → OCR directly (pdf-parse can't read it).
   *  - PDF → pdf-parse; if it yields too little text (image-based / scanned
   *    PDF, e.g. a screenshot exported to PDF), fall back to OCR.
   * The min-evidence gate in execute() still rejects the result if even OCR
   * comes back near-empty.
   */
  private async extractCvSource(
    buffer: Buffer,
    mimeType?: string,
  ): Promise<{ text: string; formatted: string }> {
    if ((mimeType ?? '').startsWith('image/')) {
      const text = await this.claude
        .transcribeDocument({ buffer, mediaType: mimeType as string })
        .catch(() => '');
      return { text, formatted: text };
    }

    const [text, formatted] = await Promise.all([
      this.pdf.parse(buffer).catch(() => ''),
      this.pdf.parseFormatted(buffer).catch(() => ''),
    ]);

    if (text.trim().length < MIN_CV_TEXT_CHARS) {
      const ocr = await this.claude
        .transcribeDocument({ buffer, mediaType: 'application/pdf' })
        .catch(() => '');
      if (ocr.trim().length > text.trim().length) {
        return { text: ocr, formatted: ocr };
      }
    }
    return { text, formatted };
  }

  private async tryParse(buffer?: Buffer): Promise<string> {
    if (!buffer) return '';
    try {
      return await this.pdf.parse(buffer);
    } catch {
      return '';
    }
  }

  private async tryParseFormatted(buffer?: Buffer): Promise<string> {
    if (!buffer) return '';
    try {
      return await this.pdf.parseFormatted(buffer);
    } catch {
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
    cvTextFormatted: string;
    linkedinText: string;
    linkedinTextFormatted: string;
    githubInfo: string;
    motivationLetterText: string;
    keywordMatch: KeywordMatchResult;
  }): Promise<{ analysisId: number | null; claimToken: string | null }> {
    const { cmd, result } = args;

    const resolvedLabel =
      cmd.jobLabel?.trim() || result.job_details?.title || null;
    const resolvedCompany =
      result.job_details?.company?.trim() || 'Unknown Company';

    const payload = {
      jobDescription: cmd.jobDescription,
      jobLabel: resolvedLabel,
      company: resolvedCompany,
      jdLanguage: result.job_details?.jd_language ?? 'en',
      cvText: args.cvText || null,
      cvTextFormatted: args.cvTextFormatted || null,
      linkedinText: args.linkedinText || null,
      linkedinTextFormatted: args.linkedinTextFormatted || null,
      githubInfo: args.githubInfo || null,
      motivationLetter: args.motivationLetterText || null,
      keywordMatch: args.keywordMatch,
      result,
    };

    // Anonymous: persist the full payload + a claimToken so the user can attach
    // it to their account at signup. Row keeps ip/createdAt for rate-limiting;
    // PII is scrubbed by the TTL job if never claimed.
    if (!cmd.isRegistered || !cmd.email) {
      const { claimToken } = await this.analyses.saveAnonymous({
        ...payload,
        ip: cmd.ip,
      });
      return { analysisId: null, claimToken };
    }

    const created = await this.analyses.saveRegistered({
      ...payload,
      email: cmd.email,
      ip: cmd.ip,
      creditCost: CREDIT_COSTS.analyze,
      parentAnalysisId: cmd.parentAnalysisId ?? null,
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

    return { analysisId: created.id, claimToken: null };
  }
}

function notMentioned(value: string | null | undefined): string | null {
  return value === 'not-mentioned' ? null : (value ?? null);
}
