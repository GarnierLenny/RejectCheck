import { Inject, Injectable } from '@nestjs/common';
import { LEADERBOARD_REPOSITORY } from '../ports/tokens';
import type { LeaderboardRepository } from '../ports/leaderboard.repository';
import type {
  LeaderboardEntry,
  LeaderboardScope,
} from '../domain/leaderboard.types';

@Injectable()
export class GetChallengeLeaderboardUseCase {
  constructor(
    @Inject(LEADERBOARD_REPOSITORY)
    private readonly repo: LeaderboardRepository,
  ) {}

  execute(
    challengeId: number,
    scope: LeaderboardScope,
    limit: number,
    viewerEmail?: string,
  ): Promise<LeaderboardEntry[]> {
    return this.repo.perChallenge({ challengeId, scope, limit, viewerEmail });
  }
}
