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
import { QuotaExceededException } from '../../common/exceptions';
import { CREDIT_LEDGER_REPOSITORY } from '../../credits/ports/tokens';
import type { CreditLedgerRepository } from '../../credits/ports/credit-ledger.repository';
import type { Plan, QuotaDecision } from '../domain/quota.policy';
import { CREDIT_COSTS, decideQuota, startOfMonthUTC } from '../domain/quota.policy';

function toQuotaPlan(legacyPlan: 'rejected' | 'shortlisted' | 'hired'): Plan {
  return legacyPlan === 'rejected' ? 'free' : legacyPlan;
}

export type ReviewCvCommand = {
  cvBuffer?: Buffer;
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
  | { type: 'analysis_delta'; delta: string }
  | {
      type: 'analysis_done';
      result: CvReviewResponse;
      analysisId: number | null;
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

    const [cvText, linkedinText, githubSnapshot] = await Promise.all([
      this.pdf.parse(cmd.cvBuffer),
      this.tryParse(cmd.linkedinBuffer),
      cmd.githubUsername
        ? this.github.fetchProfile(cmd.githubUsername).catch(() => null)
        : Promise.resolve(null),
    ]);

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

    let digest: ProfileDigest | null = null;
    if (cmd.email && cmd.isRegistered) {
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
    const result = await this.claude.reviewCv({
      cvText,
      githubInfo,
      linkedinText,
      portfolioMarkdown,
      portfolioUrl,
      digest,
      locale: cmd.locale,
      userRoleType: profile?.roleType ?? null,
      onDelta: (delta) => emit({ type: 'analysis_delta', delta }),
    });

    const analysisId = await this.persist({ cmd, result, cvText, linkedinText, githubInfo });

    if (quotaIntent.consume === 'credit' && cmd.email && analysisId !== null) {
      await this.creditLedger.consume({ email: cmd.email, analysisId, amount: CREDIT_COSTS.review });
    }

    emit({ type: 'analysis_done', result, analysisId });
    return { result, analysisId };
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

  private async tryParse(buffer?: Buffer): Promise<string> {
    if (!buffer) return '';
    try {
      return await this.pdf.parse(buffer);
    } catch {
      return '';
    }
  }

  private async persist(args: {
    cmd: ReviewCvCommand;
    result: CvReviewResponse;
    cvText: string;
    linkedinText: string;
    githubInfo: string;
  }): Promise<number | null> {
    const { cmd, result } = args;

    if (!cmd.isRegistered || !cmd.email) {
      await this.analyses.saveAnonymous(cmd.ip);
      return null;
    }

    const created = await this.analyses.saveRegistered({
      email: cmd.email,
      ip: cmd.ip,
      jobDescription: '',
      jobLabel: null,
      company: 'CV Review',
      jdLanguage: 'en',
      cvText: args.cvText || null,
      linkedinText: args.linkedinText || null,
      githubInfo: args.githubInfo || null,
      motivationLetter: null,
      result: result as unknown as Parameters<AnalysisRepository['saveRegistered']>[0]['result'],
    });

    return created.id;
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
