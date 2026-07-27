/**
 * Placeholder tokens the model leaves in a bullet rewrite for the user to fill
 * with a real figure: [X], [N], [X]%, [number]... We never ship, score, or
 * project these. Shared by both re-scan flows (CV-audit and vs-job) so the
 * honesty guard is byte-identical on each side. Pure.
 *
 * A bracketed token, up to 20 chars, no newline inside. `.test`/`.exec` on the
 * non-global regex are not stateful, so they are safe to reuse.
 */
const TOKEN = /\[[^\]\n]{1,20}\]/;
const TOKEN_G = /\[[^\]\n]{1,20}\]/g;

/** How many unfilled placeholder tokens remain in a rewrite. */
export function placeholderCount(text: string): number {
  const m = text.match(TOKEN_G);
  return m ? m.length : 0;
}

/** True when the text still carries at least one unfilled placeholder. */
export function hasUnfilledPlaceholder(text: string): boolean {
  return TOKEN.test(text);
}

/** Start/end offsets of the first placeholder, for select-on-accept. Null if none. */
export function firstPlaceholderRange(text: string): [number, number] | null {
  const m = TOKEN.exec(text);
  if (!m) return null;
  return [m.index, m.index + m[0].length];
}
