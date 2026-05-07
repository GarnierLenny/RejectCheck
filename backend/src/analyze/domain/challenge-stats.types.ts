/**
 * Snapshot of a user's daily code-review challenge track record, fed to Claude
 * during a profile-vs-JD analysis as a concrete seniority signal.
 *
 * Owned by the analyze module (it's the consumer); the challenge module
 * supplies it through an adapter bound to CHALLENGE_STATS_PROVIDER.
 */

export type ChallengeStatsLanguage = 'typescript' | 'python' | 'java';

export type ChallengeAttemptDigest = {
  date: string; // YYYY-MM-DD (UTC)
  score: number; // 0-100
  focusTag: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type ChallengeLanguageStats = {
  language: ChallengeStatsLanguage;
  attemptCount: number;
  avgScore: number; // mean of recentAttempts.score, rounded
  lastCompletedAt: string; // YYYY-MM-DD
  recentAttempts: ChallengeAttemptDigest[]; // ≤30, most recent first
};

export type ChallengeStatsSummary = {
  hasActivity: boolean;
  currentStreak: number;
  longestStreak: number;
  perLanguage: ChallengeLanguageStats[]; // only languages with ≥1 attempt
};
