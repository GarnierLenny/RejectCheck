/**
 * ANCHORED, EXPLAINABLE scoring for the standalone CV audit (no job description).
 *
 * The sibling `compose-score.ts` anchors the vs-JD REJECTION-RISK headline. This
 * module does the equivalent for the CV-audit QUALITY headline, which had the
 * opposite problem: `cv_quality.overall` was taken RAW from the model
 * (`i.cv_quality?.overall ?? 50`), so the headline number was an unaccountable
 * LLM guess that did not have to agree with the six sub-scores printed beneath
 * it — even though the schema advertises it as "weighted average of the 6
 * sub-scores". That contract was a lie: nothing enforced it.
 *
 * This makes it true. `overall` becomes a PURE, transparent weighted average of
 * the six (quantized) sub-scores, so the headline can no longer contradict its
 * parts and cannot twitch run-to-run at temperature 0.1 for trivial variance.
 *
 * Honesty note: this is STABLE and EXPLAINABLE (a pure function of the six
 * sub-scores), not bit-for-bit deterministic — the sub-scores are still genuine
 * LLM judgment. Same trade-off as the vs-JD composite: keep the contextual
 * judgment that is the moat, stop the headline from behaving like a guess.
 *
 * Pure: no I/O, no dates, no randomness. Trivially unit-testable.
 */

import { quantize } from './compose-score';

/**
 * Weights over the six cv_quality sub-scores (sum to 1). Impact carries the most
 * because quantified, ownership-heavy bullets are what a recruiter reacts to
 * first; clarity and hard-skills next; ats_format least (it is structural
 * machine-readability, not candidate quality).
 */
export const CV_QUALITY_WEIGHTS = {
  impact: 0.28,
  clarity: 0.18,
  hard_skills: 0.18,
  consistency: 0.14,
  soft_skills: 0.12,
  ats_format: 0.1,
} as const;

export type CvQualitySubScores = {
  clarity: number;
  impact: number;
  hard_skills: number;
  soft_skills: number;
  consistency: number;
  ats_format: number;
};

export type AnchoredCvQuality = CvQualitySubScores & { overall: number };

/**
 * Quantize the six sub-scores and recompute `overall` as their weighted average
 * (also quantized). Defensive against a missing/partial cv_quality object so it
 * is safe to call on a streaming section that hasn't fully assembled yet.
 */
export function anchorCvQuality(
  raw: Partial<CvQualitySubScores> & { overall?: number },
): AnchoredCvQuality {
  const subs: CvQualitySubScores = {
    clarity: quantize(raw.clarity ?? 0),
    impact: quantize(raw.impact ?? 0),
    hard_skills: quantize(raw.hard_skills ?? 0),
    soft_skills: quantize(raw.soft_skills ?? 0),
    consistency: quantize(raw.consistency ?? 0),
    ats_format: quantize(raw.ats_format ?? 0),
  };

  const overall = quantize(
    subs.impact * CV_QUALITY_WEIGHTS.impact +
      subs.clarity * CV_QUALITY_WEIGHTS.clarity +
      subs.hard_skills * CV_QUALITY_WEIGHTS.hard_skills +
      subs.consistency * CV_QUALITY_WEIGHTS.consistency +
      subs.soft_skills * CV_QUALITY_WEIGHTS.soft_skills +
      subs.ats_format * CV_QUALITY_WEIGHTS.ats_format,
  );

  return { ...subs, overall };
}

/**
 * Verdict band for the QUALITY headline (higher = better CV — the inverse of the
 * vs-JD risk verdict). Thresholds preserved from the prior inline mapping so the
 * frontend ScoreSidebar keeps rendering the same way.
 */
export function deriveCvQualityVerdict(overall: number): 'Low' | 'Medium' | 'High' {
  if (overall >= 70) return 'High';
  if (overall >= 40) return 'Medium';
  return 'Low';
}
