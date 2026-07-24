/**
 * Percentile from a bucketed score distribution.
 *
 * Lifted verbatim (behaviour-preserving) out of the Daily Challenge ScoreCard,
 * where the only implementation of this lived. The challenge itself stays behind
 * its feature flag; this is just the pure helper, so the CV-audit percentile can
 * reuse it instead of growing a second copy.
 *
 * Pure: no I/O, no dates, no randomness.
 */

/**
 * Minimum sample size before a percentile is worth quoting to a user.
 *
 * Not a statistical constant, a credibility one. At 2026-07-24 the CV corpus is
 * 74 scored analyses from 25 people spread over 14 role families, so a per-family
 * percentile would be built on roughly 5 CVs and would collapse the moment
 * anyone asked "compared to whom?". Below this, callers render nothing at all
 * rather than a number they cannot defend.
 */
export const PERCENTILE_MIN_N = 200;

/** Whether a family/cohort has enough rows for its percentile to be quotable. */
export function canQuotePercentile(n: number): boolean {
  return n >= PERCENTILE_MIN_N;
}

/**
 * Share of the cohort at or below `score`, as a 0-100 integer.
 *
 * `buckets` is a 10-slot histogram in ascending 10-point bands (0-9, 10-19, ...
 * 90-100) and `total` its sum. A bucket counts as "below" only when its whole
 * band sits at or under the score, so the result never overstates the user's
 * standing on a partially-covered band.
 */
export function percentileFromBuckets(
  buckets: readonly number[],
  total: number,
  score: number,
): number {
  if (total <= 0) return 0;
  let below = 0;
  for (let i = 0; i < 10; i++) {
    const bucketTop = (i + 1) * 10;
    if (bucketTop <= score) below += buckets[i] ?? 0;
  }
  return Math.round((below / total) * 100);
}
