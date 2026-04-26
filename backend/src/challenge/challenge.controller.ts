import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubmitFinalSchema, SubmitFirstSchema } from './dto/challenge.dto';
import { DEFAULT_LANGUAGE, isChallengeLanguage } from './domain/focus-tags';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { RequiresPremium } from '../stripe/decorators/requires-premium.decorator';

import { GetTodayChallengeUseCase } from './application/get-today-challenge.use-case';
import { SubmitFirstAnswerUseCase } from './application/submit-first-answer.use-case';
import { SubmitFinalAnswerUseCase } from './application/submit-final-answer.use-case';
import { GetDayStatsUseCase } from './application/get-day-stats.use-case';
import { GetUserStreakUseCase } from './application/get-user-streak.use-case';
import { GetHistoryUseCase } from './application/get-history.use-case';
import { GetActivityUseCase } from './application/get-activity.use-case';

@ApiTags('Challenge')
@Controller('api/challenge')
export class ChallengeController {
  constructor(
    private readonly getToday: GetTodayChallengeUseCase,
    private readonly submitFirst: SubmitFirstAnswerUseCase,
    private readonly submitFinal: SubmitFinalAnswerUseCase,
    private readonly getDayStats: GetDayStatsUseCase,
    private readonly getStreak: GetUserStreakUseCase,
    private readonly getHistoryUc: GetHistoryUseCase,
    private readonly getActivityUc: GetActivityUseCase,
  ) {}

  @Get('today')
  @ApiOperation({
    summary: "Get today's challenge (public, issues are omitted)",
  })
  today(@Query('language') language?: string) {
    const lang =
      language && isChallengeLanguage(language) ? language : DEFAULT_LANGUAGE;
    return this.getToday.execute(lang);
  }

  @Get('stats/:id')
  @ApiOperation({ summary: 'Get aggregate stats for a given challenge' })
  stats(@Param('id', ParseIntPipe) id: number) {
    return this.getDayStats.execute(id);
  }

  @UseGuards(SupabaseGuard)
  @Post('submit/first')
  @ApiOperation({
    summary: 'Submit the first answer and get the Socratic follow-up',
  })
  submitFirstAnswer(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = SubmitFirstSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.submitFirst.execute(
      email,
      parsed.data.challengeId,
      parsed.data.firstAnswer,
    );
  }

  @UseGuards(SupabaseGuard)
  @Post('submit/final')
  @ApiOperation({ summary: 'Submit the final answer and get the score' })
  submitFinalAnswer(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = SubmitFinalSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.submitFinal.execute(
      email,
      parsed.data.challengeId,
      parsed.data.secondAnswer,
    );
  }

  @UseGuards(SupabaseGuard)
  @Get('streak')
  @ApiOperation({
    summary: 'Get the current streak for the authenticated user',
  })
  streak(@AuthEmail() email: string) {
    return this.getStreak.execute(email);
  }

  @RequiresPremium('shortlisted')
  @Get('history')
  @ApiOperation({ summary: 'Get past challenge attempts (SHORTLISTED+)' })
  history(@AuthEmail() email: string) {
    return this.getHistoryUc.execute(email);
  }

  @UseGuards(SupabaseGuard)
  @Get('activity')
  @ApiOperation({
    summary: 'Get the last year of completed-challenge dates + scores',
  })
  activity(@AuthEmail() email: string) {
    return this.getActivityUc.execute(email);
  }
}
