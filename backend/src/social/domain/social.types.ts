export type FollowSummary = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  currentStreak: number;
  followedAt: Date;
  /** Computed only when a viewer email is provided. */
  isFollowing?: boolean;
};

export type FollowList = {
  entries: FollowSummary[];
  nextCursor: number | null;
};

export type ListPaginationInput = {
  cursor?: number;
  limit: number;
};

export type FeedEntry = {
  /** ChallengeAttempt.id, used as cursor for pagination. */
  id: number;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  challenge: {
    id: number;
    title: string;
    focusTag: string;
    difficulty: string;
    language: string;
  };
  score: number;
  completedAt: Date;
};

export type Feed = {
  entries: FeedEntry[];
  nextCursor: number | null;
};

export type BlockSummary = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  blockedAt: Date;
};

export type BlockList = {
  entries: BlockSummary[];
  nextCursor: number | null;
};
