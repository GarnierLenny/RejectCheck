import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';

@Controller('api/analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cv'))
  async analyze(
    @UploadedFile() cv: Express.Multer.File,
    @Body('jobDescription') jobDescription: string,
  ) {
    if (!cv || !jobDescription) {
      throw new BadRequestException('Missing CV or job description');
    }
    
    return this.analyzeService.analyzeCv(cv.buffer, jobDescription);
  }
}
