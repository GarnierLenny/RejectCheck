/**
 * Frontend MIRROR of the backend cv_quality anchor. The source of truth is
 * backend/src/analyze/domain/score/compose-cv-review-score.ts (+ compose-score.ts):
 * the backend computes cv_quality.overall as
 *   quantize( deflate(weightedAverage(six subs)) - creditbilityPenalty )
 * and stores that on the payload. We replicate the SAME pure math here, purely
 * read-only, for two purposes:
 *
 *   1. Explain the headline to the user, so an overall that sits well below the
 *      six visible dimensions no longer reads as a contradiction (it's the
 *      deflation curve plus penalties for hard rejection signals, both of which
 *      were invisible before).
 *   2. Let the deterministic consistency guard verify that overall actually
 *      equals the formula, catching TRUE drift (e.g. an old pre-anchor row where
 *      overall was a raw model guess) instead of false-positiving on the
 *      intended deflation.
 *
 * These constants MUST stay in sync with the backend. Changing the scoring curve
 * means changing both files. There is no runtime coupling; this is a deliberate,
 * commented duplication across the web/backend package boundary.
 */

/** Weights over the six sub-scores (sum to 1). Impact-heavy: mirrors backend CV_QUALITY_WEIGHTS. */
export const CV_QUALITY_WEIGHTS = {
  impact: 0.28,
  clarity: 0.18,
  hard_skills: 0.18,
  consistency: 0.14,
  soft_skills: 0.12,
  ats_format: 0.1,
} as const;

const DEFLATION = 0.85;
const QUANT_STEP = 5;

const REDFLAG_RISK = 4;
const REDFLAG_CAP = 12;
const CRITICAL_ISSUE_RISK = 3;
const CRITICAL_ISSUE_CAP = 9;
const FATAL_BULLET_RISK = 2;
const FATAL_BULLET_CAP = 8;

const clamp0100 = (n: number) => Math.max(0, Math.min(100, n));

/** Anchored parabola: endpoints fixed (0->0, 100->100), middle pulled down. */
export function deflate(raw: number): number {
  const x = clamp0100(raw);
  return clamp0100(x + (DEFLATION * x * (x - 100)) / 100);
}

export function quantize(n: number, step: number = QUANT_STEP): number {
  return Math.round(clamp0100(n) / step) * step;
}

export type CvQualitySubs = {
  clarity: number;
  impact: number;
  hard_skills: number;
  soft_skills: number;
  consistency: number;
  ats_format: number;
};

export type HardSignalCounts = {
  redFlagCount: number;
  criticalIssueCount: number;
  fatalBulletCount: number;
};

/** Per-signal point cost (each capped), mirrors backend composePenalty. */
export function composePenalty(c: HardSignalCounts): {
  total: number;
  redFlags: number;
  criticalIssues: number;
  fatalBullets: number;
} {
  const redFlags = Math.min(REDFLAG_CAP, Math.max(0, c.redFlagCount) * REDFLAG_RISK);
  const criticalIssues = Math.min(CRITICAL_ISSUE_CAP, Math.max(0, c.criticalIssueCount) * CRITICAL_ISSUE_RISK);
  const fatalBullets = Math.min(FATAL_BULLET_CAP, Math.max(0, c.fatalBulletCount) * FATAL_BULLET_RISK);
  return { total: redFlags + criticalIssues + fatalBullets, redFlags, criticalIssues, fatalBullets };
}

export type OverallBreakdown = {
  /** Weighted mean of the six sub-scores, before deflation. */
  weightedAverage: number;
  /** After the deflation curve, before penalties. */
  deflated: number;
  /** Total points subtracted for hard rejection signals. */
  penalty: number;
  penaltyParts: { redFlags: number; criticalIssues: number; fatalBullets: number };
  /** Final quantized headline — equals the backend's cv_quality.overall. */
  overall: number;
};

/**
 * Reproduce the anchored overall from the (already-quantized, as-displayed)
 * six sub-scores and the hard-signal counts. Pure.
 */
export function explainOverall(subs: CvQualitySubs, counts: HardSignalCounts): OverallBreakdown {
  const weightedAverage =
    subs.impact * CV_QUALITY_WEIGHTS.impact +
    subs.clarity * CV_QUALITY_WEIGHTS.clarity +
    subs.hard_skills * CV_QUALITY_WEIGHTS.hard_skills +
    subs.consistency * CV_QUALITY_WEIGHTS.consistency +
    subs.soft_skills * CV_QUALITY_WEIGHTS.soft_skills +
    subs.ats_format * CV_QUALITY_WEIGHTS.ats_format;
  const deflated = deflate(weightedAverage);
  const p = composePenalty(counts);
  const overall = quantize(deflated - p.total);
  return {
    weightedAverage,
    deflated,
    penalty: p.total,
    penaltyParts: { redFlags: p.redFlags, criticalIssues: p.criticalIssues, fatalBullets: p.fatalBullets },
    overall,
  };
}

type CountableResult = {
  hidden_red_flags?: unknown[];
  cross_profile_inconsistencies?: Array<{ severity?: string }>;
  audit?: {
    cv?: { issues?: Array<{ severity?: string }> };
    github?: { issues?: Array<{ severity?: string }> };
    linkedin?: { issues?: Array<{ severity?: string }> };
  };
  bullet_reviews?: { bullets?: Array<{ verdict?: string }> };
};

/** Extract the same hard-signal counts the backend penalty used, from the payload. */
export function hardSignalCountsFromResult(result: CountableResult): HardSignalCounts {
  const critical = (arr?: Array<{ severity?: string }>) =>
    (arr ?? []).filter((x) => x?.severity === "critical").length;
  return {
    redFlagCount: result.hidden_red_flags?.length ?? 0,
    criticalIssueCount:
      critical(result.audit?.cv?.issues) +
      critical(result.audit?.github?.issues) +
      critical(result.audit?.linkedin?.issues) +
      critical(result.cross_profile_inconsistencies),
    fatalBulletCount: (result.bullet_reviews?.bullets ?? []).filter((b) => b?.verdict === "fatal").length,
  };
}
