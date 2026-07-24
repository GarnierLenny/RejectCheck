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

/**
 * CV-audit deflation strength. Mirrors CV_DEFLATION in compose-cv-review-score.ts
 * and is deliberately weaker than the vs-JD default of 0.85 — see that file for
 * the measured justification. LEGACY_DEFLATION is the pre-2026-07-24 value, kept
 * only so the consistency guard can still recognise scores written by the old
 * curve as legitimately anchored (see explainOverall / LEGACY_* below).
 */
const DEFLATION = 0.15;
const LEGACY_DEFLATION = 0.85;
const QUANT_STEP = 5;

/**
 * Display bands per metric. SINGLE SOURCE for the Weak/Decent/Strong tiers used
 * by RiskMeter, the glance strip and the OG share card. Backend mirror:
 * deriveCvQualityVerdict (compose-cv-review-score.ts) and the VERDICT_* cutoffs
 * in compose-score.ts.
 *
 * These are DISPLAY thresholds, not scoring. Moving one relabels a score; it
 * never changes it. The deflation curve and penalties are deliberately
 * untouched (see DEFLATION above) — inflating scores is the exact failure mode
 * the anchored scorer exists to prevent.
 *
 * Calibrated 2026-07-24 against the full production distribution, because the
 * two metrics turned out to sit on completely different curves and a single
 * shared band mislabelled both:
 *
 *   strength (CV audit):  RE-DERIVED 2026-07-24 from the distribution the
 *     recalibrated curve produces over the 74 production CVs (p25 25, median 45,
 *     p75 50, max 70, nothing on the floor). 55/30 splits them 26% weak / 54%
 *     decent / 20% strong: every band populated, top band selective but real.
 *     The first pass at these bands used 60/30, derived from the STORED scores
 *     before we discovered 65% of them were pre-anchor raw averages rather than
 *     formula output, so that distribution described a mixed population.
 *
 *   competitiveness (vs-JD, n=52):  median 72, p75 78, max 88
 *     -> already well shaped at 80/40 (8% strong, 80% decent, 12% weak).
 *        Applying the CV-audit's cutoff here would have labelled 81% of users
 *        "Strong", which is inflation in the other direction. Left alone.
 */
export const SCORE_BANDS = {
  strength: { strong: 55, decent: 30 },
  competitiveness: { strong: 80, decent: 40 },
} as const;

export type ScoreMetric = keyof typeof SCORE_BANDS;
export type ScoreTier = "strong" | "decent" | "weak";

/** Classify a 0-100 higher-is-better score into its display tier. Pure. */
export function bandFor(metric: ScoreMetric, value: number): ScoreTier {
  const b = SCORE_BANDS[metric];
  if (value >= b.strong) return "strong";
  if (value >= b.decent) return "decent";
  return "weak";
}

// Mirrors CV_PENALTY in compose-cv-review-score.ts. Lightened 2026-07-24: the
// old costs assumed these signals were rare, but the median CV carries 3 red
// flags / 2 critical issues / 3 fatal bullets, which maxed the old 29-point cap
// on almost every CV and floored 34% of them at 0.
const REDFLAG_RISK = 1;
const REDFLAG_CAP = 4;
const CRITICAL_ISSUE_RISK = 1;
const CRITICAL_ISSUE_CAP = 3;
const FATAL_BULLET_RISK = 1;
const FATAL_BULLET_CAP = 3;

// Pre-2026-07-24 costs, used ONLY to recognise legacy anchored scores.
const LEGACY_PENALTY = {
  redFlag: { cost: 4, cap: 12 },
  criticalIssue: { cost: 3, cap: 9 },
  fatalBullet: { cost: 2, cap: 8 },
} as const;

const clamp0100 = (n: number) => Math.max(0, Math.min(100, n));

/** Anchored parabola: endpoints fixed (0->0, 100->100), middle pulled down. */
export function deflate(raw: number, strength: number = DEFLATION): number {
  const x = clamp0100(raw);
  return clamp0100(x + (strength * x * (x - 100)) / 100);
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
/**
 * Reproduce the overall the way the PRE-2026-07-24 curve did (deflation 0.85,
 * penalties 4/3/2 capped 12/9/8).
 *
 * Exists solely so the consistency guard can tell "this row was anchored by the
 * old formula" apart from "this row's headline was never anchored at all". The
 * guard's job is catching a raw LLM guess; a value matching either anchored
 * curve is, by definition, not that. Without this every analysis run before the
 * recalibration would light up as drift.
 */
export function explainOverallLegacy(
  subs: CvQualitySubs,
  counts: HardSignalCounts,
): number {
  const weightedAverage =
    subs.impact * CV_QUALITY_WEIGHTS.impact +
    subs.clarity * CV_QUALITY_WEIGHTS.clarity +
    subs.hard_skills * CV_QUALITY_WEIGHTS.hard_skills +
    subs.consistency * CV_QUALITY_WEIGHTS.consistency +
    subs.soft_skills * CV_QUALITY_WEIGHTS.soft_skills +
    subs.ats_format * CV_QUALITY_WEIGHTS.ats_format;
  const p =
    Math.min(LEGACY_PENALTY.redFlag.cap, Math.max(0, counts.redFlagCount) * LEGACY_PENALTY.redFlag.cost) +
    Math.min(LEGACY_PENALTY.criticalIssue.cap, Math.max(0, counts.criticalIssueCount) * LEGACY_PENALTY.criticalIssue.cost) +
    Math.min(LEGACY_PENALTY.fatalBullet.cap, Math.max(0, counts.fatalBulletCount) * LEGACY_PENALTY.fatalBullet.cost);
  return quantize(deflate(weightedAverage, LEGACY_DEFLATION) - p);
}

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
