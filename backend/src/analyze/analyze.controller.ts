import { Controller, Post, Get, UseInterceptors, UploadedFiles, Body, Res, Req, Query, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AnalyzeService } from './analyze.service';
import { AnalyzeRequestSchema } from './dto/analyze-request.dto';

@ApiTags('Analyze')
@Controller('api/analyze')
export class AnalyzeController {
  constructor(
    private readonly analyzeService: AnalyzeService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Analyze a CV against a job description' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cv', maxCount: 1 },
    { name: 'linkedin', maxCount: 1 },
  ]))
  async analyze(
    @UploadedFiles() files: { cv?: Express.Multer.File[], linkedin?: Express.Multer.File[] },
    @Body() body: unknown,
    @Res() res: any,
    @Req() req: Request,
  ) {
    const parsed = AnalyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const { jobDescription, githubUsername, email, isRegistered } = parsed.data;

    // Capture IP: primary from x-forwarded-for, fallback to req.ip
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;

    const write = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      // 1. Check Usage Limit
      const limit = await this.analyzeService.checkUsageLimit(email, ip);
      if (!limit.allowed) {
        // Return 402 Payment Required for limit reached
        return res.status(402).json({ 
          message: 'Analysis limit reached. Upgrade to continue.', 
          code: 'LIMIT_REACHED' 
        });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const result = await this.analyzeService.analyzeApplication(
        {
          cvBuffer: files.cv?.[0]?.buffer,
          jobDescription,
          linkedinBuffer: files.linkedin?.[0]?.buffer,
          githubUsername,
        },
        (step) => write({ step }),
      );

      // 2. Save Analysis (with GDPR rules handled in service)
      await this.analyzeService.saveAnalysis({
        email,
        ip,
        jobDescription,
        result,
        isRegistered: !!isRegistered,
      });

      write({ step: 'done', result });
    } catch (err: any) {
      if (res.writableEnded) return;
      if (!res.headersSent) {
        return res.status(err.status || 500).json({ message: err.message });
      }
      write({ step: 'error', message: err.message || 'Analysis failed', code: err.response?.code });
    } finally {
      res.end();
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Get analysis history for a user' })
  async getHistory(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.analyzeService.getHistory(email);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Query('email') email: string) {
    console.log("[AnalyzeController] GET /profile for", email);
    if (!email) throw new BadRequestException('Email is required');
    return this.analyzeService.getProfile(email);
  }

  @Post('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Body() body: { email: string; username?: string; avatarUrl?: string }) {
    console.log("[AnalyzeController] POST /profile for", body.email);
    if (!body.email) throw new BadRequestException('Email is required');
    return this.analyzeService.updateProfile(body.email, {
      username: body.username,
      avatarUrl: body.avatarUrl,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific analysis by ID' })
  async getAnalysis(@Req() req: Request, @Query('email') email: any, @Res() res: any) {
    const { id: rawId } = req.params;
    const id = parseInt(rawId as string);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');
    const emailStr = String(email || '');
    if (!emailStr) throw new BadRequestException('Email is required');
    
    console.log("[AnalyzeController] GET /:id", id, "for", emailStr);
    const analysis = await this.analyzeService.getAnalysisById(id, emailStr);
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });
    
    return res.json(analysis);
  }
}
