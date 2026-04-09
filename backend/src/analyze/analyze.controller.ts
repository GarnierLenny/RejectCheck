import { Controller, Post, UseInterceptors, UploadedFiles, Body, UsePipes } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe, ZodResponse } from 'nestjs-zod';
import { AnalyzeService } from './analyze.service';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { AnalyzeResponseDto } from './dto/analyze-response.dto';

@ApiTags('Analyze')
@Controller('api/analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @ApiOperation({ summary: 'Analyze a CV against a job description' })
  @ApiConsumes('multipart/form-data')
  @ZodResponse({ status: 201, type: AnalyzeResponseDto })
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
