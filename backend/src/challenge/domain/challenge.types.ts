import type { ChallengeIssue, Difficulty } from '../dto/challenge.dto';
import type { ChallengeLanguage, FocusTag } from './focus-tags';

/**
 * Full challenge view used by submit/score flows (issues are the ground truth).
 * The public-facing `today` endpoint must strip `issues` before responding.
 */
export type DailyChallenge = {
  id: number;
  date: Date;
  language: ChallengeLanguage;
  title: string;
  focusTag: FocusTag;
  difficulty: Difficulty;
  snippet: string;
  question: string;
  issues: ChallengeIssue[];
  whatToLookFor: string[];
  hints: string[];
  estimatedTime: number;
};

export type PublicDailyChallenge = Omit<DailyChallenge, 'issues'>;

export type AttemptScoreBreakdown = {
  issues_found: number;
  explanation_quality: number;
  prioritization: number;
  bonus: number;
  feedback: string;
  missed_issues: string[];
};

export type ChallengeAttempt = {
  id: number;
  email: string;
  challengeId: number;
  firstAnswer: string;
  aiChallenge: string | null;
  secondAnswer: string | null;
  score: number;
  scoreBreakdown: Record<string, unknown>;
  completedAt: Date;
};

export type AttemptHistoryItem = ChallengeAttempt & {
  challenge: {
    id: number;
    date: Date;
    language: string;
    title: string;
    focusTag: string;
    difficulty: string;
    estimatedTime: number;
  };
};

export type DayStats = {
  completions: number;
  averageScore: number;
  scoreDistribution: number[];
};

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: Date | null;
};
