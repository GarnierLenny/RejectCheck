import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AnalyzeResponseDto } from './dto/analyze-response.dto';
import { CoverLetterSchema } from './dto/cover-letter.dto';
import { ProfileUpdateSchema } from './dto/profile-update.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { RequiresPremium } from '../stripe/decorators/requires-premium.decorator';
import { validateJobDescription } from './analyze.utils';

import { AnalyzeCvUseCase } from './application/analyze-cv.use-case';
import { RewriteCvUseCase } from './application/rewrite-cv.use-case';
import { GenerateCoverLetterUseCase } from './application/generate-cover-letter.use-case';
import { ListHistoryUseCase } from './application/list-history.use-case';
import { GetAnalysisUseCase } from './application/get-analysis.use-case';
import { DeleteAnalysisUseCase } from './application/delete-analysis.use-case';
import {
  GetProfileUseCase,
  UpdateProfileUseCase,
} from './application/profile.use-cases';
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

@ApiTags('Analyze')
@Controller('api/analyze')
export class AnalyzeController {
  constructor(
    private readonly analyzeCv: AnalyzeCvUseCase,
    private readonly rewriteCvUc: RewriteCvUseCase,
    private readonly generateCoverLetter: GenerateCoverLetterUseCase,
    private readonly listHistory: ListHistoryUseCase,
    private readonly getAnalysisUc: GetAnalysisUseCase,
    private readonly deleteAnalysisUc: DeleteAnalysisUseCase,
    private readonly getProfileUc: GetProfileUseCase,
    private readonly updateProfileUc: UpdateProfileUseCase,
    private readonly listSavedCvsUc: ListSavedCvsUseCase,
    private readonly addSavedCvUc: AddSavedCvUseCase,
    private readonly removeSavedCvUc: RemoveSavedCvUseCase,
  ) {}

  /** Public endpoint — works for anonymous users (IP-based quota) and registered users. */
  @Post()
  @ApiOperation({ summary: 'Analyze a CV against a job description' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AnalyzeRequestDto })
  @ApiOkResponse({ type: AnalyzeResponseDto })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cv', maxCount: 1 },
      { name: 'linkedin', maxCount: 1 },
      { name: 'motivationLetter', maxCount: 1 },
    ]),
  )
  async analyze(
    @UploadedFiles()
    files: {
      cv?: Express.Multer.File[];
      linkedin?: Express.Multer.File[];
      motivationLetter?: Express.Multer.File[];
    },
    @Body() body: unknown,
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
      email,
      isRegistered,
      locale,
    } = parsed.data;

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
          isRegistered: !!isRegistered,
          locale,
        },
        (step) => write({ step }),
      );

      write({ step: 'done', result, analysisId });
    } catch (err: any) {
      if (res.writableEnded) return;
      write({
        step: 'error',
        message: err?.message || 'Analysis failed',
        code: err?.code || err?.response?.code,
      });
    } finally {
      if (!res.writableEnded) res.end();
    }
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
  async getProfile(@AuthEmail() email: string) {
    return this.getProfileUc.execute(email);
  }

  @UseGuards(SupabaseGuard)
  @Post('profile')
  @ApiOperation({ summary: 'Update profile of the authenticated user' })
  async updateProfile(@AuthEmail() email: string, @Body() body: unknown) {
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
    return this.updateProfileUc.execute(email, parsed.data);
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

  @RequiresPremium()
  @Post('rewrite')
  @ApiOperation({
    summary: 'Rewrite a CV based on a previous analysis (premium)',
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
}
