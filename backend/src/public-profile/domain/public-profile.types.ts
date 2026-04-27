export type PublicProfileChallengeStats = {
  total: number;
  avgScore: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: Date | null;
};

export type PublicRecentChallenge = {
  challengeId: number;
  title: string;
  focusTag: string;
  difficulty: string;
  language: string;
  score: number;
  completedAt: Date;
};

export type PublicProfileView = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  githubUsername: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  socialLinks: string[];
  joinedAt: Date;
  followersCount: number;
  followingCount: number;
  /** Computed only when a viewer email is provided (and viewer != owner). */
  isFollowing?: boolean;
  challenges: PublicProfileChallengeStats;
  recentChallenges: PublicRecentChallenge[];
};

export type PublicActivityEntry = {
  date: string;
  score: number;
};

export type ClaimUsernameInput = {
  username: string;
};

export type UpdatePublicSettingsInput = {
  isPublic?: boolean;
  bio?: string | null;
};
