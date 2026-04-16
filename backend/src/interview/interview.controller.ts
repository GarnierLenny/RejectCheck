import { Controller, Post, Get, Body, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import { StartInterviewSchema, AnswerSchema, CompleteSchema } from './dto/interview.dto';

@ApiTags('Interview')
@Controller('api/interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new AI interview session' })
  async start(@Body() body: unknown) {
    const parsed = StartInterviewSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message);
    return this.interviewService.start(parsed.data.analysisId, parsed.data.email);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit an audio answer and get the next question' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audio'))
  async answer(
    @UploadedFile() audio: Express.Multer.File,
    @Body() body: unknown,
  ) {
    if (!audio?.buffer) throw new BadRequestException('Audio file is required');
    const parsed = AnswerSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message);
    return this.interviewService.answer(
      parsed.data.interviewId,
      parsed.data.email,
      audio.buffer,
      parsed.data.questionIndex,
    );
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete the interview and generate analysis' })
  async complete(@Body() body: unknown) {
    const parsed = CompleteSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message);
    return this.interviewService.complete(parsed.data.interviewId, parsed.data.email);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get past interview attempts for a user' })
  async history(@Query('email') email: string) {
    if (!email) throw new BadRequestException('email query param is required');
    return this.interviewService.history(email);
  }
}
