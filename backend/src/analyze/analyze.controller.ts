import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  Body,
  Res,
  Req,
  BadRequestException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AnalyzeService } from './analyze.service';
import {
  AnalyzeRequestSchema,
  AnalyzeRequestDto,
} from './dto/analyze-request.dto';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';
import { CoverLetterSchema } from './dto/cover-letter.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { validateJobDescription } from './analyze.utils';

@ApiTags('Analyze')
@Controller('api/analyze')
export class AnalyzeController {
  constructor(
    private readonly analyzeService: AnalyzeService,
    private readonly configService: ConfigService,
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
    @Res() res: any,
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

    // Capture IP: primary from x-forwarded-for, fallback to req.ip
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

    const write = (data: object) =>
      res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      // 1. Check Usage Limit
      const limit = await this.analyzeService.checkUsageLimit(email, ip);
      if (!limit.allowed) {
        return res.status(402).json({
          message: 'Analysis limit reached. Upgrade to continue.',
          code: 'LIMIT_REACHED',
        });
      }

      // 2. Validate job description content
      const jdValidation = validateJobDescription(jobDescription);
      if (!jdValidation.valid) {
        return res.status(422).json({ message: jdValidation.reason });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const {
        result,
        cvText: parsedCv,
        motivationLetterText: parsedMl,
      } = await this.analyzeService.analyzeApplication(
        {
          cvBuffer: files.cv?.[0]?.buffer,
          jobDescription,
          linkedinBuffer: files.linkedin?.[0]?.buffer,
          motivationLetterBuffer: files.motivationLetter?.[0]?.buffer,
          motivationLetterText,
          githubUsername,
          locale,
        },
        (step) => write({ step }),
      );

      // 2. Save Analysis (with GDPR rules handled in service)
      const { id: analysisId } = await this.analyzeService.saveAnalysis({
        email,
        ip,
        jobDescription,
        jobLabel,
        cvText: parsedCv,
        motivationLetter: parsedMl,
        result,
        isRegistered: !!isRegistered,
      });

      write({ step: 'done', result, analysisId });
    } catch (err: any) {
      if (res.writableEnded) return;
      if (!res.headersSent) {
        return res.status(err.status || 500).json({ message: err.message });
      }
      write({
        step: 'error',
        message: err.message || 'Analysis failed',
        code: err.response?.code,
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
    return this.analyzeService.getHistory(email, +page, +limit);
  }

  @UseGuards(SupabaseGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get profile of the authenticated user' })
  async getProfile(@AuthEmail() email: string) {
    return this.analyzeService.getProfile(email);
  }

  @UseGuards(SupabaseGuard)
  @Post('profile')
  @ApiOperation({ summary: 'Update profile of the authenticated user' })
  async updateProfile(
    @AuthEmail() email: string,
    @Body() body: { username?: string; avatarUrl?: string; displayName?: string; githubUsername?: string; linkedinUrl?: string },
  ) {
    return this.analyzeService.updateProfile(email, body);
  }

  @UseGuards(SupabaseGuard)
  @Get('saved-cvs')
  async listSavedCvs(@AuthEmail() email: string) {
    const isPremium = await this.analyzeService.checkPremium(email);
    if (!isPremium) throw new ForbiddenException('Premium subscription required');
    return this.analyzeService.listSavedCvs(email);
  }

  @UseGuards(SupabaseGuard)
  @Post('saved-cvs')
  async addSavedCv(@AuthEmail() email: string, @Body() body: { name: string; url: string }) {
    const isPremium = await this.analyzeService.checkPremium(email);
    if (!isPremium) throw new ForbiddenException('Premium subscription required');
    return this.analyzeService.addSavedCv(email, body.name, body.url);
  }

  @UseGuards(SupabaseGuard)
  @Delete('saved-cvs/:id')
  async removeSavedCv(@AuthEmail() email: string, @Param('id') id: string) {
    const isPremium = await this.analyzeService.checkPremium(email);
    if (!isPremium) throw new ForbiddenException('Premium subscription required');
    return this.analyzeService.removeSavedCv(email, parseInt(id));
  }

  @UseGuards(SupabaseGuard)
  @Post('rewrite')
  @ApiOperation({
    summary: 'Rewrite a CV based on a previous analysis (premium)',
  })
  async rewrite(
    @AuthEmail() email: string,
    @Body() body: { analysisId: number; locale?: string },
    @Res() res: any,
  ) {
    const { analysisId, locale = 'en' } = body;
    if (!analysisId) {
      return res.status(400).json({ message: 'analysisId is required' });
    }

    const isPremium = await this.analyzeService.checkPremium(email);
    if (!isPremium) {
      return res.status(402).json({
        message: 'Premium subscription required',
        code: 'PREMIUM_REQUIRED',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (data: object) =>
      res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      write({ step: 'rewriting' });
      const rewriteResult = await this.analyzeService.rewriteCv(
        analysisId,
        email,
        locale,
      );
      await this.analyzeService.saveRewrite(analysisId, email, rewriteResult);
      write({ step: 'done', reconstructed_cv: rewriteResult.reconstructed_cv });
    } catch (err: any) {
      if (!res.writableEnded) {
        write({ step: 'error', message: err.message || 'Rewrite failed' });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  @UseGuards(SupabaseGuard)
  @Post('cover-letter')
  @ApiOperation({ summary: 'Generate a cover letter from an existing analysis' })
  async coverLetter(
    @AuthEmail() email: string,
    @Body() body: unknown,
    @Res() res: any,
  ) {
    const parsed = CoverLetterSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const isHired = await this.analyzeService.checkHiredPlan(email);
    if (!isHired) {
      return res.status(402).json({ message: 'HIRED plan required' });
    }

    try {
      const result = await this.analyzeService.generateCoverLetter(
        email,
        parsed.data.analysisId,
        parsed.data.language,
      );
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(e.status ?? 500).json({ message: e.message });
    }
  }

  @UseGuards(SupabaseGuard)
  @Get(':id')
  @ApiOperation({
    summary:
      'Get a specific analysis by ID (must belong to the authenticated user)',
  })
  @ApiOkResponse({ type: AnalyzeResponseDto })
  async getAnalysis(
    @AuthEmail() email: string,
    @Req() req: Request,
    @Res() res: any,
  ) {
    const { id: rawId } = req.params;
    const id = parseInt(rawId as string);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');

    const analysis = await this.analyzeService.getAnalysisById(id, email);
    if (!analysis)
      return res.status(404).json({ message: 'Analysis not found' });

    return res.json(analysis);
  }

  @UseGuards(SupabaseGuard)
  @Post(':id/delete')
  @ApiOperation({
    summary: 'Delete an analysis (must belong to the authenticated user)',
  })
  async deleteAnalysis(@AuthEmail() email: string, @Req() req: Request) {
    const { id: rawId } = req.params;
    const id = parseInt(rawId as string);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');

    return this.analyzeService.deleteAnalysis(id, email);
  }
}
