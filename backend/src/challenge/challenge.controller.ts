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
import { ChallengeService } from './challenge.service';
import { SubmitFinalSchema, SubmitFirstSchema } from './dto/challenge.dto';
import { DEFAULT_LANGUAGE, isChallengeLanguage } from './focus-tags';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';

@ApiTags('Challenge')
@Controller('api/challenge')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('today')
  @ApiOperation({ summary: "Get today's challenge (public, issues are omitted)" })
  async today(@Query('language') language?: string) {
    const lang =
      language && isChallengeLanguage(language) ? language : DEFAULT_LANGUAGE;
    return this.challengeService.getTodayChallenge(lang);
  }

  @Get('stats/:id')
  @ApiOperation({ summary: 'Get aggregate stats for a given challenge' })
  async stats(@Param('id', ParseIntPipe) id: number) {
    return this.challengeService.getDayStats(id);
  }

  @UseGuards(SupabaseGuard)
  @Post('submit/first')
  @ApiOperation({ summary: 'Submit the first answer and get the Socratic follow-up' })
  async submitFirst(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = SubmitFirstSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.challengeService.submitFirstAnswer(
      email,
      parsed.data.challengeId,
      parsed.data.firstAnswer,
    );
  }

  @UseGuards(SupabaseGuard)
  @Post('submit/final')
  @ApiOperation({ summary: 'Submit the final answer and get the score' })
  async submitFinal(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = SubmitFinalSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.challengeService.submitFinalAnswer(
      email,
      parsed.data.challengeId,
      parsed.data.secondAnswer,
    );
  }

  @UseGuards(SupabaseGuard)
  @Get('streak')
  @ApiOperation({ summary: 'Get the current streak for the authenticated user' })
  async streak(@AuthEmail() email: string) {
    return this.challengeService.getUserStreak(email);
  }

  @UseGuards(SupabaseGuard)
  @Get('history')
  @ApiOperation({ summary: 'Get past challenge attempts (SHORTLISTED+)' })
  async history(@AuthEmail() email: string) {
    return this.challengeService.getHistory(email);
  }
}
