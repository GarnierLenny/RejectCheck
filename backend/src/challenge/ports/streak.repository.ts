import type { StreakSummary } from '../domain/challenge.types';
import type { StreakState } from '../domain/streak.policy';

export interface StreakRepository {
  findByEmail(email: string): Promise<StreakState | null>;

  /** Save the streak state computed by the policy. */
  upsert(email: string, state: StreakState): Promise<StreakSummary>;
}
