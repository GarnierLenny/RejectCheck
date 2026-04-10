import { Controller, Post, Get, UseInterceptors, UploadedFiles, Body, Res, Headers } from '@nestjs/common';
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
  ) {
    const parsed = AnalyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const { jobDescription, githubUsername } = parsed.data;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
      await this.analyzeService.checkGlobalLimit();

      const result = await this.analyzeService.analyzeApplication(
        {
          cvBuffer: files.cv?.[0]?.buffer,
          jobDescription,
          linkedinBuffer: files.linkedin?.[0]?.buffer,
          githubUsername,
        },
        (step) => write({ step }),
      );

      write({ step: 'done', result });

      // Fire-and-forget: a DB failure should not affect the client response
      this.analyzeService.incrementCounter().catch((err) =>
        console.error('[AnalyzeController] Counter increment failed:', err),
      );
    } catch (err: any) {
      write({ step: 'error', message: err.message || 'Analysis failed', code: err.response?.code });
    } finally {
      res.end();
    }
  }

  @Get('counter')
  @ApiOperation({ summary: 'Get current analysis counter (admin)' })
  async getCounter(@Headers('x-admin-key') adminKey: string, @Res() res: any) {
    if (adminKey !== this.configService.get('ADMIN_SECRET_KEY')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const data = await this.analyzeService.getCounter();
    return res.status(200).json(data);
  }

  @Post('reset-counter')
  @ApiOperation({ summary: 'Reset analysis counter to 0 (admin)' })
  async resetCounter(@Headers('x-admin-key') adminKey: string, @Res() res: any) {
    if (adminKey !== this.configService.get('ADMIN_SECRET_KEY')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    await this.analyzeService.resetCounter();
    return res.status(200).json({ message: 'Counter reset', total: 0 });
  }
}
