import { describe, expect, it } from "vitest";

import {
  explainOverall,
  explainOverallLegacy,
  hardSignalCountsFromResult,
} from "./cv-quality-score";

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
    expect(b.deflated).toBeCloseTo(55.3715, 3);
    expect(b.penalty).toBe(0);
    expect(b.overall).toBe(55);
  });

  it("subtracts capped hard-signal penalties: the 45 case", () => {
    const b = explainOverall(SUBS, { redFlagCount: 3, criticalIssueCount: 2, fatalBulletCount: 3 });
    // These counts ARE the production median, so this case is the typical CV,
    // not a pathological one: 3+2+3 = 8 points, where the pre-2026-07-24 costs
    // charged it 24 of a 29-point cap and dragged the same CV down to 15.
    expect(b.penalty).toBe(8);
    expect(b.penaltyParts).toEqual({ redFlags: 3, criticalIssues: 2, fatalBullets: 3 });
    expect(b.overall).toBe(45);
  });

  it("caps each penalty component so a noisy list can't dominate", () => {
    const b = explainOverall(SUBS, { redFlagCount: 99, criticalIssueCount: 99, fatalBulletCount: 99 });
    expect(b.penaltyParts).toEqual({ redFlags: 4, criticalIssues: 3, fatalBullets: 3 });
    // Even fully saturated the penalty cannot floor a mid CV.
    expect(b.overall).toBeGreaterThan(0);
  });

  it("stays in lockstep with the backend anchor", () => {
    // This file is a hand-maintained MIRROR of compose-cv-review-score.ts. If
    // these constants drift, the report's "how it lands" breakdown starts lying
    // about a score it did not compute. Locked here so a one-sided edit fails.
    const b = explainOverall(
      { clarity: 60, impact: 60, hard_skills: 60, soft_skills: 60, consistency: 60, ats_format: 60 },
      { redFlagCount: 0, criticalIssueCount: 0, fatalBulletCount: 0 },
    );
    expect(b.overall).toBe(55); // identical assertion lives in the backend spec
  });
});

describe("explainOverallLegacy", () => {
  it("reproduces the pre-2026-07-24 curve, so the guard can recognise old rows", () => {
    // Same inputs as "the 45 case" above, scored the old way: deflation 0.85 and
    // penalties 4/3/2 capped 12/9/8 -> 24 points -> 15.
    const legacy = explainOverallLegacy(SUBS, {
      redFlagCount: 3,
      criticalIssueCount: 2,
      fatalBulletCount: 3,
    });
    expect(legacy).toBe(15);
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
