/**
 * Pure XP award computation. No DB, no IO. Easy to unit-test.
 *
 * Award structure:
 *   base * difficulty_mult * (score / 100) * streak_mult + first_perfect_focus_bonus
 *
 * Typical award per challenge:
 *   - low score on easy: ~10 XP
 *   - perfect on hard with 30-day streak: ~120 XP + 100 bonus = 220 XP
 *
 * Cap: 1 challenge per day enforced upstream → soft daily cap.
 */

export type XpAwardInput = {
  score: number; // 0-100
  difficulty: 'easy' | 'medium' | 'hard';
  currentStreak: number; // streak count INCLUDING this completion
  isFirstPerfectOnFocusTag: boolean;
};

export type XpAwardBreakdown = {
  base: number;        // base XP after difficulty multiplier
  scoreMult: number;   // 0..1
  streakMult: number;  // 1..1.5
  bonus: number;       // first-perfect-on-focus-tag flat bonus
};

export type XpAwardResult = {
  amount: number;
  breakdown: XpAwardBreakdown;
};

const BASE_XP = 50;
const DIFFICULTY_MULT: Record<XpAwardInput['difficulty'], number> = {
  easy: 1.0,
  medium: 1.3,
  hard: 1.6,
};
const FIRST_PERFECT_TAG_BONUS = 100;

export function computeXpAward(input: XpAwardInput): XpAwardResult {
  const { score, difficulty, currentStreak, isFirstPerfectOnFocusTag } = input;

  const base = BASE_XP * (DIFFICULTY_MULT[difficulty] ?? 1.0);
  const scoreMult = Math.max(0, Math.min(1, score / 100));
  // +10% per full week of streak, capped at +50%
  const streakMult = 1 + Math.min(0.5, Math.floor(Math.max(0, currentStreak) / 7) * 0.1);
  const main = Math.round(base * scoreMult * streakMult);
  const bonus =
    isFirstPerfectOnFocusTag && score === 100 ? FIRST_PERFECT_TAG_BONUS : 0;

  return {
    amount: main + bonus,
    breakdown: {
      base: Math.round(base),
      scoreMult: Number(scoreMult.toFixed(2)),
      streakMult: Number(streakMult.toFixed(2)),
      bonus,
    },
  };
}
