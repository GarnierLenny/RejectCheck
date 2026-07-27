/**
 * The user's in-progress CV draft: the original text with their accepted bullet
 * rewrites applied and their ticked keywords appended.
 *
 * This logic used to live privately inside InlineOptimize, which meant the
 * edited CV existed as a value but was shown to nobody until the moment it was
 * committed to a re-scan. The source-document panel on the left kept rendering
 * the ORIGINAL text, so every edit the user made was invisible in the document
 * they were looking at. Lifting it here lets the panel and the optimizer render
 * the same draft, so the CV visibly rewrites itself as the user works.
 *
 * Pure: no I/O, no dates, no randomness. Same input always yields the same draft.
 */

import { hasUnfilledPlaceholder } from "./placeholders";

/** Structurally compatible with BulletReviewItem (nullable optional fields). */
export type DraftBullet = {
  original: string;
  verdict?: string | null;
  rewrite?: string | null;
  why?: string | null;
};

/**
 * A bullet counts as fixed only when the user has actually written something
 * DIFFERENT from the original AND free of unfilled [X]/[N] placeholders. An
 * empty box, the original pasted back, or a template still holding "[X]%" is not
 * a fix and must not move the projected score, enter the draft, or commit. The
 * placeholder guard is what keeps a number-shaped template from inflating the
 * live projection here the same way it does on the CV-audit side. (Move B / B2.)
 */
export function isBulletResolved(
  original: string,
  edits: Record<string, string>,
): boolean {
  const e = edits[original];
  return (
    e != null &&
    e.trim().length > 0 &&
    e.trim() !== original.trim() &&
    !hasUnfilledPlaceholder(e)
  );
}

/**
 * A bullet the user has edited (differs from the original) but which still
 * carries an unfilled placeholder: it counts as "needs a number", not a fix.
 * Used to show the fill state and to block the commit until it is resolved.
 */
export function isBulletPendingFill(
  original: string,
  edits: Record<string, string>,
): boolean {
  const e = edits[original];
  return (
    e != null &&
    e.trim().length > 0 &&
    e.trim() !== original.trim() &&
    hasUnfilledPlaceholder(e)
  );
}

/** The bullets the optimizer offers to fix: everything the model did not call strong. */
export function weakBulletsOf(bullets: DraftBullet[] | undefined): DraftBullet[] {
  return (bullets ?? []).filter((b) => b.verdict !== "strong");
}

/** How many distinct edits the user has made. Drives the "N changes" affordance. */
export function countDraftChanges(
  bullets: DraftBullet[] | undefined,
  edits: Record<string, string>,
  added: ReadonlySet<string>,
): number {
  const fixed = weakBulletsOf(bullets).filter((b) =>
    isBulletResolved(b.original, edits),
  ).length;
  return fixed + added.size;
}

/**
 * The exact line texts the user's fixes have put into the draft, so the document
 * panel can mark them as changed. Matched by trimmed text rather than by line
 * index: `normalizeCvLines` re-splits the document for display, so indices there
 * do not correspond to anything stable here.
 */
export function draftChangedLines(
  bullets: DraftBullet[] | undefined,
  edits: Record<string, string>,
): string[] {
  return weakBulletsOf(bullets)
    .filter((b) => isBulletResolved(b.original, edits))
    .map((b) => edits[b.original].trim());
}

export type BuildDraftInput = {
  /** The parsed CV text as analysed. */
  cvText: string;
  bullets: DraftBullet[] | undefined;
  /** original bullet text -> the user's replacement. */
  edits: Record<string, string>;
  /** Keywords the user ticked as "I do have this". */
  added: ReadonlySet<string>;
  /** i18n label for the appended skills line (ro.skillsLine). */
  skillsLabel: string;
};

/**
 * Assemble the draft. Bullet replacements are applied in place so the line the
 * user rewrote changes WHERE IT SITS in the document rather than being appended
 * somewhere else; ticked keywords are added as a trailing skills line, which is
 * the same shape the backend re-scan expects.
 */
export function buildCvDraft({
  cvText,
  bullets,
  edits,
  added,
  skillsLabel,
}: BuildDraftInput): string {
  let text = cvText;
  for (const b of weakBulletsOf(bullets)) {
    if (isBulletResolved(b.original, edits)) {
      text = text.replace(b.original, edits[b.original].trim());
    }
  }
  const addedList = [...added];
  if (addedList.length > 0) {
    text += `\n\n${skillsLabel}: ${addedList.join(", ")}`;
  }
  return text;
}
