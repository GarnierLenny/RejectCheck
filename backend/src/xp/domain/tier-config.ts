/**
 * XP system: tier/level definitions and rewards.
 * Hardcoded so the curve and rewards are version-controlled and reviewable.
 *
 * 6 named tiers × ~3 sub-levels = 16 levels total.
 * Quadratic-ish curve: fast at the start (hook), longer grind at the top.
 */

export type TierKey =
  | 'apprentice'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal';

export type RewardKey =
  | 'badge_apprentice'
  | 'badge_junior'
  | 'badge_mid'
  | 'badge_senior'
  | 'badge_staff'
  | 'badge_principal'
  | 'animated_tier_ring'
  | 'leaderboard_spotlight'
  | 'discount_10_shortlisted'
  | 'discount_25_shortlisted'
  | 'discount_40_shortlisted'
  | 'free_month_hired'
  | 'discount_50_hired'
  | 'free_6mo_hired';

export type LevelDef = {
  level: number;
  tier: TierKey;
  tierLabel: string;
  xpRequired: number;
  rewards: RewardKey[];
};

export const LEVELS: readonly LevelDef[] = [
  { level: 1,  tier: 'apprentice', tierLabel: 'Apprentice I',   xpRequired: 0,     rewards: [] },
  { level: 2,  tier: 'apprentice', tierLabel: 'Apprentice II',  xpRequired: 100,   rewards: [] },
  { level: 3,  tier: 'apprentice', tierLabel: 'Apprentice III', xpRequired: 250,   rewards: ['badge_apprentice'] },
  { level: 4,  tier: 'junior',     tierLabel: 'Junior I',       xpRequired: 500,   rewards: ['badge_junior'] },
  { level: 5,  tier: 'junior',     tierLabel: 'Junior II',      xpRequired: 900,   rewards: [] },
  { level: 6,  tier: 'junior',     tierLabel: 'Junior III',     xpRequired: 1500,  rewards: ['discount_10_shortlisted'] },
  { level: 7,  tier: 'mid',        tierLabel: 'Mid I',          xpRequired: 2400,  rewards: ['badge_mid'] },
  { level: 8,  tier: 'mid',        tierLabel: 'Mid II',         xpRequired: 3600,  rewards: [] },
  { level: 9,  tier: 'mid',        tierLabel: 'Mid III',        xpRequired: 5200,  rewards: ['discount_25_shortlisted', 'leaderboard_spotlight'] },
  { level: 10, tier: 'senior',     tierLabel: 'Senior I',       xpRequired: 7400,  rewards: ['badge_senior', 'animated_tier_ring'] },
  { level: 11, tier: 'senior',     tierLabel: 'Senior II',      xpRequired: 10200, rewards: [] },
  { level: 12, tier: 'senior',     tierLabel: 'Senior III',     xpRequired: 13800, rewards: ['discount_40_shortlisted', 'free_month_hired'] },
  { level: 13, tier: 'staff',      tierLabel: 'Staff I',        xpRequired: 18400, rewards: ['badge_staff'] },
  { level: 14, tier: 'staff',      tierLabel: 'Staff II',       xpRequired: 24200, rewards: ['discount_50_hired'] },
  { level: 15, tier: 'staff',      tierLabel: 'Staff III',      xpRequired: 31600, rewards: [] },
  { level: 16, tier: 'principal',  tierLabel: 'Principal',      xpRequired: 41000, rewards: ['badge_principal', 'free_6mo_hired'] },
] as const;

export type RewardDef =
  | {
      key: RewardKey;
      type: 'cosmetic';
      label: string;
      description: string;
    }
  | {
      key: RewardKey;
      type: 'stripe_coupon';
      label: string;
      description: string;
      couponPercent: number;
      couponDuration: 'once' | 'repeating' | 'forever';
      couponMonths?: number; // only for 'repeating'
      targetPlan: 'shortlisted' | 'hired';
    };

export const REWARDS: Record<RewardKey, RewardDef> = {
  badge_apprentice: {
    key: 'badge_apprentice',
    type: 'cosmetic',
    label: 'Apprentice tier badge',
    description: 'Show off your starting rank on your profile.',
  },
  badge_junior: {
    key: 'badge_junior',
    type: 'cosmetic',
    label: 'Junior tier badge',
    description: 'Junior reviewer rank, displayed on profile and leaderboard.',
  },
  badge_mid: {
    key: 'badge_mid',
    type: 'cosmetic',
    label: 'Mid tier badge',
    description: 'Mid-level reviewer rank, displayed everywhere.',
  },
  badge_senior: {
    key: 'badge_senior',
    type: 'cosmetic',
    label: 'Senior tier badge',
    description: 'Senior reviewer rank — earned through consistent practice.',
  },
  badge_staff: {
    key: 'badge_staff',
    type: 'cosmetic',
    label: 'Staff tier badge',
    description: 'Staff reviewer rank — top 5% of users.',
  },
  badge_principal: {
    key: 'badge_principal',
    type: 'cosmetic',
    label: 'Principal tier badge',
    description: 'Principal reviewer — the rarest rank, animated forever.',
  },
  animated_tier_ring: {
    key: 'animated_tier_ring',
    type: 'cosmetic',
    label: 'Animated tier ring',
    description: 'Subtle red glow ring around your avatar everywhere on the site.',
  },
  leaderboard_spotlight: {
    key: 'leaderboard_spotlight',
    type: 'cosmetic',
    label: 'Leaderboard spotlight',
    description: 'Your row is highlighted in red on every leaderboard.',
  },
  discount_10_shortlisted: {
    key: 'discount_10_shortlisted',
    type: 'stripe_coupon',
    label: '10% off Shortlisted',
    description: '10% off your first month of the Shortlisted plan.',
    couponPercent: 10,
    couponDuration: 'once',
    targetPlan: 'shortlisted',
  },
  discount_25_shortlisted: {
    key: 'discount_25_shortlisted',
    type: 'stripe_coupon',
    label: '25% off Shortlisted',
    description: '25% off your first 3 months of the Shortlisted plan.',
    couponPercent: 25,
    couponDuration: 'repeating',
    couponMonths: 3,
    targetPlan: 'shortlisted',
  },
  discount_40_shortlisted: {
    key: 'discount_40_shortlisted',
    type: 'stripe_coupon',
    label: '40% off Shortlisted',
    description: '40% off your first 6 months of the Shortlisted plan.',
    couponPercent: 40,
    couponDuration: 'repeating',
    couponMonths: 6,
    targetPlan: 'shortlisted',
  },
  free_month_hired: {
    key: 'free_month_hired',
    type: 'stripe_coupon',
    label: '1 month free Hired',
    description: '100% off your first month of the Hired plan.',
    couponPercent: 100,
    couponDuration: 'once',
    targetPlan: 'hired',
  },
  discount_50_hired: {
    key: 'discount_50_hired',
    type: 'stripe_coupon',
    label: '50% off Hired',
    description: '50% off your first 3 months of the Hired plan.',
    couponPercent: 50,
    couponDuration: 'repeating',
    couponMonths: 3,
    targetPlan: 'hired',
  },
  free_6mo_hired: {
    key: 'free_6mo_hired',
    type: 'stripe_coupon',
    label: '6 months free Hired',
    description: '100% off your first 6 months of the Hired plan.',
    couponPercent: 100,
    couponDuration: 'repeating',
    couponMonths: 6,
    targetPlan: 'hired',
  },
};

/** Find the highest level whose xpRequired ≤ totalXp. */
export function levelFromXp(totalXp: number): LevelDef {
  let result: LevelDef = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.xpRequired) {
      result = lvl;
    } else {
      break;
    }
  }
  return result;
}

export type LevelProgress = {
  current: LevelDef;
  next: LevelDef | null;
  xpInLevel: number;        // XP earned past the current level threshold
  xpForNextLevel: number;   // XP between current and next level (denominator for progress bar)
  percentToNextLevel: number; // 0-100; 100 if max tier
};

export function xpProgress(totalXp: number): LevelProgress {
  const current = levelFromXp(totalXp);
  const nextIdx = LEVELS.findIndex((l) => l.level === current.level + 1);
  const next = nextIdx >= 0 ? LEVELS[nextIdx] : null;
  const xpInLevel = totalXp - current.xpRequired;
  const xpForNextLevel = next ? next.xpRequired - current.xpRequired : 0;
  const percentToNextLevel = next
    ? Math.min(100, Math.round((xpInLevel / xpForNextLevel) * 100))
    : 100;
  return { current, next, xpInLevel, xpForNextLevel, percentToNextLevel };
}

/** Levels gained when totalXp crosses thresholds from oldXp to newXp. */
export function rewardsBetween(oldXp: number, newXp: number): RewardKey[] {
  if (newXp <= oldXp) return [];
  const oldLevel = levelFromXp(oldXp).level;
  const newLevel = levelFromXp(newXp).level;
  if (newLevel === oldLevel) return [];
  const rewards: RewardKey[] = [];
  for (const lvl of LEVELS) {
    if (lvl.level > oldLevel && lvl.level <= newLevel) {
      rewards.push(...lvl.rewards);
    }
  }
  return rewards;
}
