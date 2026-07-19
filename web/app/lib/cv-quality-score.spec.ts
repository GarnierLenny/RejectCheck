import { describe, expect, it } from "vitest";

import { explainOverall, hardSignalCountsFromResult } from "./cv-quality-score";

const SUBS = {
  clarity: 70,
  impact: 40,
  hard_skills: 60,
  soft_skills: 55,
  consistency: 70,
  ats_format: 80,
};

describe("explainOverall", () => {
  it("weight-averages, deflates, then quantizes (no penalties)", () => {
    const b = explainOverall(SUBS, { redFlagCount: 0, criticalIssueCount: 0, fatalBulletCount: 0 });
    expect(b.weightedAverage).toBeCloseTo(59, 5);
    expect(b.deflated).toBeCloseTo(38.4385, 3);
    expect(b.penalty).toBe(0);
    expect(b.overall).toBe(40);
  });

  it("subtracts capped hard-signal penalties: the 15 case", () => {
    const b = explainOverall(SUBS, { redFlagCount: 3, criticalIssueCount: 2, fatalBulletCount: 3 });
    // red flags 3*4 capped 12, critical 2*3=6, fatal 3*2=6 -> 24 total.
    expect(b.penalty).toBe(24);
    expect(b.penaltyParts).toEqual({ redFlags: 12, criticalIssues: 6, fatalBullets: 6 });
    expect(b.overall).toBe(15);
  });

  it("caps each penalty component so a noisy list can't dominate", () => {
    const b = explainOverall(SUBS, { redFlagCount: 99, criticalIssueCount: 99, fatalBulletCount: 99 });
    expect(b.penaltyParts).toEqual({ redFlags: 12, criticalIssues: 9, fatalBullets: 8 });
  });
});

describe("hardSignalCountsFromResult", () => {
  it("counts red flags, critical issues across sources + cross-profile, and fatal bullets", () => {
    const counts = hardSignalCountsFromResult({
      hidden_red_flags: [{}, {}],
      cross_profile_inconsistencies: [{ severity: "critical" }, { severity: "major" }],
      audit: {
        cv: { issues: [{ severity: "critical" }, { severity: "minor" }] },
        github: { issues: [{ severity: "critical" }] },
        linkedin: { issues: [] },
      },
      bullet_reviews: { bullets: [{ verdict: "fatal" }, { verdict: "weak" }, { verdict: "fatal" }] },
    });
    expect(counts).toEqual({ redFlagCount: 2, criticalIssueCount: 3, fatalBulletCount: 2 });
  });

  it("is defensive against missing fields", () => {
    expect(hardSignalCountsFromResult({})).toEqual({
      redFlagCount: 0,
      criticalIssueCount: 0,
      fatalBulletCount: 0,
    });
  });
});
