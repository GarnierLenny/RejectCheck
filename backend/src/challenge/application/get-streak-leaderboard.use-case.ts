import { Inject, Injectable } from '@nestjs/common';
import { LEADERBOARD_REPOSITORY } from '../ports/tokens';
import type { LeaderboardRepository } from '../ports/leaderboard.repository';
import type {
  LeaderboardEntry,
  LeaderboardScope,
} from '../domain/leaderboard.types';

@Injectable()
export class GetStreakLeaderboardUseCase {
  constructor(
    @Inject(LEADERBOARD_REPOSITORY)
    private readonly repo: LeaderboardRepository,
  ) {}

  execute(
    scope: LeaderboardScope,
    limit: number,
    viewerEmail?: string,
  ): Promise<LeaderboardEntry[]> {
    return this.repo.streaks({ scope, limit, viewerEmail });
  }
}
