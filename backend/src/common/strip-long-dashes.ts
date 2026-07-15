/**
 * Product rule: RejectCheck AI output must never contain long dashes,
 * em "—", en "–", or horizontal bar "―". They read as
 * machine-written; the house style uses a comma or a colon instead. This module
 * is the deterministic guarantee: the model prompts also ask for no dashes, but
 * only this post-processing makes it certain, so it runs over every
 * model-generated string before it leaves the backend (analysis, CV review,
 * rewrite, cover letter, negotiation, digest, interview, challenge coach).
 *
 * It only ever rewrites the three long-dash code points, which appear
 * exclusively inside generated prose. Ids, enums and URLs use the ASCII
 * hyphen "-" and are left untouched, so it is safe to run over whole
 * structured payloads via {@link deepStripLongDashes}.
 */
const LONG_DASH = /[–—―]/;

export function stripLongDashes(text: string): string {
  if (!LONG_DASH.test(text)) return text;
  return (
    text
      // Numeric range ("55,000–75,000", "400 – 650") stays a range:
      // collapse to an ASCII hyphen so it never becomes "55,000, 75,000".
      .replace(/(\d)[ \t]*[–—―][ \t]*(\d)/g, '$1-$2')
      // Otherwise the dash is sentence punctuation: replace with a comma and a
      // single space. [ \t] (not \s) so we never swallow a newline and merge
      // two lines / list items.
      .replace(/[ \t]*[–—―]+[ \t]*/g, ', ')
  );
}

/**
 * Recursively apply {@link stripLongDashes} to every string reachable from a
 * value: objects, arrays, and nested combinations. Returns a new value; the
 * input is not mutated. Non-string leaves (numbers, booleans, null) pass
 * through unchanged.
 */
export function deepStripLongDashes<T>(value: T): T {
  if (typeof value === 'string') {
    return stripLongDashes(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepStripLongDashes(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepStripLongDashes(v);
    }
    return out as unknown as T;
  }
  return value;
}
