/**
 * When a tracked application has gone quiet long enough to be worth a nudge.
 *
 * This is the product's first EVENT-triggered email. Every existing one is
 * calendar-based (welcome on signup, drips at D+1 and D+3 from signup), which
 * means nothing the user actually does can bring them back. "You applied 14 days
 * ago and heard nothing" is the moment the brand name is literally the action
 * they want to take.
 *
 * Pure: `now` is injected rather than read, so the boundary is testable at an
 * exact instant instead of "roughly two weeks ago".
 */

/**
 * Silence long enough to mean something. Two weeks is the point where most
 * pipelines have either moved or gone cold, and it is short enough that the
 * role is still live in the user's mind.
 */
export const STALE_AFTER_DAYS = 14;

/**
 * Stop nudging eventually. Past this the application is dead rather than quiet,
 * and a reminder is noise about a job the user has moved on from. It also stops
 * the very first cron run from blasting every historical row at once.
 */
export const STALE_UNTIL_DAYS = 45;

/** Only a submitted-and-waiting application can be "quiet". */
export type NudgeableStatus = 'applied';

export type StaleCandidate = {
  id: number;
  email: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days between `appliedAt` and `now`. Negative clamps to 0. */
export function daysSinceApplied(appliedAt: Date, now: Date): number {
  const ms = now.getTime() - appliedAt.getTime();
  return ms <= 0 ? 0 : Math.floor(ms / MS_PER_DAY);
}

/**
 * Worth nudging: still awaiting a reply, quiet for at least STALE_AFTER_DAYS,
 * and not so old it has become archaeology.
 *
 * Deliberately excludes `interested` (never actually applied, so there is no
 * silence to report) and every terminal status. Nudging someone about a role
 * they already got rejected from would be worse than sending nothing.
 */
export function isNudgeable(app: StaleCandidate, now: Date): boolean {
  if (app.status !== 'applied') return false;
  const days = daysSinceApplied(app.appliedAt, now);
  return days >= STALE_AFTER_DAYS && days <= STALE_UNTIL_DAYS;
}

/** The nudgeable subset, quietest first, so the oldest silence is handled first. */
export function selectNudgeable(
  apps: StaleCandidate[],
  now: Date,
): StaleCandidate[] {
  return apps
    .filter((a) => isNudgeable(a, now))
    .sort((a, b) => a.appliedAt.getTime() - b.appliedAt.getTime());
}
