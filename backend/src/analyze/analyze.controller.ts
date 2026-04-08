import { Controller, Post, UseInterceptors, UploadedFiles, Body, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';

@Controller('api/analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cv', maxCount: 1 },
    { name: 'linkedin', maxCount: 1 },
  ]))
  async analyze(
    @UploadedFiles() files: { cv?: Express.Multer.File[], linkedin?: Express.Multer.File[] },
    @Body('jobDescription') jobDescription: string,
    @Body('githubUsername') githubUsername?: string,
  ) {
    const cv = files.cv?.[0];
    const linkedin = files.linkedin?.[0];

    if (!cv || !jobDescription) {
      throw new BadRequestException('Missing CV or job description');
    }
    
    return this.analyzeService.analyzeApplication({
      cvBuffer: cv.buffer,
      jobDescription,
      linkedinBuffer: linkedin?.buffer,
      githubUsername,
    });
  }
}
