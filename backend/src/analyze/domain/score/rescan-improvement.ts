/**
 * Is the before/after of a re-scan safe to SHOW as an improvement?
 *
 * A re-scan links to the analysis it improves on (Analysis.parentAnalysisId), so
 * a delta is always computable. It is not always MEANINGFUL, and publishing a
 * meaningless one is worse than publishing nothing: the whole point of the
 * glow-up artifact is that the user actually earned the gain.
 *
 * Two ways a delta lies:
 *
 *  1. The parent predates the anchored scorer. The anchoring call was lost in a
 *     merge for a period, so a large slice of history stores a raw model guess
 *     rather than formula output. Diffing a guess against a computed score
 *     produces a number that measures the pipeline, not the user's work.
 *  2. The two sides were scored by different curves. Not currently possible on
 *     the vs-JD pipeline (the 2026-07-24 recalibration deliberately left it
 *     untouched, see CV_DEFLATION), but it WILL be the day that curve moves, and
 *     the check below catches it for free rather than needing to be remembered.
 *
 * Both reduce to one question: does each stored score still reproduce from its
 * own payload under today's formula? `anchorScores` is that formula, so running
 * it and comparing is the exact test rather than a proxy for it.
 *
 * Pure: no I/O, no dates, no randomness.
 */

import { anchorScores } from './compose-score';
import type { AnalyzeResponse } from '../../dto/analyze-response.dto';

/**
 * True when `result.score` is reproducible from its own payload, i.e. it came
 * from the anchored formula and not from the model.
 *
 * Passing `null` coverage re-quantizes the already-anchored keyword match rather
 * than substituting a fresh one, so the call is idempotent on a stored row.
 * Defensive: a payload too partial to score (an old or truncated row) is treated
 * as NOT anchored, which is the safe direction.
 */
export function isAnchoredVsJd(result: AnalyzeResponse | null | undefined): boolean {
  if (!result || typeof result.score !== 'number') return false;
  // A CV audit has no vs-JD composite; it is not comparable on this axis.
  if ((result as { cv_quality?: unknown }).cv_quality) return false;
  try {
    return anchorScores(result, null).score === result.score;
  } catch {
    return false;
  }
}

/**
 * The parent's rejection risk when a re-scan's gain is real and safe to publish,
 * otherwise null.
 *
 * Returns the risk (0-100, higher = worse) rather than a competitiveness delta
 * so the caller keeps a single polarity convention; the display layer inverts.
 * Null means "render the ordinary card", never "render a zero delta".
 */
export function deriveRescanImprovement(
  current: AnalyzeResponse | null | undefined,
  parent: AnalyzeResponse | null | undefined,
): number | null {
  if (!isAnchoredVsJd(current) || !isAnchoredVsJd(parent)) return null;
  const now = current!.score;
  const before = parent!.score;
  // Lower risk = better. Equal or worse is not a win and gets no card.
  if (!(now < before)) return null;
  return before;
}
