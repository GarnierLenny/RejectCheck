import { Module } from '@nestjs/common';
import { ChallengeController } from './challenge.controller';
import { StripeModule } from '../stripe/stripe.module';

import {
  ATTEMPT_COACH,
  ATTEMPT_REPOSITORY,
  CHALLENGE_GENERATOR,
  CHALLENGE_REPOSITORY,
  STREAK_REPOSITORY,
} from './ports/tokens';

import { AnthropicChallengeGenerator } from './infrastructure/anthropic-challenge-generator.provider';
import { GeminiAttemptCoach } from './infrastructure/gemini-attempt-coach.provider';
import { PrismaChallengeRepository } from './infrastructure/prisma-challenge.repository';
import { PrismaAttemptRepository } from './infrastructure/prisma-attempt.repository';
import { PrismaStreakRepository } from './infrastructure/prisma-streak.repository';

import { GetTodayChallengeUseCase } from './application/get-today-challenge.use-case';
import { SubmitFirstAnswerUseCase } from './application/submit-first-answer.use-case';
import { SubmitFinalAnswerUseCase } from './application/submit-final-answer.use-case';
import { GetDayStatsUseCase } from './application/get-day-stats.use-case';
import { GetUserStreakUseCase } from './application/get-user-streak.use-case';
import { GetHistoryUseCase } from './application/get-history.use-case';

// Default bindings: Anthropic generates challenges, Gemini coaches answers.
// Swapping providers = changing one `useClass` line below.
@Module({
  imports: [StripeModule],
  controllers: [ChallengeController],
  providers: [
    { provide: CHALLENGE_GENERATOR, useClass: AnthropicChallengeGenerator },
    { provide: ATTEMPT_COACH, useClass: GeminiAttemptCoach },
    { provide: CHALLENGE_REPOSITORY, useClass: PrismaChallengeRepository },
    { provide: ATTEMPT_REPOSITORY, useClass: PrismaAttemptRepository },
    { provide: STREAK_REPOSITORY, useClass: PrismaStreakRepository },

    GetTodayChallengeUseCase,
    SubmitFirstAnswerUseCase,
    SubmitFinalAnswerUseCase,
    GetDayStatsUseCase,
    GetUserStreakUseCase,
    GetHistoryUseCase,
  ],
})
export class ChallengeModule {}
