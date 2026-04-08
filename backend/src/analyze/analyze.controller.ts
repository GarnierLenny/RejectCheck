import { Controller, Post, UseInterceptors, UploadedFiles, Body, UsePipes } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AnalyzeService } from './analyze.service';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';

@Controller('api/analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @UsePipes(ZodValidationPipe)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cv', maxCount: 1 },
    { name: 'linkedin', maxCount: 1 },
  ]))
  async analyze(
    @UploadedFiles() files: { cv?: Express.Multer.File[], linkedin?: Express.Multer.File[] },
    @Body() body: AnalyzeRequestDto,
  ) {
    const { jobDescription, githubUsername } = body;
    const cv = files.cv?.[0];
    const linkedin = files.linkedin?.[0];

    return this.analyzeService.analyzeApplication({
      cvBuffer: cv?.buffer,
      jobDescription,
      linkedinBuffer: linkedin?.buffer,
      githubUsername,
    });
  }
}
