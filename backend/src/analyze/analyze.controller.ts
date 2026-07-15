import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { FileFilterCallback } from 'multer';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  AnalyzeRequestDto,
  AnalyzeRequestSchema,
} from './dto/analyze-request.dto';
import { z } from 'zod';

const CvReviewRequestSchema = z.object({
  githubUsername: z.string().max(39).optional(),
  // identity is derived from the JWT (OptionalSupabaseGuard), never the body.
  locale: z.enum(['en', 'fr']).optional().default('en'),
  // Owner teaser flag — only honored for OWNER_EMAILS (see review-cv use case).
  auditMode: z
    .preprocess((v) => v === 'true' || v === true, z.boolean())
    .optional()
    .default(false),
});
import { AnalyzeResponseDto } from './dto/analyze-response.dto';
import { CoverLetterSchema } from './dto/cover-letter.dto';
import { ProfileUpdateSchema } from './dto/profile-update.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { OptionalSupabaseGuard } from '../auth/optional-supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { OptionalAuthEmail } from '../auth/optional-auth.decorator';
import { RequiresPremium } from '../stripe/decorators/requires-premium.decorator';
import { validateJobDescription } from './analyze.utils';

import { AnalyzeCvUseCase } from './application/analyze-cv.use-case';
import { ReviewCvUseCase } from './application/review-cv.use-case';
import { RescanKeywordsUseCase } from './application/rescan-keywords.use-case';
import { computeDeltas } from './domain/rescan-delta';
import { GetQuotaSummaryUseCase } from './application/get-quota-summary.use-case';
import { RewriteCvUseCase } from './application/rewrite-cv.use-case';
import { GenerateCoverLetterUseCase } from './application/generate-cover-letter.use-case';
import { GenerateNegotiationUseCase } from './application/generate-negotiation.use-case';
import { GenerateProfileDigestUseCase } from './application/generate-profile-digest.use-case';
import { LlmJobsService } from '../queue/llm-jobs.service';
import { EnqueueEmailUseCase } from '../notifications/application/enqueue-email.use-case';
import type { EmailLocale } from '../notifications/domain/email.types';
import { GenerateStarterRepoUseCase } from './application/generate-starter-repo.use-case';
import { ANALYSIS_REPOSITORY } from './ports/tokens';
import { AnalysisNotFoundException } from '../common/exceptions';
import type { AnalysisRepository } from './ports/analysis.repository';
import { ListHistoryUseCase } from './application/list-history.use-case';
import { GetAnalysisUseCase } from './application/get-analysis.use-case';
import { DeleteAnalysisUseCase } from './application/delete-analysis.use-case';
import { CreateShareTokenUseCase } from './application/create-share-token.use-case';
import {
  GetProfileUseCase,
  UpdateProfileUseCase,
} from './application/profile.use-cases';
import { ClaimAnalysisUseCase } from './application/claim-analysis.use-case';
import {
  AddSavedCvUseCase,
  ListSavedCvsUseCase,
  RemoveSavedCvUseCase,
} from './application/saved-cv.use-cases';

type SseResponse = {
  setHeader: (k: string, v: string) => void;
  flushHeaders: () => void;
  write: (chunk: string) => void;
  end: () => void;
  writableEnded: boolean;
  headersSent: boolean;
  status: (code: number) => SseResponse;
  json: (body: unknown) => SseResponse;
  /** Node response events — used to detect a client disconnect mid-analysis. */
  on: (event: 'close', cb: () => void) => void;
};

/**
 * Accepted upload MIME types. PDFs are text-extracted by pdf-parse; images (and
 * image-based PDFs that parse to nothing) fall back to Claude vision OCR. See
 * the CV-source extraction in the analyze / review use-cases.
 */
const ALLOWED_UPLOAD_MIMETYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Shared upload guardrails for the public analyze endpoints: cap each file at
 * 10 MB and at most 3 files, and reject anything that isn't a PDF or supported
 * image before it reaches pdf-parse / Claude. Prevents memory exhaustion and
 * cost-bleed from oversized or junk uploads on the unauthenticated path.
 */
/** Min chars of inline-edited CV text accepted by the inline re-scan route. */
const MIN_INLINE_CV_CHARS = 200;

const PDF_UPLOAD_OPTIONS = {
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (ALLOWED_UPLOAD_MIMETYPES.has(file.mimetype)) cb(null, true);
    else
      cb(
        new BadRequestException(
          'Only PDF or image (JPEG, PNG, WebP) files are accepted',
        ),
      );
  },
};

@ApiTags('Analyze')
@Controller('api/analyze')
export class AnalyzeController {
  private readonly logger = new Logger(AnalyzeController.name);

  constructor(
    private readonly analyzeCv: AnalyzeCvUseCase,
    private readonly reviewCvUc: ReviewCvUseCase,
    private readonly rescanKeywordsUc: RescanKeywordsUseCase,
    private readonly getQuotaSummary: GetQuotaSummaryUseCase,
    private readonly rewriteCvUc: RewriteCvUseCase,
    private readonly generateCoverLetter: GenerateCoverLetterUseCase,
    private readonly generateNegotiationUc: GenerateNegotiationUseCase,
    private readonly generateProfileDigestUc: GenerateProfileDigestUseCase,
    private readonly listHistory: ListHistoryUseCase,
    private readonly getAnalysisUc: GetAnalysisUseCase,
    private readonly deleteAnalysisUc: DeleteAnalysisUseCase,
    private readonly getProfileUc: GetProfileUseCase,
    private readonly updateProfileUc: UpdateProfileUseCase,
    private readonly claimUc: ClaimAnalysisUseCase,
    private readonly listSavedCvsUc: ListSavedCvsUseCase,
    private readonly addSavedCvUc: AddSavedCvUseCase,
    private readonly removeSavedCvUc: RemoveSavedCvUseCase,
    private readonly createShareTokenUc: CreateShareTokenUseCase,
    private readonly generateStarterRepoUc: GenerateStarterRepoUseCase,
    private readonly llmJobs: LlmJobsService,
    private readonly enqueueEmail: EnqueueEmailUseCase,
    @Inject(ANALYSIS_REPOSITORY) private readonly analysisRepo: AnalysisRepository,
  ) {}

  /**
   * "Report ready" email for users whose SSE connection closed before the
   * analysis finished. Fire-and-forget + idempotent (dedupeKey
   * analysis_ready:email:analysisId) — never blocks or fails the request.
   */
  /**
   * Owner audit mode: create (or fetch) the public share token and stream a
   * `share` event carrying just the token — the client builds its own URL.
   * Best-effort: a share failure must not break the analysis response.
   */
  private async emitAuditShare(
    analysisId: number,
    email: string,
    write: (data: object) => void,
  ): Promise<void> {
    try {
      const { token } = await this.createShareTokenUc.execute(analysisId, email);
      write({ step: 'share', token });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `audit-mode share token failed (analysisId=${analysisId}): ${msg}`,
      );
    }
  }

  private notifyReportReady(args: {
    email: string;
    analysisId: number;
    locale: string | undefined;
    role: string | null;
  }): void {
    void this.enqueueEmail
      .execute({
        to: args.email,
        locale: args.locale === 'fr' ? 'fr' : ('en' as EmailLocale),
        context: {
          type: 'analysis_ready',
          analysisId: args.analysisId,
          role: args.role,
        },
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `analysis_ready enqueue failed (analysisId=${args.analysisId}): ${msg}`,
        );
      });
  }

  /** Public endpoint — works for anonymous users (IP-based quota) and registered users. */
  // Tight IP-based rate limit on top of the per-email/per-IP quota policy.
  // Real per-analysis Claude cost is ~$0.15-0.40 for a registered hot+deep run
  // (two Sonnet calls) and ~$0.12-0.15 for an anonymous HOT-only run — i.e.
  // roughly 10x the old "~$0.036" estimate this comment used to cite. With
  // input now token-capped (MAX_MODEL_INPUT_CHARS) the worst case is bounded;
  // 10 reqs / 5 min still leaves headroom for legitimate re-uploads after CV
  // edits while capping worst-case spend at roughly $15-20/hour/IP.
  @Throttle({ default: { limit: 10, ttl: 5 * 60_000 } })
  @UseGuards(OptionalSupabaseGuard)
  @Post()
  @ApiOperation({ summary: 'Analyze a CV against a job description' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AnalyzeRequestDto })
  @ApiOkResponse({ type: AnalyzeResponseDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv', maxCount: 1 },
        { name: 'linkedin', maxCount: 1 },
        { name: 'motivationLetter', maxCount: 1 },
      ],
      PDF_UPLOAD_OPTIONS,
    ),
  )
  async analyze(
    @UploadedFiles()
    files: {
      cv?: Express.Multer.File[];
      linkedin?: Express.Multer.File[];
      motivationLetter?: Express.Multer.File[];
    },
    @Body() body: unknown,
    @OptionalAuthEmail() email: string | undefined,
    @Res() res: SseResponse,
    @Req() req: Request,
  ) {
    const parsed = AnalyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const {
      jobDescription,
      jobLabel,
      githubUsername,
      motivationLetterText,
      locale,
      auditMode,
    } = parsed.data;
    // Identity comes from the verified JWT, not the request body.
    const isRegistered = !!email;

    // `trust proxy` is set in main.ts, so req.ip is the real client IP (Express
    // parses X-Forwarded-For and drops the trusted proxy hop). Reading the raw
    // header's left entry here would let a client forge it to bypass the cap.
    const ip = req.ip;

    const jdValidation = validateJobDescription(jobDescription);
    if (!jdValidation.valid) {
      return res.status(422).json({ message: jdValidation.reason });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (data: object) =>
      res.write(`data: ${JSON.stringify(data)}\n\n`);

    // The analysis keeps running (and persists) after a client disconnect —
    // res.write() becomes a no-op. Track the disconnect so we can email the
    // user a "report ready" link once the run completes.
    let clientGone = false;
    res.on('close', () => {
      if (!res.writableEnded) clientGone = true;
    });

    try {
      const { result, analysisId, auditMode: auditApplied, keywordMatch } =
        await this.analyzeCv.execute(
        {
          cvBuffer: files.cv?.[0]?.buffer,
          cvMimeType: files.cv?.[0]?.mimetype,
          jobDescription,
          jobLabel,
          linkedinBuffer: files.linkedin?.[0]?.buffer,
          motivationLetterBuffer: files.motivationLetter?.[0]?.buffer,
          motivationLetterText,
          githubUsername,
          email,
          ip,
          isRegistered,
          locale,
          auditMode,
        },
        (e) => {
          if (e.type === 'step') write({ step: e.step });
          else if (e.type === 'generating')
            write({ step: 'generating', section: e.section });
          else if (e.type === 'section')
            write({ step: 'section', key: e.key, value: e.value });
          else if (e.type === 'analysis_done')
            write({
              step: 'analysis_done',
              result: e.result,
              analysisId: e.analysisId,
              cvTextFormatted: e.cvTextFormatted || null,
              linkedinTextFormatted: e.linkedinTextFormatted || null,
              motivationLetterText: e.motivationLetterText || null,
              keywordMatch: e.keywordMatch,
            });
          else if (e.type === 'negotiation_delta')
            write({ step: 'negotiation_delta', delta: e.delta });
          else if (e.type === 'negotiation_done')
            write({ step: 'negotiation_done', negotiation: e.negotiation });
        },
      );

      // Owner audit mode: mint the public share link and hand it to the
      // client so it can be copied straight away (before `done`).
      if (auditApplied && email && analysisId !== null) {
        await this.emitAuditShare(analysisId, email, write);
      }

      write({ step: 'done', result, analysisId, keywordMatch });

      if (clientGone && email && analysisId !== null) {
        this.notifyReportReady({
          email,
          analysisId,
          locale,
          role: result.job_details?.title ?? null,
        });
      }
    } catch (err: any) {
      if (res.writableEnded) return;
      write({
        step: 'error',
        message: err?.message || 'Analysis failed',
        code: err?.code || err?.response?.code,
        // QuotaExceededException ships { plan, monthlyCap } here so the
        // frontend can render the right paywall variant.
        details: err?.details ?? err?.response?.details,
      });
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  @Throttle({ default: { limit: 10, ttl: 5 * 60_000 } })
  @UseGuards(OptionalSupabaseGuard)
  @Post('cv-review')
  @ApiOperation({ summary: 'Audit a CV standalone (no job description)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv', maxCount: 1 },
        { name: 'linkedin', maxCount: 1 },
      ],
      PDF_UPLOAD_OPTIONS,
    ),
  )
  async reviewCv(
    @UploadedFiles()
    files: {
      cv?: Express.Multer.File[];
      linkedin?: Express.Multer.File[];
    },
    @Body() body: unknown,
    @OptionalAuthEmail() email: string | undefined,
    @Res() res: SseResponse,
    @Req() req: Request,
  ) {
    const parsed = CvReviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const { githubUsername, locale, auditMode } = parsed.data;
    // Identity comes from the verified JWT, not the request body.
    const isRegistered = !!email;

    if (!files.cv?.[0]) {
      return res.status(400).json({ message: 'CV is required' });
    }

    // `trust proxy` is set in main.ts, so req.ip is the real client IP (Express
    // parses X-Forwarded-For and drops the trusted proxy hop). Reading the raw
    // header's left entry here would let a client forge it to bypass the cap.
    const ip = req.ip;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (data: object) =>
      res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Same disconnect handling as the analyze endpoint — the review keeps
    // running and we email the report link when the tab was closed.
    let clientGone = false;
    res.on('close', () => {
      if (!res.writableEnded) clientGone = true;
    });

    try {
      const { result, analysisId, auditMode: auditApplied } =
        await this.reviewCvUc.execute(
        {
          cvBuffer: files.cv[0].buffer,
          cvMimeType: files.cv[0].mimetype,
          linkedinBuffer: files.linkedin?.[0]?.buffer,
          githubUsername,
          email,
          ip,
          isRegistered,
          locale,
          auditMode,
        },
        (e) => {
          if (e.type === 'step') write({ step: e.step });
          else if (e.type === 'generating')
            write({ step: 'generating', section: e.section });
          else if (e.type === 'section')
            write({ step: 'section', key: e.key, value: e.value });
          else if (e.type === 'analysis_done')
            write({
              step: 'analysis_done',
              result: e.result,
              analysisId: e.analysisId,
            });
        },
      );

      if (auditApplied && email && analysisId !== null) {
        await this.emitAuditShare(analysisId, email, write);
      }

      write({ step: 'done', result, analysisId });

      if (clientGone && email && analysisId !== null) {
        this.notifyReportReady({ email, analysisId, locale, role: null });
      }
    } catch (err: any) {
      if (res.writableEnded) return;
      write({
        step: 'error',
        message: err?.message || 'CV review failed',
        code: err?.code || err?.response?.code,
        details: err?.details ?? err?.response?.details,
      });
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  @UseGuards(SupabaseGuard)
  @Get('quota')
  @ApiOperation({
    summary:
      'Get the authenticated user current monthly quota usage and one-time credit balance',
  })
  async getQuota(@AuthEmail() email: string) {
    return this.getQuotaSummary.execute(email);
  }

  @UseGuards(SupabaseGuard)
  @Get('history')
  @ApiOperation({ summary: 'Get analysis history for the authenticated user' })
  async getHistory(
    @AuthEmail() email: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.listHistory.execute(email, +page, +limit);
  }

  @UseGuards(SupabaseGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get profile of the authenticated user' })
  async getProfile(
    @AuthEmail() email: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    // Best-effort locale for the (first-load only) welcome email; the rest of
    // the response is locale-agnostic.
    const locale = (acceptLanguage ?? '').toLowerCase().startsWith('fr')
      ? 'fr'
      : 'en';
    return this.getProfileUc.execute(email, locale);
  }

  @UseGuards(SupabaseGuard)
  @Post('profile/refresh-digest')
  @ApiOperation({
    summary:
      'Regenerate the ProfileDigest for the authenticated user from their current profile sources (GitHub username, portfolio URL, optional inline CV/LinkedIn text). Sources missing from the request are pulled from the stored Profile row.',
  })
  async refreshProfileDigest(
    @AuthEmail() email: string,
    @Body()
    body: {
      cvText?: string;
      linkedinText?: string;
      locale?: string;
    } = {},
  ) {
    const { digest, hashes } = await this.generateProfileDigestUc.execute({
      email,
      cvText: body.cvText,
      linkedinText: body.linkedinText,
      locale: body.locale,
    });
    return { digest, hashes };
  }

  @UseGuards(SupabaseGuard)
  @Post('profile')
  @ApiOperation({ summary: 'Update profile of the authenticated user' })
  async updateProfile(
    @AuthEmail() email: string,
    @Body() body: unknown,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    if (
      body &&
      typeof body === 'object' &&
      'username' in (body as Record<string, unknown>)
    ) {
      throw new BadRequestException(
        'Use POST /api/profile/claim-username to set your username',
      );
    }
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    const locale = (acceptLanguage ?? '').toLowerCase().startsWith('fr')
      ? 'fr'
      : 'en';
    return this.updateProfileUc.execute(email, parsed.data, locale);
  }

  @UseGuards(SupabaseGuard)
  @Post('claim')
  @ApiOperation({ summary: 'Attach an anonymous analysis to the account' })
  async claimAnalysis(@AuthEmail() email: string, @Body() body: unknown) {
    const token = (body as { claimToken?: unknown } | null)?.claimToken;
    if (typeof token !== 'string' || !token) {
      throw new BadRequestException('claimToken is required');
    }
    const result = await this.claimUc.execute(email, token);
    if (!result) {
      throw new NotFoundException('Analysis not found or already claimed');
    }
    return result; // { analysisId }
  }

  @RequiresPremium()
  @Get('saved-cvs')
  async listSavedCvs(@AuthEmail() email: string) {
    return this.listSavedCvsUc.execute(email);
  }

  @RequiresPremium()
  @Post('saved-cvs')
  async addSavedCv(
    @AuthEmail() email: string,
    @Body() body: { name: string; url: string },
  ) {
    return this.addSavedCvUc.execute(email, body.name, body.url);
  }

  @RequiresPremium()
  @Delete('saved-cvs/:id')
  async removeSavedCv(@AuthEmail() email: string, @Param('id') id: string) {
    await this.removeSavedCvUc.execute(email, parseInt(id));
    return { ok: true };
  }

  // Auth only — entitlement (subscription OR one-time per-analysis unlock) is
  // enforced inside RewriteCvUseCase, which has the analysisId.
  @UseGuards(SupabaseGuard)
  @Post('rewrite')
  @ApiOperation({
    summary: 'Rewrite a CV (premium: subscription or one-time unlock)',
  })
  async rewrite(
    @AuthEmail() email: string,
    @Body() body: { analysisId: number; locale?: string },
    @Res() res: SseResponse,
  ) {
    const { analysisId, locale = 'en' } = body;
    if (!analysisId) {
      return res.status(400).json({ message: 'analysisId is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (data: object) =>
      res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      write({ step: 'rewriting' });
      const result = await this.rewriteCvUc.execute(analysisId, email, locale);
      write({ step: 'done', reconstructed_cv: result.reconstructed_cv });
    } catch (err: any) {
      if (!res.writableEnded) {
        write({
          step: 'error',
          message: err?.message || 'Rewrite failed',
          code: err?.code || err?.response?.code,
        });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  @RequiresPremium('hired')
  @Post('cover-letter')
  @ApiOperation({
    summary: 'Generate a cover letter from an existing analysis',
  })
  async coverLetter(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = CoverLetterSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.generateCoverLetter.execute(
      email,
      parsed.data.analysisId,
      parsed.data.language,
    );
  }

  @RequiresPremium('hired')
  @Post(':id/negotiation')
  @ApiOperation({
    summary:
      'Generate (or fetch cached) negotiation playbook for a given analysis',
  })
  async negotiation(
    @AuthEmail() email: string,
    @Param('id') rawId: string,
    @Body() body: { locale?: string } = {},
  ) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    const negotiation = await this.generateNegotiationUc.execute(
      id,
      email,
      body?.locale || 'en',
    );
    return { negotiation };
  }

  @UseGuards(SupabaseGuard)
  @Get(':id')
  @ApiOperation({
    summary:
      'Get a specific analysis by ID (must belong to the authenticated user)',
  })
  @ApiOkResponse({ type: AnalyzeResponseDto })
  async getAnalysis(@AuthEmail() email: string, @Param('id') rawId: string) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    return this.getAnalysisUc.execute(id, email);
  }

  /**
   * FREE keyword-only re-scan (the retention loop). Re-upload a corrected CV;
   * we re-run the deterministic keyword match against the SAME stored job
   * description and return the new coverage + a before/after delta + the timeline
   * of attempts. No LLM, no credits — returns JSON synchronously (it's fast).
   */
  @Throttle({ default: { limit: 20, ttl: 5 * 60_000 } })
  @UseGuards(SupabaseGuard)
  @Post(':id/rescan-keywords')
  @ApiOperation({
    summary:
      'Free keyword-only re-scan of a corrected CV against the same job (no LLM, no credits)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cv', maxCount: 1 }], PDF_UPLOAD_OPTIONS),
  )
  async rescanKeywords(
    @UploadedFiles() files: { cv?: Express.Multer.File[] },
    @AuthEmail() email: string,
    @Param('id') rawId: string,
  ) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    if (!files.cv?.[0]) throw new BadRequestException('CV is required');
    return this.rescanKeywordsUc.execute({
      analysisId: id,
      email,
      cvBuffer: files.cv[0].buffer,
      cvMimeType: files.cv[0].mimetype,
    });
  }

  /**
   * Keyword re-scan timeline + current baseline for an analysis. Lets the result
   * view render the coverage chart and the present/absent table on load, without
   * running a re-scan first.
   */
  @UseGuards(SupabaseGuard)
  @Get(':id/rescans')
  @ApiOperation({ summary: 'Keyword re-scan history for an analysis' })
  async getRescans(@AuthEmail() email: string, @Param('id') rawId: string) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    // Ownership check: findDetailById is scoped to (id, email).
    const detail = await this.analysisRepo.findDetailById(id, email);
    if (!detail) throw new AnalysisNotFoundException(id);
    const rows = await this.analysisRepo.listRescans(id);
    return {
      baseline: detail.keywordMatch,
      timeline: rows.map((r) => ({
        coverageScore: r.coverageScore,
        matchedCount: r.matchedCount,
        totalCount: r.totalCount,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * FULL (paid) re-scan: re-analyze a corrected CV against the SAME stored job
   * description, producing fresh narrative/fixes and a new analysis linked back
   * to the original (parentAnalysisId). Consumes quota/credits like a normal
   * analysis. Streams SSE, then a `rescan_deltas` frame with the before/after
   * diff against the original.
   */
  @Throttle({ default: { limit: 10, ttl: 5 * 60_000 } })
  @UseGuards(SupabaseGuard)
  @Post(':id/rescan')
  @ApiOperation({
    summary:
      'Full re-scan: re-analyze a corrected CV against the same job, linked to the original (consumes quota/credits)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv', maxCount: 1 },
        { name: 'linkedin', maxCount: 1 },
        { name: 'motivationLetter', maxCount: 1 },
      ],
      PDF_UPLOAD_OPTIONS,
    ),
  )
  async rescan(
    @UploadedFiles()
    files: {
      cv?: Express.Multer.File[];
      linkedin?: Express.Multer.File[];
      motivationLetter?: Express.Multer.File[];
    },
    @Body() body: unknown,
    @AuthEmail() email: string,
    @Param('id') rawId: string,
    @Res() res: SseResponse,
    @Req() req: Request,
  ) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
    if (!files.cv?.[0]) {
      return res.status(400).json({ message: 'CV is required' });
    }

    const parsedBody = z
      .object({
        githubUsername: z.string().max(39).optional(),
        locale: z.enum(['en', 'fr']).optional().default('en'),
      })
      .safeParse(body);
    if (!parsedBody.success) {
      return res
        .status(400)
        .json({ message: parsedBody.error.issues[0].message });
    }
    const { githubUsername, locale } = parsedBody.data;

    return this.streamFullRescan(
      res,
      req,
      id,
      email,
      {
        cvBuffer: files.cv[0].buffer,
        cvMimeType: files.cv[0].mimetype,
        linkedinBuffer: files.linkedin?.[0]?.buffer,
        motivationLetterBuffer: files.motivationLetter?.[0]?.buffer,
      },
      { githubUsername, locale },
    );
  }

  /**
   * JSON inline re-scan: the corrected CV is edited TEXT from the app
   * (bullets/skills), not a re-uploaded file. Powers the inline re-scan loop.
   * Consumes quota/credits like a normal analysis; same SSE + deltas as
   * :id/rescan.
   */
  @Throttle({ default: { limit: 10, ttl: 5 * 60_000 } })
  @UseGuards(SupabaseGuard)
  @Post(':id/rescan-inline')
  @ApiOperation({
    summary:
      'Full re-scan from inline-edited CV text (bullets/skills), linked to the original (consumes quota/credits)',
  })
  async rescanInline(
    @Body() body: unknown,
    @AuthEmail() email: string,
    @Param('id') rawId: string,
    @Res() res: SseResponse,
    @Req() req: Request,
  ) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

    const parsedBody = z
      .object({
        cvText: z.string(),
        githubUsername: z.string().max(39).optional(),
        locale: z.enum(['en', 'fr']).optional().default('en'),
      })
      .safeParse(body);
    if (!parsedBody.success) {
      return res
        .status(400)
        .json({ message: parsedBody.error.issues[0].message });
    }
    const { cvText, githubUsername, locale } = parsedBody.data;
    if (cvText.trim().length < MIN_INLINE_CV_CHARS) {
      return res.status(400).json({
        message:
          'The edited CV is too short to re-scan. Keep your full CV text, not just the edits.',
      });
    }

    return this.streamFullRescan(
      res,
      req,
      id,
      email,
      { cvText },
      { githubUsername, locale },
    );
  }

  /**
   * Shared streaming body for the two full re-scan routes (file upload and
   * inline edited text). Loads the parent for ownership + the locked JD, streams
   * the fresh analysis as SSE, then emits the before/after deltas.
   */
  private async streamFullRescan(
    res: SseResponse,
    req: Request,
    id: number,
    email: string,
    source:
      | {
          cvBuffer: Buffer;
          cvMimeType?: string;
          linkedinBuffer?: Buffer;
          motivationLetterBuffer?: Buffer;
        }
      | { cvText: string },
    opts: { githubUsername?: string; locale: 'en' | 'fr' },
  ): Promise<void> {
    // Load the original: proves ownership, supplies the locked JD, and gives us
    // the (merged, shaped) result to diff the re-scan against.
    let parent;
    try {
      parent = await this.getAnalysisUc.execute(id, email);
    } catch {
      res.status(404).json({ message: 'Analysis not found' });
      return;
    }
    if (!parent.jobDescription || !parent.result) {
      res.status(400).json({
        message: 'This analysis has no job description to re-scan against.',
      });
      return;
    }
    const parentResult = parent.result;
    const parentCoverage = parent.keywordMatch?.coverageScore ?? null;

    const ip = req.ip;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (data: object) =>
      res.write(`data: ${JSON.stringify(data)}\n\n`);

    let clientGone = false;
    res.on('close', () => {
      if (!res.writableEnded) clientGone = true;
    });

    try {
      const { result, analysisId, keywordMatch } = await this.analyzeCv.execute(
        {
          ...source,
          jobDescription: parent.jobDescription,
          jobLabel: parent.jobLabel ?? undefined,
          githubUsername: opts.githubUsername,
          email,
          ip,
          isRegistered: true,
          locale: opts.locale,
          parentAnalysisId: id,
        },
        (e) => {
          if (e.type === 'step') write({ step: e.step });
          else if (e.type === 'generating')
            write({ step: 'generating', section: e.section });
          else if (e.type === 'section')
            write({ step: 'section', key: e.key, value: e.value });
          else if (e.type === 'analysis_done')
            write({
              step: 'analysis_done',
              result: e.result,
              analysisId: e.analysisId,
              cvTextFormatted: e.cvTextFormatted || null,
              linkedinTextFormatted: e.linkedinTextFormatted || null,
              motivationLetterText: e.motivationLetterText || null,
              keywordMatch: e.keywordMatch,
            });
        },
      );

      // Before/after diff against the original — the payoff of the whole loop.
      const deltas = computeDeltas(parentResult, result, {
        coverageBefore: parentCoverage,
        coverageAfter: keywordMatch?.coverageScore ?? null,
      });
      write({ step: 'rescan_deltas', parentAnalysisId: id, deltas });

      write({ step: 'done', result, analysisId, keywordMatch });

      if (clientGone && analysisId !== null) {
        this.notifyReportReady({
          email,
          analysisId,
          locale: opts.locale,
          role: result.job_details?.title ?? null,
        });
      }
    } catch (err: any) {
      if (res.writableEnded) return;
      write({
        step: 'error',
        message: err?.message || 'Re-scan failed',
        code: err?.code || err?.response?.code,
        details: err?.details ?? err?.response?.details,
      });
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  @UseGuards(SupabaseGuard)
  @Patch(':id/files')
  @ApiOperation({ summary: 'Attach persisted file URLs (Supabase Storage) to an analysis' })
  async attachFileUrls(
    @AuthEmail() email: string,
    @Param('id') rawId: string,
    @Body() body: unknown,
  ) {
    const id = parseInt(rawId as string, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    const urlSchema = z.string().url().optional();
    const parsed = z.object({
      cvFileUrl: urlSchema,
      liFileUrl: urlSchema,
      mlFileUrl: urlSchema,
    }).safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid payload');
    await this.analysisRepo.attachFileUrls(id, email, parsed.data);
    return { ok: true };
  }

  @UseGuards(SupabaseGuard)
  @Patch(':id/bridge-progress')
  async saveBridgeProgress(
    @AuthEmail() email: string,
    @Param('id') rawId: string,
    @Body() body: unknown,
  ) {
    const id = parseInt(rawId as string, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    const parsed = z.object({ completed_steps: z.array(z.number().int().min(0)) }).safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid payload');
    await this.analysisRepo.saveCompletedSteps(id, email, parsed.data.completed_steps);
    return { ok: true };
  }

  @UseGuards(SupabaseGuard)
  @Patch(':id/outcome')
  @ApiOperation({
    summary: "Set the real-world outcome the user reports for their analysis",
  })
  async setOutcome(
    @AuthEmail() email: string,
    @Param('id') rawId: string,
    @Body() body: unknown,
  ) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    const parsed = z
      .object({
        outcome: z.enum([
          'not_applied',
          'applied',
          'no_response',
          'interview',
          'offer',
          'rejected',
        ]),
      })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid outcome');
    const updated = await this.analysisRepo.setOutcome(
      id,
      email,
      parsed.data.outcome,
    );
    if (!updated) throw new AnalysisNotFoundException();
    return { ok: true, outcome: parsed.data.outcome };
  }

  @UseGuards(SupabaseGuard)
  @Post(':id/delete')
  @ApiOperation({
    summary: 'Delete an analysis (must belong to the authenticated user)',
  })
  async deleteAnalysis(@AuthEmail() email: string, @Param('id') rawId: string) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    await this.deleteAnalysisUc.execute(id, email);
    return { ok: true };
  }

  @UseGuards(SupabaseGuard)
  @Post(':id/share')
  @ApiOperation({
    summary: 'Generate (or return existing) public share token for an analysis',
  })
  async createShareToken(@AuthEmail() email: string, @Param('id') rawId: string) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    return this.createShareTokenUc.execute(id, email);
  }

  // No auth guard: the claimToken is the bearer of ownership for a logged-out
  // analysis. Unlocks the viral share loop for anonymous users.
  @Post('share-anonymous')
  @ApiOperation({
    summary: 'Generate a public share token for an anonymous analysis (by claimToken)',
  })
  async createShareTokenAnonymous(@Body() body: unknown) {
    const token = (body as { claimToken?: unknown } | null)?.claimToken;
    if (typeof token !== 'string' || !token) {
      throw new BadRequestException('claimToken is required');
    }
    const result = await this.createShareTokenUc.executeForClaim(token);
    if (!result) {
      throw new NotFoundException('Analysis not found, already claimed, or empty');
    }
    return result; // { token }
  }

  @RequiresPremium('shortlisted')
  @Post(':id/starter-repo')
  @ApiOperation({
    summary: 'Generate (or return cached) starter repo ZIP for the bridge project',
  })
  async starterRepo(
    @AuthEmail() email: string,
    @Param('id') rawId: string,
    @Res() res: SseResponse,
  ) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');

    const { repo, projectName } = await this.generateStarterRepoUc.execute(id, email);

    const zipSlug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'starter-repo';

    // Build ZIP in memory with jszip
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const JSZip = require('jszip') as typeof import('jszip');
    const zip = new JSZip();
    for (const file of repo.files) {
      zip.file(file.path, file.content);
    }
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    (res as unknown as import('express').Response)
      .set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipSlug}.zip"`,
        'Content-Length': String(buffer.length),
      })
      .end(buffer);
  }
}
