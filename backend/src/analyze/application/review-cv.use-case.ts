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
  CLAUDE_PROVIDER,
  GITHUB_PROVIDER,
  PDF_PARSER,
  PORTFOLIO_SCRAPER,
  PROFILE_REPOSITORY,
  SUBSCRIPTION_GATE,
} from '../ports/tokens';
import type { PortfolioScraper } from '../ports/portfolio.scraper';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import type { GithubProvider } from '../ports/github.provider';
import type { PdfParser } from '../ports/pdf.parser';
import type { ProfileRepository } from '../ports/profile.repository';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';
import { SectionStreamParser } from '../infrastructure/section-stream.parser';
import {
  shapeCvReviewForPlan,
  shapeSectionForPlan,
} from '../domain/analysis-shaper';
import { anchorCvQuality } from '../domain/score/compose-cv-review-score';
import { sanitizeCvReviewFabrication } from '../domain/anti-fabrication';
import { assignCvReviewIssueIds } from '../domain/cv-review-issues';
import { isOwnerEmail } from '../domain/owner';
import { QuotaExceededException } from '../../common/exceptions';
import { CREDIT_LEDGER_REPOSITORY } from '../../credits/ports/tokens';
import type { CreditLedgerRepository } from '../../credits/ports/credit-ledger.repository';
import type { Plan, QuotaDecision } from '../domain/quota.policy';
import {
  CREDIT_COSTS,
  decideQuota,
  startOfMonthUTC,
} from '../domain/quota.policy';

function toQuotaPlan(legacyPlan: 'rejected' | 'shortlisted' | 'hired'): Plan {
  return legacyPlan === 'rejected' ? 'free' : legacyPlan;
}

/**
 * Below this many characters of extracted CV text, the upload is almost
 * certainly an image-only / scanned / corrupt PDF rather than a real CV.
 * Mirrors the identical gate in AnalyzeCvUseCase. Without it, an unreadable
 * PDF (e.g. a screenshot exported to PDF, which parses to a bare page marker
 * like "-- 1 of 1 --") would sail through and the review would be synthesised
 * entirely from the profile digest — i.e. an audit of the logged-in user's own
 * profile rather than the uploaded document.
 */
const MIN_CV_TEXT_CHARS = 200;

export type ReviewCvCommand = {
  cvBuffer?: Buffer;
  cvMimeType?: string;
  linkedinBuffer?: Buffer;
  githubUsername?: string;
  email?: string;
  ip?: string;
  isRegistered: boolean;
  locale?: string;
  /** Owner teaser flag from the request; only honored for OWNER_EMAILS. */
  auditMode?: boolean;
  /**
   * Inline-edited CV text for the re-scan loop. When set, file extraction/OCR
   * is skipped and this text is audited directly. Mutually exclusive with
   * cvBuffer in practice (the re-scan endpoint sends text, the upload sends a
   * buffer).
   */
  cvText?: string;
  /** Links a re-scan back to the original audit for a before/after chain. */
  parentAnalysisId?: number;
  /**
   * "This is MY CV": opt-in to enrich the audit from the signed-in user's own
   * linked profile (GitHub / portfolio / declared role) and use their
   * persistent digest cache. Default false, so auditing someone else's CV (the
   * public-share tactic) is strictly request-scoped and never touches the
   * owner's data (incident id=82).
   */
  useOwnProfile?: boolean;
};

export type ReviewCvResult = {
  result: CvReviewResponse;
  analysisId: number | null;
  /** True when the owner audit mode was actually applied (full + auto-share). */
  auditMode: boolean;
};

export type ReviewCvEvent =
  | { type: 'step'; step: string }
  // A top-level section of the tool output started generating.
  | { type: 'generating'; section: string }
  // A top-level section completed — parsed and shaped for the requester.
  | { type: 'section'; key: string; value: unknown }
  | {
      type: 'analysis_done';
      result: CvReviewResponse;
      analysisId: number | null;
      /** Anonymous analyses only — lets the client claim it after signup. */
      claimToken: string | null;
    };

@Injectable()
export class ReviewCvUseCase {
  private readonly logger = new Logger(ReviewCvUseCase.name);

  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
    @Inject(GITHUB_PROVIDER) private readonly github: GithubProvider,
    @Inject(PDF_PARSER) private readonly pdf: PdfParser,
    @Inject(SUBSCRIPTION_GATE) private readonly subs: SubscriptionGate,
    @Inject(PROFILE_REPOSITORY)
    private readonly profiles: ProfileRepository,
    @Inject(CREDIT_LEDGER_REPOSITORY)
    private readonly creditLedger: CreditLedgerRepository,
    @Inject(PORTFOLIO_SCRAPER)
    private readonly portfolioScraper: PortfolioScraper,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: ReviewCvCommand,
    onEvent?: (event: ReviewCvEvent) => void,
  ): Promise<ReviewCvResult> {
    if (!cmd.cvBuffer && !cmd.cvText)
      throw new BadRequestException('CV is required');

    const emit = (event: ReviewCvEvent) => onEvent?.(event);
    const emitStep = (step: string) => emit({ type: 'step', step });

    const subscriptionState = await this.resolveSubscriptionState(cmd.email);
    Sentry.setTag('tier', subscriptionState.tier);
    Sentry.setTag('plan', subscriptionState.plan);

    // Owner "audit mode" is honored only for OWNER_EMAILS. It keeps portfolio
    // and digest off for stranger-CV privacy, bypasses quota, and now runs the
    // complete audit: carousel creation needs bullet and per-role evidence, not
    // a cheap teaser that hides the real insight.
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
          CREDIT_COSTS.review,
        );

    emitStep('parsing_cv');
    if (cmd.githubUsername) emitStep('analyzing_github');

    const [cvSource, linkedinText, linkedinTextFormatted, githubSnapshot] =
      await Promise.all([
        // Inline re-scan sends edited TEXT (no file to parse); the upload path
        // parses/OCRs the buffer.
        cmd.cvText != null
          ? Promise.resolve({ text: cmd.cvText, formatted: cmd.cvText })
          : this.extractCvSource(cmd.cvBuffer as Buffer, cmd.cvMimeType),
        this.tryParse(cmd.linkedinBuffer),
        this.tryParseFormatted(cmd.linkedinBuffer),
        cmd.githubUsername
          ? this.github.fetchProfile(cmd.githubUsername).catch(() => null)
          : Promise.resolve(null),
      ]);
    const cvText = cvSource.text;
    const cvTextFormatted = cvSource.formatted;

    // Minimum-evidence gate: a real CV yields hundreds of chars of extracted
    // text. Near-empty output means an image-only / scanned / corrupt PDF — we
    // refuse rather than let the model audit a profile with no CV to anchor on
    // (which would otherwise fall back entirely to the profile digest).
    if (cvText.trim().length < MIN_CV_TEXT_CHARS) {
      throw new BadRequestException(
        "We couldn't read enough text from your CV. It may be an image or scanned PDF. Please upload a text-based PDF.",
      );
    }

    const githubInfo = githubSnapshot
      ? JSON.stringify(githubSnapshot, null, 2)
      : '';

    // Cross-source cross-checking (the ProfileDigest, powering the Consistency +
    // Timeline views) is REQUEST-SCOPED by default: it only compares sources
    // supplied FOR THIS candidate in THIS request, never the signed-in user's
    // stored profile. That is what makes it safe to audit a stranger's CV and
    // share it publicly. Own-profile enrichment (GitHub / portfolio / declared
    // role, plus the persistent digest cache) is opt-in via useOwnProfile
    // ("this is my CV"). The incident id=82 leak was the owner's profile
    // bleeding into strangers' audits: never re-open that path by default.
    const useOwnProfile = cmd.useOwnProfile ?? false;

    const profile =
      useOwnProfile && cmd.email && cmd.isRegistered
        ? await this.profiles.findByEmail(cmd.email).catch(() => null)
        : null;

    // The portfolio is inherently the signed-in user's OWN data: only ever used
    // when they explicitly opt in to auditing their own CV.
    const portfolioEnabled =
      useOwnProfile &&
      this.config.get<string>('CV_REVIEW_PORTFOLIO_ENABLED') === 'true';
    const portfolioUrl = portfolioEnabled
      ? (profile?.portfolioUrl ?? null)
      : null;
    const portfolioMarkdown = portfolioUrl
      ? await this.portfolioScraper
          .fetch(portfolioUrl)
          .then((s) => s?.markdown ?? '')
          .catch(() => '')
      : '';

    emitStep('reviewing_cv');
    // Stream completed top-level sections as typed events, shaped for the
    // requester's plan — the raw JSON deltas are never sent to the client.
    const shapeCtx = {
      premium: subscriptionState.hasActiveSubscription,
      hired: subscriptionState.plan === 'hired',
    };
    const sectionParser = new SectionStreamParser({
      onSectionStart: (key) => emit({ type: 'generating', section: key }),
      onSection: (key, value) => {
        // Anchor the streamed cv_quality so the live headline matches the final
        // payload (no visible jump): overall is recomputed from the six
        // sub-scores by the same pure function the provider applies at the end.
        const anchored =
          key === 'cv_quality'
            ? anchorCvQuality(value as Parameters<typeof anchorCvQuality>[0])
            : value;
        emit({
          type: 'section',
          key,
          value: shapeSectionForPlan(key, anchored, shapeCtx),
        });
      },
    });

    const result = await this.claude.reviewCv({
      cvText,
      githubInfo,
      linkedinText,
      portfolioMarkdown,
      portfolioUrl,
      lean: false,
      locale: cmd.locale,
      // Only frame the audit with the signed-in user's declared role when they
      // opted into "my CV"; auditing a stranger falls back to role inference
      // (a nurse's CV must not be judged as the owner's role family).
      userRoleType: useOwnProfile ? (profile?.roleType ?? null) : null,
      onDelta: (delta) => sectionParser.push(delta),
    });

    // Neutralise any number the model invented in a rewrite that has no basis
    // in the CV, before we persist / return / share it (anti-fabrication).
    sanitizeCvReviewFabrication(result, cvText);
    // Stable issue ids so a re-scan diffs by identity, not array position. A
    // strong CV reading clean is enforced at the prompt (return few/zero
    // issues), NOT by hiding genuine findings post-hoc. See cv-review-issues.ts.
    assignCvReviewIssueIds(result);

    const { analysisId, claimToken } = await this.persist({
      cmd,
      result,
      cvText,
      cvTextFormatted,
      linkedinText,
      linkedinTextFormatted,
      githubInfo,
    });

    if (quotaIntent.consume === 'credit' && cmd.email && analysisId !== null) {
      await this.creditLedger.consume({
        email: cmd.email,
        analysisId,
        scope: 'review',
        amount: CREDIT_COSTS.review,
      });
    }

    // Stored result stays complete; the emitted one is shaped for the plan.
    const shapedResult = shapeCvReviewForPlan(result, shapeCtx);
    emit({
      type: 'analysis_done',
      result: shapedResult,
      analysisId,
      claimToken,
    });
    return { result: shapedResult, analysisId, auditMode: isOwnerAudit };
  }

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

  private async persist(args: {
    cmd: ReviewCvCommand;
    result: CvReviewResponse;
    cvText: string;
    cvTextFormatted: string;
    linkedinText: string;
    linkedinTextFormatted: string;
    githubInfo: string;
  }): Promise<{ analysisId: number | null; claimToken: string | null }> {
    const { cmd, result } = args;

    const payload = {
      jobDescription: '',
      jobLabel: null,
      company: 'CV Review',
      jdLanguage: 'en',
      cvText: args.cvText || null,
      cvTextFormatted: args.cvTextFormatted || null,
      linkedinText: args.linkedinText || null,
      linkedinTextFormatted: args.linkedinTextFormatted || null,
      githubInfo: args.githubInfo || null,
      motivationLetter: null,
      result: result as unknown as Parameters<
        AnalysisRepository['saveRegistered']
      >[0]['result'],
    };

    // Anonymous: persist + claimToken so it can be attached to an account later.
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
      creditCost: CREDIT_COSTS.review,
      // Chain a re-scan back to the audit it corrects (before/after lineage).
      parentAnalysisId: cmd.parentAnalysisId ?? null,
    });

    return { analysisId: created.id, claimToken: null };
  }
}
