import { describe, expect, it } from "vitest";

import type { BulletReviewItem, ExperienceAnalysis } from "../components/types";
import { attributeBulletsToRoles } from "./experience-bullets";

function role(company: string, title: string): ExperienceAnalysis {
  return {
    company,
    title,
    start: "2020-01",
    end: "present",
    sources: ["cv"],
    seniority_read: "mid",
    seniority_alignment: "matches_title",
    ratings: { scope: 3, ownership: 3, impact: 3 },
    hard_skills: [],
    soft_skills: [],
    findings: [],
    margin_note: "",
  };
}

function bullet(original: string, verdict: BulletReviewItem["verdict"]): BulletReviewItem {
  return { original, section: "experience", verdict, flags: [], why: "", rewrite: null };
}

const CV = [
  "Jane Doe",
  "Experience",
  "",
  "Senior Engineer — Acme Corp",
  "- Led migration of the payments stack to Kubernetes",
  "- Responsible for various tasks on the platform",
  "",
  "Developer — Globex",
  "- Worked on stuff",
  "",
  "Education",
  "MSc Computer Science",
].join("\n");

describe("attributeBulletsToRoles", () => {
  it("clean match: tallies bullets per role by text position", () => {
    const roles = [role("Acme Corp", "Senior Engineer"), role("Globex", "Developer")];
    const bullets = [
      bullet("Led migration of the payments stack to Kubernetes", "strong"),
      bullet("Responsible for various tasks on the platform", "weak"),
      bullet("Worked on stuff", "fatal"),
    ];
    expect(attributeBulletsToRoles(CV, roles, bullets)).toEqual([
      { strong: 1, weak: 1, fatal: 0 },
      { strong: 0, weak: 0, fatal: 1 },
    ]);
  });

  it("matching is case- and whitespace-insensitive", () => {
    const roles = [role("ACME CORP", "senior engineer")];
    const bullets = [bullet("led   migration of the payments stack to Kubernetes", "strong")];
    expect(attributeBulletsToRoles(CV, roles, bullets)).toEqual([
      { strong: 1, weak: 0, fatal: 0 },
    ]);
  });

  it("duplicate company+title roles are ambiguous and resolve to null", () => {
    const cv = [
      "Consultant — Freelance",
      "- Shipped the first engagement",
      "Developer — Globex",
      "- Worked on stuff",
      "Consultant — Freelance",
      "- Shipped the second engagement",
    ].join("\n");
    const roles = [
      role("Freelance", "Consultant"),
      role("Globex", "Developer"),
      role("Freelance", "Consultant"),
    ];
    const bullets = [
      bullet("Shipped the first engagement", "strong"),
      bullet("Worked on stuff", "weak"),
      bullet("Shipped the second engagement", "strong"),
    ];
    const tallies = attributeBulletsToRoles(cv, roles, bullets);
    expect(tallies[0]).toBeNull();
    expect(tallies[2]).toBeNull();
    // The unambiguous role in between still gets its tally... including the
    // trailing duplicate-role bullet that falls into its span (known
    // over-attribution, acceptable for a display-only tally).
    expect(tallies[1]).toEqual({ strong: 1, weak: 1, fatal: 0 });
  });

  it("cvText null resolves every role to null", () => {
    const roles = [role("Acme Corp", "Senior Engineer"), role("Globex", "Developer")];
    expect(attributeBulletsToRoles(null, roles, [bullet("Worked on stuff", "weak")])).toEqual([
      null,
      null,
    ]);
  });

  it("missing bullets resolve every role to null (nothing to tally)", () => {
    const roles = [role("Acme Corp", "Senior Engineer")];
    expect(attributeBulletsToRoles(CV, roles, undefined)).toEqual([null]);
    expect(attributeBulletsToRoles(CV, roles, [])).toEqual([null]);
  });

  it("role anchor not found resolves that role to null, others still tally", () => {
    const roles = [role("Acme Corp", "Senior Engineer"), role("Initech", "TPS Analyst")];
    const bullets = [bullet("Led migration of the payments stack to Kubernetes", "strong")];
    expect(attributeBulletsToRoles(CV, roles, bullets)).toEqual([
      { strong: 1, weak: 0, fatal: 0 },
      null,
    ]);
  });

  it("bullets before the first anchor or absent from the text are skipped", () => {
    const roles = [role("Globex", "Developer")];
    const bullets = [
      // Belongs to Acme, which is before the Globex anchor → skipped.
      bullet("Led migration of the payments stack to Kubernetes", "strong"),
      bullet("This bullet is not in the CV at all", "fatal"),
      bullet("Worked on stuff", "weak"),
    ];
    expect(attributeBulletsToRoles(CV, roles, bullets)).toEqual([
      { strong: 0, weak: 1, fatal: 0 },
    ]);
  });
});
