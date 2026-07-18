/**
 * Anti-fabrication guard for model-generated rewrites and insertions.
 *
 * A prior blind A/B found the single-pass model fabricates concrete numbers in
 * its CV rewrites and ATS insertions, e.g. it invented a "60% fewer
 * hallucinations" metric the candidate never claimed. A rewrite the candidate
 * pastes and then can't defend in an interview is worse than no rewrite. The
 * prompt asks for placeholders, but that is discipline, not a guarantee.
 *
 * This makes it a structural guarantee: any NUMBER that appears in a rewrite or
 * insertion but NOT anywhere in the source CV text is neutralised to a
 * `[X]` / `[X]%` placeholder. The candidate keeps the improved phrasing and is
 * prompted to fill in a real figure, instead of shipping a fabricated one.
 *
 * Conservative by design: a number is trusted as soon as its digits appear
 * anywhere in the source, so genuine CV numbers are never blanked. It only
 * strips numbers with no basis in the source at all. Pure, no I/O.
 */

import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';

/** A number token: digits with optional grouping/decimal and an optional `%`. */
const NUM_TOKEN = /\d[\d.,]*%?/g;

/** Just the digits of a token, so "1,200" and "1.2" compare by value. */
function digitsOf(s: string): string {
  return s.replace(/\D/g, '');
}

/**
 * Replace every number in `text` that has no counterpart in `source` with a
 * placeholder. Returns the input unchanged when it is empty/null.
 */
export function stripFabricatedNumbers<T extends string | null | undefined>(
  text: T,
  source: string,
): T {
  if (!text) return text;
  const sourceNums = new Set<string>();
  for (const m of source.matchAll(NUM_TOKEN)) {
    const d = digitsOf(m[0]);
    if (d) sourceNums.add(d);
  }
  return (text as string).replace(NUM_TOKEN, (tok) => {
    const d = digitsOf(tok);
    if (!d || sourceNums.has(d)) return tok;
    return tok.trim().endsWith('%') ? '[X]%' : '[X]';
  }) as T;
}

/**
 * Neutralise fabricated numbers in a vs-JD analysis: bullet rewrites and the
 * paste-ready ATS keyword insertions. Mutates in place and returns the result.
 */
export function sanitizeAnalyzeFabrication(
  result: AnalyzeResponse,
  cvText: string,
): AnalyzeResponse {
  for (const b of result.bullet_reviews?.bullets ?? []) {
    b.rewrite = stripFabricatedNumbers(b.rewrite, cvText);
  }
  // ATS keyword insertions live on the deep/merged portion, not the top-level
  // AnalyzeResponse type — access structurally so this scrubs them wherever they
  // are present, and is a no-op when they are not.
  const ats = (
    result as unknown as {
      ats_critical_missing_keywords?: Array<{
        insertion?: { before: string | null; after: string };
      }>;
    }
  ).ats_critical_missing_keywords;
  for (const k of ats ?? []) {
    if (k.insertion) {
      k.insertion.before = stripFabricatedNumbers(k.insertion.before, cvText);
      k.insertion.after = stripFabricatedNumbers(k.insertion.after, cvText);
    }
  }
  return result;
}

/**
 * Neutralise fabricated numbers in a standalone CV audit: bullet rewrites and
 * the passive-phrase rewrites. Mutates in place and returns the result.
 *
 * `experience_analysis` is deliberately EXEMPT from number-stripping (plan
 * decision D5). The stripper protects PASTE-READY text the candidate would
 * ship on their CV; the deep-dive fields (findings what/why, skill evidence,
 * margin_note) are ANALYTIC prose about the CV, never pasted into it. They
 * legitimately carry derived counts with no verbatim counterpart in the source
 * ("3 of 5 bullets have no outcome", "14 months tenure" computed from dates),
 * so machine-stripping would mutilate correct arithmetic into "[X] of [X]
 * bullets". The guard there is the prompt rule (every number must exist in the
 * documents or be date arithmetic, otherwise omit) plus the staging re-read,
 * and the byte-identical passthrough is pinned in anti-fabrication.spec.ts.
 */
export function sanitizeCvReviewFabrication(
  result: CvReviewResponse,
  cvText: string,
): CvReviewResponse {
  for (const b of result.bullet_reviews?.bullets ?? []) {
    b.rewrite = stripFabricatedNumbers(b.rewrite, cvText);
  }
  if (result.cv_tone?.rewrites) {
    result.cv_tone.rewrites = result.cv_tone.rewrites.map((r) =>
      stripFabricatedNumbers(r, cvText),
    );
  }
  return result;
}
