/**
 * Tier-1 benchmark (C): compare a CV's structural metrics to per-role bands
 * calibrated offline from a resume corpus (see datasets/calibrate). Honest by
 * construction: bands are "typical" (not outcome-labeled), and we only make a
 * benchmark claim when the CV maps to a family we have bands for — otherwise we
 * return null and the UI falls back to the deterministic scorecard (A + B).
 *
 * Pure and display-only. Uses computeCvMetrics as the single source so a CV's
 * value is computed with the SAME math the bands were calibrated with.
 */

import ARCHETYPES from "./role-archetypes.json";
import { computeCvMetrics } from "./cv-checks";
import { bandFor } from "./cv-quality-score";

export type Band = { p25: number; median: number; p75: number };
type FamilyData = { n: number; avg_bullets_detected: number; axes: Record<string, Band> };

const FAMILIES = (ARCHETYPES as { families: Record<string, FamilyData> }).families;

/**
 * Free-text role hints -> archetype family. We score each family by how many of
 * its cues the hints hit and take the highest, so one incidental cue (e.g.
 * "auditor" on a quality engineer, which used to grab "finance") can't outrank
 * the family the CV matches on several signals. Ties break toward the earlier,
 * more specific family in this list.
 */
const FAMILY_CUES: Array<[string, string[]]> = [
  ["software", ["software","developer"," dev ","full stack","fullstack","frontend","front-end","backend","back-end","devops","programmer","web developer","mobile developer","ios","android","data scientist","data engineer","machine learning"," ml ","data analyst","sre","cloud engineer"]],
  ["design", ["designer"," ux"," ui ","product design","graphic","visual design","creative director","illustrat","art director","brand design"]],
  ["marketing", ["marketing","growth","seo","content strateg","social media","brand manager","communications","public relations"," pr ","advertising","digital media","copywrit"]],
  ["sales", ["sales","account executive","business development","account manager"," bdr"," sdr","partnerships"]],
  ["finance", ["finance","financial","accountant","accounting","banking","investment","controller","treasury","fp&a","auditor","bookkeep"]],
  ["hr", ["human resources"," hr ","recruit","talent acquisition","people ops","hris"]],
  ["legal", ["legal","lawyer","attorney","paralegal","counsel","advocate","litigation","compliance officer"]],
  ["healthcare", ["nurse","nursing","medical","clinical","physician","therapist","healthcare","patient","pharmac","dental","caregiver","fitness","personal trainer"]],
  ["education", ["teacher","teaching","education","professor","instructor","tutor","lecturer","curriculum","faculty"]],
  ["consulting", ["consultant","consulting","advisory","strategy"]],
  ["engineering", ["mechanical","civil engineer","electrical engineer","industrial engineer","manufacturing","aerospace","aeronautical","aviation","avionics","structural","hardware engineer","chemical engineer","quality engineer","quality assurance","quality control","qa engineer","process engineer","reliability engineer","maintenance engineer","repair engineer","propulsion","turbine","mechatronic"]],
  ["operations", ["operations","logistics","supply chain","procurement","warehouse","aviation","bpo","dispatch"]],
  ["hospitality", ["hospitality","hotel","restaurant","chef","culinary","food service","barista","guest service"]],
  ["trades", ["construction","electrician","plumber","mechanic","automotive","technician","welder","hvac","carpenter","agriculture","farm","driver"]],
];

export function resolveRoleFamily(hints: string[]): string | null {
  const hay = " " + hints.join(" ").toLowerCase() + " ";
  let best: { family: string; score: number } | null = null;
  for (const [family, cues] of FAMILY_CUES) {
    if (!FAMILIES[family]) continue;
    const score = cues.reduce((n, c) => (hay.includes(c) ? n + 1 : n), 0);
    // Strictly-greater keeps the earlier (more specific) family on a tie.
    if (score > 0 && (best === null || score > best.score)) best = { family, score };
  }
  return best?.family ?? null;
}

export type BenchAxisKey = "quantified_bullet_pct" | "action_verb_pct" | "metric_density";

export type BenchAxis = {
  key: BenchAxisKey;
  your: number;
  band: Band;
  belowMedian: boolean;
  /** Normalized shortfall vs median (0 when at/above median). Drives the next action. */
  gap: number;
  /** At or above the corpus top quartile on this axis. */
  aboveP75: boolean;
  /** Normalized margin over p75 (0 when below it). Ranks the strongest axis. */
  lead: number;
};

export type Benchmark = {
  family: string;
  n: number;
  axes: BenchAxis[];
  /** The single highest-leverage axis below median, or null when at/above on all. */
  nextAxis: BenchAxis | null;
  /** The single strongest axis at or above p75, or null when none clears it. */
  topAxis: BenchAxis | null;
};

const JUDGED: Array<{ key: BenchAxisKey; metric: "quantifiedBulletPct" | "actionVerbPct" | "metricDensity" }> = [
  { key: "quantified_bullet_pct", metric: "quantifiedBulletPct" },
  { key: "action_verb_pct", metric: "actionVerbPct" },
  { key: "metric_density", metric: "metricDensity" },
];

export function computeBenchmark(cvText: string, hints: string[]): Benchmark | null {
  const family = resolveRoleFamily(hints);
  if (!family) return null;
  const fam = FAMILIES[family];
  if (!fam) return null;

  const m = computeCvMetrics(cvText);
  const axes: BenchAxis[] = JUDGED.map(({ key, metric }) => {
    const band = fam.axes[key];
    const your = m[metric];
    const belowMedian = your < band.median;
    const gap = belowMedian && band.median > 0 ? (band.median - your) / band.median : 0;
    const aboveP75 = your >= band.p75;
    const lead = aboveP75 && band.p75 > 0 ? (your - band.p75) / band.p75 : 0;
    return { key, your, band, belowMedian, gap, aboveP75, lead };
  });

  const below = axes.filter((a) => a.belowMedian).sort((a, b) => b.gap - a.gap);
  const above = axes.filter((a) => a.aboveP75).sort((a, b) => b.lead - a.lead);
  return { family, n: fam.n, axes, nextAxis: below[0] ?? null, topAxis: above[0] ?? null };
}

/**
 * The one comparative claim we are willing to put next to the headline score and
 * on the public share card: "top quartile on X, vs N <family> resumes".
 *
 * HONEST BY CONSTRUCTION, and this is the whole point of the function. TWO gates,
 * both required, because measuring the first one alone showed it was not enough:
 *
 *  1. The CV must clear the corpus top quartile on some axis. Necessary, but far
 *     from sufficient: measured over the 70 scored CVs with text (2026-07-24),
 *     86% clear p75 somewhere, because typical resumes in the corpus barely
 *     quantify anything, so the bar is low. A badge 86% of people get is not a
 *     distinction, it is wallpaper.
 *  2. The HEADLINE must be in the Strong band. Without this, 20 of the 23 weak
 *     CVs earned a "top quartile" brag sitting directly under a failing score,
 *     which reads as the product contradicting itself and burns the credibility
 *     that makes the claim worth anything. With it, the claim fires for 21% of
 *     CVs, which matches how rare the Strong band actually is (22%).
 *
 * So a weak or merely decent CV gets NOTHING. No fallback phrasing, no softened
 * claim, no "close to typical" consolation: the alternative is manufacturing a
 * flex the data does not support. Same principle as computeBenchmark returning
 * null for an unresolved family — better silent than uncitable. (The upside for
 * everyone else is a different artifact entirely: an improvement delta, which is
 * a flex from any starting point.)
 *
 * Pure, and deterministic for a given CV: the only thing that can move a claim
 * is a deliberate recalibration of role-archetypes.json.
 */
/** Display label per family. Single source: the panel and the claim line share it. */
export const FAMILY_LABEL: Record<string, { en: string; fr: string }> = {
  software: { en: "software", fr: "tech" },
  engineering: { en: "engineering", fr: "ingénierie" },
  finance: { en: "finance", fr: "finance" },
  sales: { en: "sales", fr: "vente" },
  marketing: { en: "marketing", fr: "marketing" },
  design: { en: "design", fr: "design" },
  hr: { en: "HR", fr: "RH" },
  legal: { en: "legal", fr: "juridique" },
  healthcare: { en: "healthcare", fr: "santé" },
  education: { en: "education", fr: "éducation" },
  consulting: { en: "consulting", fr: "conseil" },
  operations: { en: "operations", fr: "opérations" },
  hospitality: { en: "hospitality", fr: "hôtellerie" },
  trades: { en: "trades", fr: "métiers" },
};

/**
 * Short noun phrase naming the axis inside a claim sentence ("top quartile on
 * quantified impact"). Deliberately plainer than the panel's AXIS_LABEL, which
 * is a column header and reads wrong mid-sentence.
 */
export const AXIS_CLAIM_LABEL: Record<BenchAxisKey, { en: string; fr: string }> = {
  quantified_bullet_pct: { en: "quantified impact", fr: "l'impact chiffré" },
  action_verb_pct: { en: "action verbs", fr: "les verbes d'action" },
  metric_density: { en: "hard numbers", fr: "les chiffres concrets" },
};

export type BenchmarkClaim = {
  family: string;
  /** Corpus size behind the claim, so the copy can cite it. */
  n: number;
  axis: BenchAxisKey;
  /** The user's value on that axis. */
  your: number;
  /** The top-quartile cutoff it cleared. */
  p75: number;
};

export function buildBenchmarkClaim(
  cvText: string,
  hints: string[],
  /** The cv_quality.overall headline this claim would sit next to. */
  overall: number,
): BenchmarkClaim | null {
  // Gate 2: never put a brag under a score that does not support it.
  if (bandFor("strength", overall) !== "strong") return null;
  const b = computeBenchmark(cvText, hints);
  if (!b || !b.topAxis) return null;
  return {
    family: b.family,
    n: b.n,
    axis: b.topAxis.key,
    your: b.topAxis.your,
    p75: b.topAxis.band.p75,
  };
}
