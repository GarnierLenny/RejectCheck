import { Module } from '@nestjs/common';
import { ChallengeController } from './challenge.controller';
import { StripeModule } from '../stripe/stripe.module';
import { SocialModule } from '../social/social.module';
import { XpModule } from '../xp/xp.module';

import {
  ATTEMPT_COACH,
  ATTEMPT_REPOSITORY,
  CHALLENGE_GENERATOR,
  CHALLENGE_REPOSITORY,
  LEADERBOARD_REPOSITORY,
  STREAK_REPOSITORY,
} from './ports/tokens';

import { AnthropicChallengeGenerator } from './infrastructure/anthropic-challenge-generator.provider';
import { GeminiAttemptCoach } from './infrastructure/gemini-attempt-coach.provider';
import { PrismaChallengeRepository } from './infrastructure/prisma-challenge.repository';
import { PrismaAttemptRepository } from './infrastructure/prisma-attempt.repository';
import { PrismaStreakRepository } from './infrastructure/prisma-streak.repository';
import { PrismaLeaderboardRepository } from './infrastructure/prisma-leaderboard.repository';

import { GetTodayChallengeUseCase } from './application/get-today-challenge.use-case';
import { SubmitFirstAnswerUseCase } from './application/submit-first-answer.use-case';
import { SubmitFinalAnswerUseCase } from './application/submit-final-answer.use-case';
import { GetDayStatsUseCase } from './application/get-day-stats.use-case';
import { GetUserStreakUseCase } from './application/get-user-streak.use-case';
import { GetHistoryUseCase } from './application/get-history.use-case';
import { GetActivityUseCase } from './application/get-activity.use-case';
import { GetChallengeLeaderboardUseCase } from './application/get-challenge-leaderboard.use-case';
import { GetGlobalLeaderboardUseCase } from './application/get-global-leaderboard.use-case';
import { GetStreakLeaderboardUseCase } from './application/get-streak-leaderboard.use-case';

@Module({
  imports: [StripeModule, SocialModule, XpModule],
  controllers: [ChallengeController],
  providers: [
    { provide: CHALLENGE_GENERATOR, useClass: AnthropicChallengeGenerator },
    { provide: ATTEMPT_COACH, useClass: GeminiAttemptCoach },
    { provide: CHALLENGE_REPOSITORY, useClass: PrismaChallengeRepository },
    { provide: ATTEMPT_REPOSITORY, useClass: PrismaAttemptRepository },
    { provide: STREAK_REPOSITORY, useClass: PrismaStreakRepository },
    { provide: LEADERBOARD_REPOSITORY, useClass: PrismaLeaderboardRepository },

    GetTodayChallengeUseCase,
    SubmitFirstAnswerUseCase,
    SubmitFinalAnswerUseCase,
    GetDayStatsUseCase,
    GetUserStreakUseCase,
    GetHistoryUseCase,
    GetActivityUseCase,
    GetChallengeLeaderboardUseCase,
    GetGlobalLeaderboardUseCase,
    GetStreakLeaderboardUseCase,
  ],
})
export class ChallengeModule {}
