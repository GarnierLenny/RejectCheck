import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import {
  StartInterviewSchema,
  AnswerSchema,
  CompleteSchema,
} from './dto/interview.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';

@ApiTags('Interview')
@UseGuards(SupabaseGuard)
@Controller('api/interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new AI interview session (premium)' })
  async start(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = StartInterviewSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException(parsed.error.issues[0].message);
    return this.interviewService.start(parsed.data.analysisId, email);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit an audio answer and get the next question' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('audio', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async answer(
    @AuthEmail() email: string,
    @UploadedFile() audio: Express.Multer.File,
    @Body() body: unknown,
  ) {
    if (!audio?.buffer) throw new BadRequestException('Audio file is required');
    const parsed = AnswerSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException(parsed.error.issues[0].message);
    return this.interviewService.answer(
      parsed.data.interviewId,
      email,
      audio.buffer,
      parsed.data.questionIndex,
    );
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete the interview and generate analysis' })
  async complete(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = CompleteSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException(parsed.error.issues[0].message);
    return this.interviewService.complete(parsed.data.interviewId, email);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get past interview attempts for the authenticated user',
  })
  async history(
    @AuthEmail() email: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.interviewService.history(email, +page, +limit);
  }
}
