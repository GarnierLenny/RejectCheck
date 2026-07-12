import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { createHash } from 'crypto';
import {
  ANALYSIS_REPOSITORY,
  CLAUDE_PROVIDER,
  DIGEST_REPOSITORY,
  GITHUB_PROVIDER,
  PDF_PARSER,
  PORTFOLIO_SCRAPER,
  PROFILE_REPOSITORY,
  SUBSCRIPTION_GATE,
} from '../ports/tokens';
import type { PortfolioScraper } from '../ports/portfolio.scraper';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import type { DigestRepository } from '../ports/digest.repository';
import type { GithubProvider } from '../ports/github.provider';
import type { PdfParser } from '../ports/pdf.parser';
import type { ProfileRepository } from '../ports/profile.repository';
import { GenerateProfileDigestUseCase } from './generate-profile-digest.use-case';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';
import type { DigestSourceHashes, ProfileDigest } from '../dto/profile-digest.dto';
import { SectionStreamParser } from '../infrastructure/section-stream.parser';
import {
  shapeCvReviewForPlan,
  shapeSectionForPlan,
} from '../domain/analysis-shaper';
import { QuotaExceededException } from '../../common/exceptions';
import { CREDIT_LEDGER_REPOSITORY } from '../../credits/ports/tokens';
import type { CreditLedgerRepository } from '../../credits/ports/credit-ledger.repository';
import type { Plan, QuotaDecision } from '../domain/quota.policy';
import { CREDIT_COSTS, decideQuota, startOfMonthUTC } from '../domain/quota.policy';

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
};

export type ReviewCvResult = {
  result: CvReviewResponse;
  analysisId: number | null;
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
    @Inject(DIGEST_REPOSITORY)
    private readonly digests: DigestRepository,
    @Inject(CREDIT_LEDGER_REPOSITORY)
    private readonly creditLedger: CreditLedgerRepository,
    @Inject(PORTFOLIO_SCRAPER)
    private readonly portfolioScraper: PortfolioScraper,
    private readonly generateDigestUc: GenerateProfileDigestUseCase,
    private readonly config: ConfigService,
  ) {}

  async execute(
    cmd: ReviewCvCommand,
    onEvent?: (event: ReviewCvEvent) => void,
  ): Promise<ReviewCvResult> {
    if (!cmd.cvBuffer) throw new BadRequestException('CV is required');

    const emit = (event: ReviewCvEvent) => onEvent?.(event);
    const emitStep = (step: string) => emit({ type: 'step', step });

    const subscriptionState = await this.resolveSubscriptionState(cmd.email);
    Sentry.setTag('tier', subscriptionState.tier);
    Sentry.setTag('plan', subscriptionState.plan);

    const plan = toQuotaPlan(subscriptionState.plan);
    const quotaIntent = await this.reserveQuotaIntent(cmd.email, cmd.ip, plan, CREDIT_COSTS.review);

    emitStep('parsing_cv');
    if (cmd.githubUsername) emitStep('analyzing_github');

    const [cvSource, linkedinText, linkedinTextFormatted, githubSnapshot] = await Promise.all([
      this.extractCvSource(cmd.cvBuffer, cmd.cvMimeType),
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

    const profile =
      cmd.email && cmd.isRegistered
        ? await this.profiles.findByEmail(cmd.email).catch(() => null)
        : null;

    const portfolioUrl = profile?.portfolioUrl ?? null;
    const portfolioMarkdown = portfolioUrl
      ? await this.portfolioScraper
          .fetch(portfolioUrl)
          .then((s) => s?.markdown ?? '')
          .catch(() => '')
      : '';

    // Profile digest (cross-source synthesis powering the Consistency + Timeline
    // views) is behind a flag, OFF by default. When disabled the review runs on
    // the uploaded CV + GitHub + LinkedIn directly, with no cross-profile
    // enrichment. See PROFILE_DIGEST_ENABLED.
    const digestEnabled =
      this.config.get<string>('PROFILE_DIGEST_ENABLED') === 'true';

    let digest: ProfileDigest | null = null;
    if (digestEnabled && cmd.email && cmd.isRegistered) {
      digest = await this.resolveDigest({
        email: cmd.email,
        cvBuffer: cmd.cvBuffer,
        cvText,
        linkedinText,
        githubUsername: cmd.githubUsername ?? profile?.githubUsername ?? null,
        portfolioUrl,
        locale: cmd.locale,
      });
    }

    emitStep('reviewing_cv');
    // Stream completed top-level sections as typed events, shaped for the
    // requester's plan — the raw JSON deltas are never sent to the client.
    const shapeCtx = {
      premium: subscriptionState.hasActiveSubscription,
      hired: subscriptionState.plan === 'hired',
    };
    const sectionParser = new SectionStreamParser({
      onSectionStart: (key) => emit({ type: 'generating', section: key }),
      onSection: (key, value) =>
        emit({
          type: 'section',
          key,
          value: shapeSectionForPlan(key, value, shapeCtx),
        }),
    });

    const result = await this.claude.reviewCv({
      cvText,
      githubInfo,
      linkedinText,
      portfolioMarkdown,
      portfolioUrl,
      digest,
      locale: cmd.locale,
      userRoleType: profile?.roleType ?? null,
      onDelta: (delta) => sectionParser.push(delta),
    });

    const { analysisId, claimToken } = await this.persist({ cmd, result, cvText, cvTextFormatted, linkedinText, linkedinTextFormatted, githubInfo });

    if (quotaIntent.consume === 'credit' && cmd.email && analysisId !== null) {
      await this.creditLedger.consume({ email: cmd.email, analysisId, scope: 'review', amount: CREDIT_COSTS.review });
    }

    // Stored result stays complete; the emitted one is shaped for the plan.
    const shapedResult = shapeCvReviewForPlan(result, shapeCtx);
    emit({ type: 'analysis_done', result: shapedResult, analysisId, claimToken });
    return { result: shapedResult, analysisId };
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
      return { tier: 'connected', plan: 'rejected', hasActiveSubscription: false };
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
    });

    return { analysisId: created.id, claimToken: null };
  }

  private async resolveDigest(input: {
    email: string;
    cvBuffer: Buffer;
    cvText: string;
    linkedinText: string;
    githubUsername: string | null;
    portfolioUrl: string | null;
    locale?: string;
  }): Promise<ProfileDigest | null> {
    const extraSourceCount =
      (input.linkedinText ? 1 : 0) +
      (input.githubUsername ? 1 : 0) +
      (input.portfolioUrl ? 1 : 0);
    if (extraSourceCount === 0) return null;

    const currentHashes: DigestSourceHashes = {
      cv: sha256Hex(input.cvBuffer),
      linkedin: input.linkedinText ? sha256Hex(Buffer.from(input.linkedinText)) : null,
      githubUsername: input.githubUsername?.toLowerCase() ?? null,
      portfolioUrl: input.portfolioUrl?.trim().toLowerCase() ?? null,
    };

    const stored = await this.digests.findByEmail(input.email).catch(() => null);

    if (stored && hashesMatch(stored.hashes, currentHashes)) {
      return stored.digest;
    }

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
      this.logger.warn(`[DIGEST_CACHE] regen_failed err=${err?.message || err}`);
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
