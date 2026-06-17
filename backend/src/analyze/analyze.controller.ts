import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
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
import { GetQuotaSummaryUseCase } from './application/get-quota-summary.use-case';
import { RewriteCvUseCase } from './application/rewrite-cv.use-case';
import { GenerateCoverLetterUseCase } from './application/generate-cover-letter.use-case';
import { GenerateNegotiationUseCase } from './application/generate-negotiation.use-case';
import { GenerateProfileDigestUseCase } from './application/generate-profile-digest.use-case';
import { RegenerateDeepUseCase } from './application/regenerate-deep.use-case';
import { GenerateStarterRepoUseCase } from './application/generate-starter-repo.use-case';
import { ANALYSIS_REPOSITORY } from './ports/tokens';
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
};

/**
 * Shared upload guardrails for the public analyze endpoints: cap each file at
 * 10 MB and at most 3 files, and reject anything that isn't a PDF before it
 * reaches pdf-parse / Claude. Prevents memory exhaustion and cost-bleed from
 * oversized or junk uploads on the unauthenticated path.
 */
const PDF_UPLOAD_OPTIONS = {
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new BadRequestException('Only PDF files are accepted'));
  },
};

@ApiTags('Analyze')
@Controller('api/analyze')
export class AnalyzeController {
  constructor(
    private readonly analyzeCv: AnalyzeCvUseCase,
    private readonly reviewCvUc: ReviewCvUseCase,
    private readonly getQuotaSummary: GetQuotaSummaryUseCase,
    private readonly rewriteCvUc: RewriteCvUseCase,
    private readonly generateCoverLetter: GenerateCoverLetterUseCase,
    private readonly generateNegotiationUc: GenerateNegotiationUseCase,
    private readonly generateProfileDigestUc: GenerateProfileDigestUseCase,
    private readonly regenerateDeepUc: RegenerateDeepUseCase,
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
    @Inject(ANALYSIS_REPOSITORY) private readonly analysisRepo: AnalysisRepository,
  ) {}

  /** Public endpoint — works for anonymous users (IP-based quota) and registered users. */
  // Tight IP-based rate limit on top of the per-email/per-IP quota policy: at
  // ~$0.036 per analyze (hot + deep + negotiation Claude calls combined), an
  // unthrottled retry loop could burn cash quickly. 10 reqs / 5 min leaves
  // headroom for legitimate iteration (re-uploading after CV edits) while
  // capping worst-case spend at ~$5/hour/IP.
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
    } = parsed.data;
    // Identity comes from the verified JWT, not the request body.
    const isRegistered = !!email;

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

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

    try {
      const { result, analysisId } = await this.analyzeCv.execute(
        {
          cvBuffer: files.cv?.[0]?.buffer,
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
        },
        (e) => {
          if (e.type === 'step') write({ step: e.step });
          else if (e.type === 'analysis_delta')
            write({ step: 'analysis_delta', delta: e.delta });
          else if (e.type === 'analysis_done')
            write({
              step: 'analysis_done',
              result: e.result,
              analysisId: e.analysisId,
              cvTextFormatted: e.cvTextFormatted || null,
              linkedinTextFormatted: e.linkedinTextFormatted || null,
              motivationLetterText: e.motivationLetterText || null,
            });
          else if (e.type === 'negotiation_delta')
            write({ step: 'negotiation_delta', delta: e.delta });
          else if (e.type === 'negotiation_done')
            write({ step: 'negotiation_done', negotiation: e.negotiation });
        },
      );

      write({ step: 'done', result, analysisId });
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
    const { githubUsername, locale } = parsed.data;
    // Identity comes from the verified JWT, not the request body.
    const isRegistered = !!email;

    if (!files.cv?.[0]) {
      return res.status(400).json({ message: 'CV is required' });
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (data: object) =>
      res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      const { result, analysisId } = await this.reviewCvUc.execute(
        {
          cvBuffer: files.cv[0].buffer,
          linkedinBuffer: files.linkedin?.[0]?.buffer,
          githubUsername,
          email,
          ip,
          isRegistered,
          locale,
        },
        (e) => {
          if (e.type === 'step') write({ step: e.step });
          else if (e.type === 'analysis_delta')
            write({ step: 'analysis_delta', delta: e.delta });
          else if (e.type === 'analysis_done')
            write({
              step: 'analysis_done',
              result: e.result,
              analysisId: e.analysisId,
            });
        },
      );

      write({ step: 'done', result, analysisId });
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

  @UseGuards(SupabaseGuard)
  @Post(':id/regenerate-deep')
  @ApiOperation({
    summary:
      'Regenerate the deep-pass content (fixes, project_recommendation, technical_analysis) for an analysis whose first deep pass failed.',
  })
  async regenerateDeep(
    @AuthEmail() email: string,
    @Param('id') rawId: string,
  ) {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    const deep = await this.regenerateDeepUc.execute(id, email);
    return { deep };
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
