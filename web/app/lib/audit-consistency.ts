/**
 * Deterministic cross-field consistency guard for a finished CV-audit payload.
 *
 * Pure code, no LLM, no tokens: given the same result it always returns the
 * same list of contradictions. It exists because the audit is assembled from
 * several independently-emitted pieces (the LLM emits `overall` AND each of the
 * six dimensions AND the findings; the benchmark/scorecard compute their own
 * numbers), so the pieces can disagree in ways a user notices immediately: an
 * overall of 15 sitting under dimensions that average ~62, or a "zero quantified
 * metrics" finding next to a scorecard that measured 37%.
 *
 * This is the backstop, not the cure. The cure for a duplicated number is to
 * compute it once (derive `overall` from the six dimensions). This guard catches
 * what slips through, and is cheap enough to run on every render (dev warn) and
 * in CI (assert clean on fixtures).
 */

import type { AnalysisResult, CvQuality } from "../components/types";
import { computeCvMetrics } from "./cv-checks";

export type AuditInconsistencySeverity = "error" | "warn";

export type AuditInconsistency = {
  /** Stable machine code, safe to branch/log on. */
  code: string;
  severity: AuditInconsistencySeverity;
  /** Human-readable, for logs and CI output. */
  message: string;
};

/** Max points the headline overall may sit from its six-dimension mean. */
export const OVERALL_TOLERANCE = 15;

/** Max points two scores OF THE SAME CONCEPT (e.g. ATS) may diverge. */
export const SAME_CONCEPT_TOLERANCE = 25;

/** At/above this measured quantified-bullet %, a "no numbers anywhere" claim is false. */
export const QUANTIFIED_CONTRADICTION_PCT = 15;

const DIMENSION_KEYS: Array<keyof CvQuality> = [
  "clarity",
  "impact",
  "hard_skills",
  "soft_skills",
  "consistency",
  "ats_format",
];

/** A finding asserting there are no quantified outcomes at all. */
const NO_QUANT =
  /\b(zero|no|not a single|none|never|lack of|lacks|absence of|without any)\b[^.]{0,60}\b(quantif|metric|number|figure|outcome|result)/i;

function isScore(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
}

function mean(nums: number[]): number {
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

/**
 * Returns every contradiction found in the payload. Empty array = consistent.
 * Pass `cvText` (the reconstructed CV) to enable the metric-vs-narrative checks;
 * omit it to run the score-only invariants.
 */
export function checkAuditConsistency(
  result: AnalysisResult,
  cvText?: string,
): AuditInconsistency[] {
  const out: AuditInconsistency[] = [];
  const q = result.cv_quality;

  if (q) {
    const dims = DIMENSION_KEYS.map((k) => q[k]);

    // 1. Range sanity — every score must be a 0-100 number.
    DIMENSION_KEYS.forEach((k, i) => {
      if (!isScore(dims[i])) {
        out.push({
          code: "dimension_out_of_range",
          severity: "error",
          message: `cv_quality.${k} = ${dims[i]} is not a 0-100 score`,
        });
      }
    });
    if (!isScore(q.overall)) {
      out.push({
        code: "overall_out_of_range",
        severity: "error",
        message: `cv_quality.overall = ${q.overall} is not a 0-100 score`,
      });
    }

    // 2. The headline overall must track its own six dimensions. This is the
    //    "15 sitting under an average of 62" contradiction.
    const validDims = dims.filter(isScore);
    if (isScore(q.overall) && validDims.length === DIMENSION_KEYS.length) {
      const m = mean(validDims);
      const drift = Math.abs(q.overall - m);
      if (drift > OVERALL_TOLERANCE) {
        out.push({
          code: "overall_vs_dimensions",
          severity: "error",
          message: `cv_quality.overall (${q.overall}) is ${Math.round(drift)} pts from its dimension mean (${Math.round(m)}); expected within ${OVERALL_TOLERANCE}`,
        });
      }
    }

    // 3. ATS scored two independent ways shouldn't wildly disagree.
    const atsAudit = result.ats_audit?.score;
    if (
      isScore(q.ats_format) &&
      isScore(atsAudit) &&
      Math.abs(q.ats_format - atsAudit) > SAME_CONCEPT_TOLERANCE
    ) {
      out.push({
        code: "ats_score_divergence",
        severity: "warn",
        message: `cv_quality.ats_format (${q.ats_format}) and ats_audit.score (${atsAudit}) disagree by more than ${SAME_CONCEPT_TOLERANCE} pts`,
      });
    }
  }

  // 4. A narrative "no quantified outcomes anywhere" claim vs the deterministic
  //    scorecard that actually counted numbers in the same CV text.
  if (cvText && cvText.trim().length > 0) {
    const measured = computeCvMetrics(cvText).quantifiedBulletPct;
    if (measured >= QUANTIFIED_CONTRADICTION_PCT) {
      const issue = (result.audit?.cv?.issues ?? []).find((i) =>
        NO_QUANT.test(`${i.what} ${i.why}`),
      );
      if (issue) {
        out.push({
          code: "quantified_claim_contradiction",
          severity: "warn",
          message: `a finding claims no quantified content ("${issue.what.slice(0, 60)}…") but the scorecard measured ${measured}% of bullets carrying a number`,
        });
      }
    }
  }

  return out;
}
