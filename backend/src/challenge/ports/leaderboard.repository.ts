import type {
  ChallengeLeaderboardInput,
  GlobalLeaderboardInput,
  LeaderboardEntry,
  StreakLeaderboardInput,
} from '../domain/leaderboard.types';

export interface LeaderboardRepository {
  perChallenge(input: ChallengeLeaderboardInput): Promise<LeaderboardEntry[]>;
  global(input: GlobalLeaderboardInput): Promise<LeaderboardEntry[]>;
  streaks(input: StreakLeaderboardInput): Promise<LeaderboardEntry[]>;
}
