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
