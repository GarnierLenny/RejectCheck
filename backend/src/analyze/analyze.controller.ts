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
    const { jobDescription, githubUsername, email } = parsed.data;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
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
    } catch (err: any) {
      write({ step: 'error', message: err.message || 'Analysis failed', code: err.response?.code });
    } finally {
      res.end();
    }
  }
}
