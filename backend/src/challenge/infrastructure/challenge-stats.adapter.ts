import { Inject, Injectable } from '@nestjs/common';
import { ATTEMPT_REPOSITORY, STREAK_REPOSITORY } from '../ports/tokens';
import type { AttemptRepository } from '../ports/attempt.repository';
import type { StreakRepository } from '../ports/streak.repository';
import {
  CHALLENGE_LANGUAGES,
  type ChallengeLanguage,
} from '../domain/focus-tags';
import type {
  ChallengeAttemptDigest,
  ChallengeLanguageStats,
  ChallengeStatsSummary,
} from '../../analyze/domain/challenge-stats.types';
import type { ChallengeStatsProvider } from '../../analyze/ports/challenge-stats.provider';
import type { AttemptHistoryItem } from '../domain/challenge.types';

const RECENT_ATTEMPTS_PER_LANG = 30;
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

@Injectable()
export class ChallengeStatsAdapter implements ChallengeStatsProvider {
  constructor(
    @Inject(ATTEMPT_REPOSITORY) private readonly attempts: AttemptRepository,
    @Inject(STREAK_REPOSITORY) private readonly streaks: StreakRepository,
  ) {}

  async getSummary(email: string): Promise<ChallengeStatsSummary> {
    const [streak, ...perLangResults] = await Promise.all([
      this.streaks.findByEmail(email),
      ...CHALLENGE_LANGUAGES.map(async (language) => {
        const [recent, total] = await Promise.all([
          this.attempts.listRecentByLanguage(
            email,
            language,
            RECENT_ATTEMPTS_PER_LANG,
          ),
          this.attempts.countByEmailAndLanguage(email, language),
        ]);
        return { language, recent, total };
      }),
    ]);

    const perLanguage: ChallengeLanguageStats[] = perLangResults
      .filter((r) => r.recent.length > 0)
      .map((r) => buildLanguageStats(r.language, r.recent, r.total));

    return {
      hasActivity: perLanguage.length > 0,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      perLanguage,
    };
  }
}

function buildLanguageStats(
  language: ChallengeLanguage,
  recent: AttemptHistoryItem[],
  attemptCount: number,
): ChallengeLanguageStats {
  const recentAttempts: ChallengeAttemptDigest[] = recent.map((a) => ({
    date: a.challenge.date.toISOString().slice(0, 10),
    score: a.score,
    focusTag: a.challenge.focusTag,
    difficulty: normalizeDifficulty(a.challenge.difficulty),
  }));
  const avgScore = Math.round(
    recentAttempts.reduce((acc, a) => acc + a.score, 0) / recentAttempts.length,
  );
  return {
    language,
    attemptCount,
    avgScore,
    lastCompletedAt: recentAttempts[0].date,
    recentAttempts,
  };
}

function normalizeDifficulty(value: string): Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value)
    ? (value as Difficulty)
    : 'easy';
}
