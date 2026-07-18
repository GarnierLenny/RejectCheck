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
};

export type Benchmark = {
  family: string;
  n: number;
  axes: BenchAxis[];
  /** The single highest-leverage axis below median, or null when at/above on all. */
  nextAxis: BenchAxis | null;
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
    return { key, your, band, belowMedian, gap };
  });

  const below = axes.filter((a) => a.belowMedian).sort((a, b) => b.gap - a.gap);
  return { family, n: fam.n, axes, nextAxis: below[0] ?? null };
}
