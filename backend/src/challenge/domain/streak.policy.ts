/**
 * Pure streak transition logic. Decoupled from Prisma so it's trivially
 * unit-testable: feed a previous state + a "now" date, get the next state.
 *
 * The repository layer reads/writes; the policy decides.
 */

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: Date | null;
};

export function startOfDayUtc(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export function daysBetweenUtc(a: Date, b: Date): number {
  const ms = startOfDayUtc(a).getTime() - startOfDayUtc(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Compute the streak after a successful challenge completion. The caller is
 * responsible for not invoking this for the same day twice — but the policy
 * is defensive and returns the unchanged state in that case anyway.
 */
export function nextStreakState(
  current: StreakState | null,
  now: Date,
): StreakState {
  const today = startOfDayUtc(now);

  if (!current) {
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedAt: today,
    };
  }

  if (!current.lastCompletedAt) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(current.longestStreak, 1),
      lastCompletedAt: today,
    };
  }

  const last = startOfDayUtc(current.lastCompletedAt);
  if (last.getTime() === today.getTime()) {
    // Already counted today — no transition.
    return current;
  }

  const gap = daysBetweenUtc(today, last);
  const next = gap === 1 ? current.currentStreak + 1 : 1;
  return {
    currentStreak: next,
    longestStreak: Math.max(current.longestStreak, next),
    lastCompletedAt: today,
  };
}

/**
 * A challenge is "active today" iff its UTC date matches today's UTC date.
 * Pure predicate — the use case decides what to throw on a miss.
 */
export function isChallengeActiveOn(challengeDate: Date, now: Date): boolean {
  return (
    startOfDayUtc(challengeDate).getTime() === startOfDayUtc(now).getTime()
  );
}
