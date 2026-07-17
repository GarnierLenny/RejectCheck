/**
 * The resume "ceiling" answer (option A): the single highest-leverage dimension
 * between this CV and Strong (80). Derived deterministically from the six
 * cv_quality sub-scores weighted the same way the backend composes `overall`
 * (compose-cv-review-score.ts). Gives the user a concrete finish line — "the one
 * thing to reach Strong" — instead of an endless list of subtractions.
 *
 * Mirrors CV_QUALITY_WEIGHTS from the backend; keep in sync (same pattern as
 * score-projection.ts mirroring the vs-JD weights).
 */

export const CV_QUALITY_WEIGHTS = {
  impact: 0.28,
  clarity: 0.18,
  hard_skills: 0.18,
  consistency: 0.14,
  soft_skills: 0.12,
  ats_format: 0.1,
} as const;

export type CvQualityDim = keyof typeof CV_QUALITY_WEIGHTS;

/** The Strong band floor — the target the lever aims the user at. */
export const STRONG = 80;

type Quality = Partial<Record<CvQualityDim, number>> & { overall?: number };
type Notes = Partial<Record<CvQualityDim, string>>;

export type NextLever = {
  dimension: CvQualityDim;
  current: number;
  target: number;
  /** The cv_quality_notes line for this dimension, when available. */
  note?: string;
};

/**
 * The dimension whose improvement would raise `overall` the most — the one with
 * the largest WEIGHTED HEADROOM (weight * room to 100). Returns null only when
 * the CV is already Strong (the UI then shows the finish-line state).
 *
 * We measure headroom to 100, not shortfall to Strong: `overall` is a deflated
 * function of the sub-scores, so it only reaches Strong (80) when the sub-scores
 * average well above 80. Targeting sub-score-80 would go blank on genuinely good
 * CVs whose overall is still short of Strong — a dead zone. Headroom always
 * names a real lever whenever there is any room left.
 */
export function nextLever(quality?: Quality | null, notes?: Notes | null): NextLever | null {
  if (!quality) return null;
  if ((quality.overall ?? 0) >= STRONG) return null;

  let best: { dim: CvQualityDim; headroom: number } | null = null;
  for (const dim of Object.keys(CV_QUALITY_WEIGHTS) as CvQualityDim[]) {
    const v = quality[dim] ?? 0;
    const headroom = CV_QUALITY_WEIGHTS[dim] * (100 - v);
    if (!best || headroom > best.headroom) best = { dim, headroom };
  }
  // All sub-scores maxed but overall still short (heavy penalties): fall back to
  // the highest-weight dimension so the finish line is never blank.
  const dim = best && best.headroom > 0 ? best.dim : "impact";

  return {
    dimension: dim,
    current: quality[dim] ?? 0,
    target: STRONG,
    note: notes?.[dim],
  };
}
