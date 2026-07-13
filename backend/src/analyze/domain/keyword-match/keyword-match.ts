/**
 * DETERMINISTIC keyword match layer (no LLM).
 *
 * Given a job description and a CV, extract the skills the JD mentions (from the
 * curated `SKILLS_LEXICON`), check each one against the CV, and compute a
 * reproducible coverage score. This is what makes the RejectCheck score
 * VERIFIABLE (same inputs → same number, every time) and makes the "quick
 * re-scan" instant and free — no tokens spent.
 *
 * It is intentionally pure: no I/O, no dates, no randomness. Feed it strings,
 * get a plain object back. That keeps it trivially unit-testable and safe to run
 * on every keystroke of a re-scan.
 */

import {
  SKILLS_LEXICON,
  type LexiconEntry,
  type SkillCategory,
} from './skills-lexicon';

export type KeywordMatchEntry = {
  /** Canonical display name (e.g. "TypeScript"). */
  term: string;
  category: SkillCategory;
  /** True when the JD frames this skill as required/must-have (heuristic). */
  required: boolean;
  /** Times the JD mentions the skill (any alias). Always >= 1. */
  jdFrequency: number;
  /** Times the CV mentions the skill (any alias). 0 when missing. */
  cvFrequency: number;
  presentInCv: boolean;
};

export type KeywordMatchResult = {
  /**
   * Every skill the JD mentions, sorted worst-gap-first: missing-required, then
   * other missing, then present — each group by JD frequency desc. Lets the UI
   * render a "fix these first" table without re-sorting.
   */
  keywords: KeywordMatchEntry[];
  /**
   * 0-100 coverage of JD skills found in the CV, weighting required skills 2x.
   * `null` when the JD contains no recognised skills (e.g. a non-tech role the
   * lexicon doesn't cover) — the caller decides how to present "not applicable".
   */
  coverageScore: number | null;
  /** Count of JD skills found in the CV. */
  matchedCount: number;
  /** Count of JD skills total. */
  totalCount: number;
};

// Weight required skills more heavily in the coverage score: missing a
// must-have hurts more than missing a nice-to-have.
const REQUIRED_WEIGHT = 2;
const OPTIONAL_WEIGHT = 1;

/**
 * Cues that mark a skill as REQUIRED when they sit next to it in the JD. Kept
 * deliberately narrow — a false "required" is worse than a missed one because
 * it over-weights the score. Matched (non-global, stateless) against a small
 * text window around each skill mention.
 */
const REQUIRED_CUE =
  /\b(require[ds]?|must[\s-]?have|must\b|essential|mandatory|proficien|expert(ise)?|strong\b|solid\b|minimum|at least|\d\+?\s*years?|years? of (experience|exp))\b/;

/** How far around a skill mention we look for a "required" cue, in chars. */
const REQUIRED_WINDOW_BEFORE = 90;
const REQUIRED_WINDOW_AFTER = 40;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strip diacritics and lowercase so "Node.js", "node.js" and "NODE.JS" all
 * collapse to the same match surface. Keeps every other character (symbols like
 * +, #, . matter for tech terms) — boundary handling is the regex's job.
 */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Compile one alias into a global matcher.
 *  - alphanumeric look-behind / look-ahead so "java" can't match inside
 *    "javascript" and "react" can't match inside "reactive".
 *  - a space in the alias becomes `[\s/_-]+`, so "machine learning" also catches
 *    "machine-learning" and "machine/learning".
 */
function aliasToMatcher(alias: string): RegExp {
  const body = alias
    .trim()
    .split(/\s+/)
    .map(escapeRegex)
    .join('[\\s/_-]+');
  return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`, 'g');
}

type CompiledEntry = {
  entry: LexiconEntry;
  matchers: RegExp[];
};

/**
 * Pre-compile every alias in the lexicon ONCE at module load. Regexes are
 * static, and `String.prototype.matchAll` copies the regex internally (it does
 * not read/advance a shared `lastIndex`), so reusing these across calls is safe
 * and keeps a re-scan cheap.
 */
const COMPILED: CompiledEntry[] = SKILLS_LEXICON.map((entry) => {
  const base = entry.matchCanonical === false ? [] : [entry.canonical.toLowerCase()];
  const aliases = dedupe([...base, ...entry.aliases]);
  return { entry, matchers: aliases.map(aliasToMatcher) };
});

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/** Count non-overlapping matches of any alias matcher in `text`. */
function countMatches(matchers: RegExp[], text: string): number {
  let count = 0;
  for (const re of matchers) {
    for (const _m of text.matchAll(re)) count += 1;
  }
  return count;
}

/** Sentence/clause terminators — a required cue must not bleed across these. */
const CLAUSE_BOUNDARY = /[.!?;\n]/;

/**
 * True when any JD mention of this skill sits within a small window of a
 * "required" cue, WITHOUT crossing a sentence boundary. Deterministic: scans
 * the same match positions every time.
 *
 * The clause-bounding matters: "TypeScript is required. Redis is a plus." must
 * NOT flag Redis as required just because "required" is a few chars upstream —
 * it belongs to the previous sentence.
 */
function detectRequired(matchers: RegExp[], jd: string): boolean {
  for (const re of matchers) {
    for (const m of jd.matchAll(re)) {
      const idx = m.index ?? 0;
      const len = m[0].length;

      // Look-behind window, trimmed to the start of the current clause.
      let before = jd.slice(Math.max(0, idx - REQUIRED_WINDOW_BEFORE), idx);
      before = before.replace(/^[\s\S]*[.!?;\n]/, '');

      // Look-ahead window, trimmed to the end of the current clause.
      let after = jd.slice(idx + len, idx + len + REQUIRED_WINDOW_AFTER);
      const boundary = after.search(CLAUSE_BOUNDARY);
      if (boundary !== -1) after = after.slice(0, boundary);

      if (REQUIRED_CUE.test(before + m[0] + after)) return true;
    }
  }
  return false;
}

/**
 * Run the deterministic match. `jobDescription` drives which skills are in
 * scope; `cvText` is checked for each. Pass the FULL CV text (not the
 * model-truncated slice) — matching is cheap and truncation would silently drop
 * skills that appear late in the CV.
 */
export function matchKeywords(
  jobDescription: string,
  cvText: string,
): KeywordMatchResult {
  const jd = normalize(jobDescription ?? '');
  const cv = normalize(cvText ?? '');

  const keywords: KeywordMatchEntry[] = [];
  for (const { entry, matchers } of COMPILED) {
    const jdFrequency = countMatches(matchers, jd);
    if (jdFrequency === 0) continue; // not a JD skill → out of scope

    const cvFrequency = countMatches(matchers, cv);
    keywords.push({
      term: entry.canonical,
      category: entry.category,
      required: detectRequired(matchers, jd),
      jdFrequency,
      cvFrequency,
      presentInCv: cvFrequency > 0,
    });
  }

  const totalCount = keywords.length;
  const matchedCount = keywords.filter((k) => k.presentInCv).length;

  const weightOf = (k: KeywordMatchEntry) =>
    k.required ? REQUIRED_WEIGHT : OPTIONAL_WEIGHT;
  const totalWeight = keywords.reduce((sum, k) => sum + weightOf(k), 0);
  const matchedWeight = keywords
    .filter((k) => k.presentInCv)
    .reduce((sum, k) => sum + weightOf(k), 0);

  const coverageScore =
    totalWeight === 0 ? null : Math.round((100 * matchedWeight) / totalWeight);

  keywords.sort(compareByGap);

  return { keywords, coverageScore, matchedCount, totalCount };
}

/**
 * Sort worst-gap-first so the UI reads top-to-bottom as a to-do list:
 * missing-required → missing-optional → present, each by JD frequency desc,
 * then alphabetical for a stable, reproducible order.
 */
function compareByGap(a: KeywordMatchEntry, b: KeywordMatchEntry): number {
  const rank = (k: KeywordMatchEntry) =>
    !k.presentInCv && k.required ? 0 : !k.presentInCv ? 1 : 2;
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (a.jdFrequency !== b.jdFrequency) return b.jdFrequency - a.jdFrequency;
  return a.term.localeCompare(b.term);
}

/** Required JD skills the CV is missing — the "fix these first" shortlist. */
export function missingRequired(
  result: KeywordMatchResult,
): KeywordMatchEntry[] {
  return result.keywords.filter((k) => k.required && !k.presentInCv);
}
