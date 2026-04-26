import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ANALYSIS_REPOSITORY,
  CLAUDE_PROVIDER,
  GITHUB_PROVIDER,
  PDF_PARSER,
  SUBSCRIPTION_GATE,
} from '../ports/tokens';
import type {
  AnalysisRepository,
  ApplicationUpsertInput,
} from '../ports/analysis.repository';
import type { ClaudeProvider } from '../ports/claude.provider';
import type { GithubProvider } from '../ports/github.provider';
import type { PdfParser } from '../ports/pdf.parser';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import { decideQuota } from '../domain/quota.policy';
import type { AnalyzeResponse } from '../dto/analyze-response.dto';
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
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
    @Inject(GITHUB_PROVIDER) private readonly github: GithubProvider,
    @Inject(PDF_PARSER) private readonly pdf: PdfParser,
    @Inject(SUBSCRIPTION_GATE) private readonly subs: SubscriptionGate,
  ) {}

  async execute(
    cmd: AnalyzeCvCommand,
    onStep?: (step: string) => void,
  ): Promise<AnalyzeCvResult> {
    if (!cmd.cvBuffer) throw new BadRequestException('CV is required');

    await this.assertQuota(cmd.email, cmd.ip);

    onStep?.('parsing_cv');
    const cvText = await this.pdf.parse(cmd.cvBuffer);
    const jobText = cmd.jobDescription.trim().slice(0, 8000);

    onStep?.('matching_skills');
    const linkedinText = await this.tryParse(cmd.linkedinBuffer);
    const motivationLetterText = await this.resolveMotivationLetter(
      cmd.motivationLetterText,
      cmd.motivationLetterBuffer,
      onStep,
    );

    let githubInfo = '';
    if (cmd.githubUsername) {
      onStep?.('analyzing_github');
      const snapshot = await this.github.fetchProfile(cmd.githubUsername);
      if (snapshot) githubInfo = JSON.stringify(snapshot, null, 2);
    }

    onStep?.('dual_ai_analysis');
    const result = await this.claude.analyzeApplication({
      jobText,
      cvText,
      githubInfo,
      linkedinText,
      motivationLetterText,
      locale: cmd.locale,
    });

    const analysisId = await this.persist({
      cmd,
      result,
      cvText,
      linkedinText,
      githubInfo,
      motivationLetterText,
    });

    return { result, analysisId };
  }

  private async assertQuota(email?: string, ip?: string): Promise<void> {
    const hasActiveSubscription = email
      ? await this.subs.isPremium(email)
      : false;
    const countByEmail = email ? await this.analyses.countByEmail(email) : 0;
    const countByIp = ip ? await this.analyses.countByIp(ip) : 0;

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
    onStep?: (step: string) => void,
  ): Promise<string> {
    if (text) return text.trim().slice(0, MAX_TEXT_CHARS);
    if (buffer) {
      onStep?.('parsing_motivation_letter');
      return this.tryParse(buffer);
    }
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
