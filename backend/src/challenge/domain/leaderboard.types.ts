export type LeaderboardEntry = {
  rank: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  /** For per-challenge leaderboards: when the user finished. */
  completedAt?: Date;
};

export type LeaderboardScope = 'global' | 'following';
export type LeaderboardPeriod = 'alltime' | 'week';

export type ChallengeLeaderboardInput = {
  challengeId: number;
  scope: LeaderboardScope;
  limit: number;
  viewerEmail?: string;
};

export type GlobalLeaderboardInput = {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  limit: number;
  viewerEmail?: string;
};

export type StreakLeaderboardInput = {
  scope: LeaderboardScope;
  limit: number;
  viewerEmail?: string;
};
