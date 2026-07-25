/**
 * Citable facts about the resume corpus, for the user to share.
 *
 * Every other shareable thing this product makes is about the USER: their score,
 * their gaps, their improvement. That is a confession, and confessions travel
 * badly. A fact about the corpus is the opposite: it makes the person posting it
 * look informed, and it costs them nothing to share because it reveals nothing
 * about their own CV.
 *
 * HONESTY RULES, since these are numbers people will repeat in public:
 *  - Every claim carries its sample size and names the corpus.
 *  - The corpus is "typical resumes", NOT outcome-labelled. Nothing here may
 *    imply these resumes failed, or that quantifying bullets causes hiring. It
 *    describes what resumes look like, not what works.
 *  - Numbers are DERIVED from role-archetypes.json at module load, never
 *    hardcoded, so a recalibration of the corpus cannot leave a stale claim in
 *    circulation.
 *
 * Pure: no I/O, no dates, no randomness.
 */

import ARCHETYPES from "./role-archetypes.json";
import { resolveRoleFamily, FAMILY_LABEL } from "./role-benchmark";

type Band = { p25: number; median: number; p75: number };
type FamilyData = { n: number; axes: Record<string, Band> };

const FAMILIES = (ARCHETYPES as { families: Record<string, FamilyData> }).families;

/**
 * Short, human attribution for the copied line. The raw `source` slug in the
 * JSON ("kaggle/snehaanbhawal/resume-dataset (CC0, livecareer)") is precise but
 * unreadable in a post, and a stat nobody can parse the source of is a stat that
 * gets misquoted. Names both the origin and the host.
 */
const SOURCE_SHORT = "livecareer/Kaggle resume corpus";

/** Total resumes behind any global claim. */
export const CORPUS_TOTAL = Object.values(FAMILIES).reduce((n, f) => n + f.n, 0);

/** How many role families the corpus is split into. */
export const CORPUS_FAMILY_COUNT = Object.keys(FAMILIES).length;

const medians = Object.values(FAMILIES).map(
  (f) => f.axes.quantified_bullet_pct.median,
);

/** Lowest and highest per-family median for quantified bullets, across the corpus. */
export const QUANTIFIED_MEDIAN_RANGE = {
  min: Math.round(Math.min(...medians)),
  max: Math.round(Math.max(...medians)),
};

export type CorpusFact = {
  /** Resolved family, or null when the role could not be placed. */
  family: string | null;
  /** Sample size behind THIS claim (family n, or the whole corpus). */
  n: number;
  /** Percent of bullets the median resume quantifies. */
  medianQuantifiedPct: number;
  /** Percent the top quartile reaches. Null on the global fact. */
  p75QuantifiedPct: number | null;
  /** Roughly "1 in N bullets carries a number", for the median resume. */
  oneInN: number;
};

/**
 * The fact to show a user, keyed to their role when we can place it.
 *
 * Falls back to a corpus-wide claim rather than returning null: unlike the
 * benchmark claim (which asserts something about the USER and must stay silent
 * when unproven), this asserts something about the corpus, which is true for
 * everyone. There is no honesty reason to withhold it.
 */
export function corpusFactFor(hints: string[]): CorpusFact {
  const family = hints.length > 0 ? resolveRoleFamily(hints) : null;
  const fam = family ? FAMILIES[family] : null;

  if (!fam) {
    // Global: state the RANGE of family medians rather than an average of
    // medians, which is not a meaningful statistic.
    const mid = Math.round(
      (QUANTIFIED_MEDIAN_RANGE.min + QUANTIFIED_MEDIAN_RANGE.max) / 2,
    );
    return {
      family: null,
      n: CORPUS_TOTAL,
      medianQuantifiedPct: mid,
      p75QuantifiedPct: null,
      oneInN: Math.max(2, Math.round(100 / Math.max(1, mid))),
    };
  }

  const median = Math.round(fam.axes.quantified_bullet_pct.median);
  return {
    family,
    n: fam.n,
    medianQuantifiedPct: median,
    p75QuantifiedPct: Math.round(fam.axes.quantified_bullet_pct.p75),
    oneInN: Math.max(2, Math.round(100 / Math.max(1, median))),
  };
}

/** Human label for the family, or a neutral word for the global fact. */
export function factFamilyLabel(
  fact: CorpusFact,
  lang: "en" | "fr",
): string {
  if (!fact.family) return lang === "fr" ? "tous domaines" : "all fields";
  return FAMILY_LABEL[fact.family]?.[lang] ?? fact.family;
}

/**
 * The self-contained line a user copies and posts. Carries its own sample size
 * and attribution, because a stat that travels without its source is the kind
 * that ends up misquoted back at you.
 */
export function factShareText(fact: CorpusFact, lang: "en" | "fr"): string {
  const fam = factFamilyLabel(fact, lang);
  const tail = `(n=${fact.n}, ${SOURCE_SHORT}) via rejectcheck.com`;

  if (lang === "fr") {
    const base = fact.family
      ? `Le CV ${fam} médian ne chiffre que ${fact.medianQuantifiedPct}% de ses bullets, soit environ 1 sur ${fact.oneInN}.`
      : `Sur ${fact.n} CV, la médiane ne chiffre que ${QUANTIFIED_MEDIAN_RANGE.min} à ${QUANTIFIED_MEDIAN_RANGE.max}% de ses bullets selon le domaine.`;
    const kicker =
      fact.p75QuantifiedPct != null
        ? ` Même le quartile supérieur s'arrête à ${fact.p75QuantifiedPct}%.`
        : "";
    return `${base}${kicker} ${tail}`;
  }

  const base = fact.family
    ? `The median ${fam} resume quantifies just ${fact.medianQuantifiedPct}% of its bullets, about 1 in ${fact.oneInN}.`
    : `Across ${fact.n} resumes, the median quantifies only ${QUANTIFIED_MEDIAN_RANGE.min} to ${QUANTIFIED_MEDIAN_RANGE.max}% of its bullets depending on the field.`;
  const kicker =
    fact.p75QuantifiedPct != null
      ? ` Even the top quartile stops at ${fact.p75QuantifiedPct}%.`
      : "";
  return `${base}${kicker} ${tail}`;
}
