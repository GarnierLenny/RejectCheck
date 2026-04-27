import { Inject, Injectable } from '@nestjs/common';
import { LEADERBOARD_REPOSITORY } from '../ports/tokens';
import type { LeaderboardRepository } from '../ports/leaderboard.repository';
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardScope,
} from '../domain/leaderboard.types';

@Injectable()
export class GetGlobalLeaderboardUseCase {
  constructor(
    @Inject(LEADERBOARD_REPOSITORY)
    private readonly repo: LeaderboardRepository,
  ) {}

  execute(
    scope: LeaderboardScope,
    period: LeaderboardPeriod,
    limit: number,
    viewerEmail?: string,
  ): Promise<LeaderboardEntry[]> {
    return this.repo.global({ scope, period, limit, viewerEmail });
  }
}
