import type { RewardKey } from '../domain/tier-config';

export type XpLedgerEntry = {
  id: number;
  amount: number;
  reason: string;
  breakdown: unknown;
  attemptId: number | null;
  challengeId: number | null;
  createdAt: Date;
};

export type ProfileXpState = {
  totalXp: number;
  level: number;
};

export type UnlockedRewardRow = {
  id: number;
  rewardKey: RewardKey;
  unlockedAt: Date;
  unlockedAtLevel: number;
  redeemed: boolean;
  stripeCouponId: string | null;
  stripePromotionCode: string | null;
};

export interface XpRepository {
  /** Read current totalXp/level from Profile (denormalized). */
  getProfileXp(email: string): Promise<ProfileXpState>;

  /** Compute the user's rank (1-indexed) by totalXp + total ranked users. */
  getRank(email: string): Promise<{ rank: number; totalUsers: number }>;

  /** Atomically: insert ledger row, increment Profile.totalXp, refresh level. Returns post-state + flag if level changed. */
  awardXp(input: {
    email: string;
    amount: number;
    reason: string;
    breakdown?: unknown;
    attemptId?: number | null;
    challengeId?: number | null;
  }): Promise<{
    inserted: boolean; // false if attemptId duplicate (idempotent skip)
    newTotalXp: number;
    oldLevel: number;
    newLevel: number;
  }>;

  /** Has any ledger row already been written for this attemptId. */
  hasLedgerForAttempt(attemptId: number): Promise<boolean>;

  /** List recent ledger entries for the user. */
  recentLedger(email: string, limit: number): Promise<XpLedgerEntry[]>;

  /** Insert a reward unlock row (no-op if already unlocked). Returns the row, including any pre-existing data. */
  upsertReward(input: {
    email: string;
    rewardKey: RewardKey;
    unlockedAtLevel: number;
    stripeCouponId?: string | null;
    stripePromotionCode?: string | null;
  }): Promise<{ inserted: boolean; row: UnlockedRewardRow }>;

  listUnlockedRewards(email: string): Promise<UnlockedRewardRow[]>;

  markRewardRedeemed(email: string, rewardKey: RewardKey): Promise<void>;
}
