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

export type EarnedAchievement = {
  /** e.g. "perfect_score" or "focus_master:react_rerenders" (tag-suffixed for parametric achievements). */
  slug: string;
  /** null when the exact date can't be derived from existing data (e.g. streak achievements). */
  earnedAt: Date | null;
};

export type AchievementsProgress = {
  totalCount: number;
  perfectCount: number;
  longestStreak: number;
  languagesCount: number;
  followersCount: number;
  /** Per-tag count of attempts with score >= 90 — used for `focus_master` progress. */
  focusMasterCounts: Record<string, number>;
};

export type AchievementsBundle = {
  earned: EarnedAchievement[];
  progress: AchievementsProgress;
};

export type PublicProfileXp = {
  totalXp: number;
  level: number;
  tier: string;       // TierKey from xp/domain/tier-config (kept loose to avoid cross-module type)
  tierLabel: string;  // "Mid II", etc.
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
  achievements: AchievementsBundle;
  xp: PublicProfileXp;
};

export type PublicActivityEntry = {
  date: string;
  score: number;
};

export type PublicAttemptView = {
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
    date: Date;
  };
  score: number;
  completedAt: Date;
};

export type ClaimUsernameInput = {
  username: string;
};

export type UpdatePublicSettingsInput = {
  isPublic?: boolean;
  bio?: string | null;
};
