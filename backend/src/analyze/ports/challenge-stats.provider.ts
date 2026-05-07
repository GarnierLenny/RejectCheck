import type { ChallengeStatsSummary } from '../domain/challenge-stats.types';

export interface ChallengeStatsProvider {
  getSummary(email: string): Promise<ChallengeStatsSummary>;
}
