import { Inject, Injectable } from '@nestjs/common';
import { STREAK_REPOSITORY } from '../ports/tokens';
import type { StreakRepository } from '../ports/streak.repository';
import type { StreakSummary } from '../domain/challenge.types';

@Injectable()
export class GetUserStreakUseCase {
  constructor(
    @Inject(STREAK_REPOSITORY) private readonly streaks: StreakRepository,
  ) {}

  async execute(email: string): Promise<StreakSummary> {
    const state = await this.streaks.findByEmail(email);
    if (!state) {
      return { currentStreak: 0, longestStreak: 0, lastCompletedAt: null };
    }
    return {
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastCompletedAt: state.lastCompletedAt,
    };
  }
}
