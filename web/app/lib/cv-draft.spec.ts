import { describe, expect, it } from "vitest";

import {
  buildCvDraft,
  countDraftChanges,
  draftChangedLines,
  isBulletResolved,
  weakBulletsOf,
  type DraftBullet,
} from "./cv-draft";

const CV = [
  "PROFESSIONAL EXPERIENCE",
  "Full-Stack Engineer",
  "Participated in the migration of the billing service",
  "Synchronized real-time state across mobile using TanStack Query",
  "EDUCATION",
].join("\n");

const BULLETS: DraftBullet[] = [
  { original: "Participated in the migration of the billing service", verdict: "fatal", rewrite: "Migrated the billing service, cutting invoice errors by 40%" },
  { original: "Synchronized real-time state across mobile using TanStack Query", verdict: "weak", rewrite: "Synchronized real-time state, reducing redundant API calls by 30%" },
  { original: "Owned the payments rewrite end to end", verdict: "strong" },
];

const SKILLS = "Additional skills";

describe("isBulletResolved", () => {
  it("needs a non-empty edit that differs from the original", () => {
    const original = "Participated in the migration";
    expect(isBulletResolved(original, {})).toBe(false);
    expect(isBulletResolved(original, { [original]: "" })).toBe(false);
    expect(isBulletResolved(original, { [original]: "   " })).toBe(false);
    // The original pasted back is not a fix, and must not move the score.
    expect(isBulletResolved(original, { [original]: "  Participated in the migration  " })).toBe(false);
    expect(isBulletResolved(original, { [original]: "Migrated the service" })).toBe(true);
  });
});

describe("weakBulletsOf", () => {
  it("offers everything the model did not call strong", () => {
    expect(weakBulletsOf(BULLETS).map((b) => b.verdict)).toEqual(["fatal", "weak"]);
    expect(weakBulletsOf(undefined)).toEqual([]);
  });
});

describe("buildCvDraft", () => {
  it("returns the original untouched when nothing has been edited", () => {
    expect(
      buildCvDraft({ cvText: CV, bullets: BULLETS, edits: {}, added: new Set(), skillsLabel: SKILLS }),
    ).toBe(CV);
  });

  it("replaces a fixed bullet IN PLACE, so the line changes where it sits", () => {
    const draft = buildCvDraft({
      cvText: CV,
      bullets: BULLETS,
      edits: { [BULLETS[0].original]: "Migrated the billing service, cutting invoice errors by 40%" },
      added: new Set(),
      skillsLabel: SKILLS,
    });
    const lines = draft.split("\n");
    // Same index as the original bullet: the document is rewritten, not appended to.
    expect(lines[2]).toBe("Migrated the billing service, cutting invoice errors by 40%");
    expect(lines[1]).toBe("Full-Stack Engineer");
    expect(lines[4]).toBe("EDUCATION");
    expect(draft).not.toContain("Participated in");
  });

  it("leaves the document alone for edits that are not real fixes", () => {
    const draft = buildCvDraft({
      cvText: CV,
      bullets: BULLETS,
      edits: { [BULLETS[0].original]: "   ", [BULLETS[1].original]: BULLETS[1].original },
      added: new Set(),
      skillsLabel: SKILLS,
    });
    expect(draft).toBe(CV);
  });

  it("appends ticked keywords as a trailing skills line", () => {
    const draft = buildCvDraft({
      cvText: CV,
      bullets: BULLETS,
      edits: {},
      added: new Set(["AWS", "RAG"]),
      skillsLabel: SKILLS,
    });
    expect(draft.startsWith(CV)).toBe(true);
    expect(draft).toContain(`${SKILLS}: AWS, RAG`);
  });

  it("applies bullet fixes and keywords together", () => {
    const draft = buildCvDraft({
      cvText: CV,
      bullets: BULLETS,
      edits: { [BULLETS[1].original]: "Cut redundant API calls by 30%" },
      added: new Set(["AWS"]),
      skillsLabel: SKILLS,
    });
    expect(draft).toContain("Cut redundant API calls by 30%");
    expect(draft).toContain(`${SKILLS}: AWS`);
    expect(draft).not.toContain("TanStack Query");
  });

  it("is pure: same input, same draft", () => {
    const args = {
      cvText: CV,
      bullets: BULLETS,
      edits: { [BULLETS[0].original]: "Migrated billing" },
      added: new Set(["AWS"]),
      skillsLabel: SKILLS,
    };
    expect(buildCvDraft(args)).toBe(buildCvDraft(args));
  });
});

describe("draftChangedLines", () => {
  it("returns the replacement texts, which is what the document marks", () => {
    expect(
      draftChangedLines(BULLETS, {
        [BULLETS[0].original]: "  Migrated the billing service  ",
        [BULLETS[1].original]: "",
      }),
    ).toEqual(["Migrated the billing service"]);
  });

  it("is empty when nothing is really fixed", () => {
    expect(draftChangedLines(BULLETS, {})).toEqual([]);
    expect(draftChangedLines(BULLETS, { [BULLETS[0].original]: BULLETS[0].original })).toEqual([]);
  });

  it("returns text the rendered line CONTAINS, so bulleted lines still match", () => {
    // buildCvDraft swaps the bullet body and leaves the "• " marker, so the
    // panel matches by containment. This locks the contract between the two.
    const [changed] = draftChangedLines(BULLETS, {
      [BULLETS[0].original]: "Migrated the billing service",
    });
    const renderedLine = `• ${"Migrated the billing service"}`;
    expect(renderedLine.includes(changed)).toBe(true);
  });
});

describe("countDraftChanges", () => {
  it("counts real bullet fixes plus ticked keywords", () => {
    expect(countDraftChanges(BULLETS, {}, new Set())).toBe(0);
    expect(
      countDraftChanges(
        BULLETS,
        { [BULLETS[0].original]: "Migrated billing", [BULLETS[1].original]: "" },
        new Set(["AWS", "RAG"]),
      ),
    ).toBe(3); // 1 real fix + 2 keywords; the empty edit does not count
  });
});
