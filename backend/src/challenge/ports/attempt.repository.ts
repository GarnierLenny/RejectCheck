import type {
  AttemptHistoryItem,
  AttemptScoreBreakdown,
  ChallengeAttempt,
  DayStats,
} from '../domain/challenge.types';

export type UpsertFirstAnswerInput = {
  email: string;
  challengeId: number;
  firstAnswer: string;
  aiChallenge: string;
};

export type FinalizeAttemptInput = {
  email: string;
  challengeId: number;
  secondAnswer: string;
  score: number;
  scoreBreakdown: AttemptScoreBreakdown;
  completedAt: Date;
};

export interface AttemptRepository {
  findByEmailAndChallenge(
    email: string,
    challengeId: number,
  ): Promise<ChallengeAttempt | null>;

  /** Insert or update the first-answer row (score stays 0 until finalized). */
  upsertFirstAnswer(input: UpsertFirstAnswerInput): Promise<void>;

  /** Persist the final score + breakdown. Assumes the row already exists. */
  finalize(input: FinalizeAttemptInput): Promise<void>;

  /** Aggregate completion stats for a single challenge (today's leaderboard). */
  getDayStats(challengeId: number): Promise<DayStats>;

  /** Premium history (all-time, paginated by `take`). */
  listHistory(email: string, take: number): Promise<AttemptHistoryItem[]>;
}
