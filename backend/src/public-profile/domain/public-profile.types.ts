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
