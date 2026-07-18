import { describe, expect, it } from "vitest";

import type { AnalysisResult, CvQuality, Issue } from "../components/types";
import { checkAuditConsistency } from "./audit-consistency";

const GOOD_QUALITY: CvQuality = {
  overall: 62,
  clarity: 70,
  impact: 40,
  hard_skills: 60,
  soft_skills: 55,
  consistency: 70,
  ats_format: 80,
};

/** Minimal payload — the checker only reads cv_quality, ats_audit, audit.cv.issues. */
function result(over: Record<string, unknown> = {}): AnalysisResult {
  return {
    cv_quality: GOOD_QUALITY,
    audit: { cv: { score: 55, strengths: [], issues: [] } },
    ...over,
  } as unknown as AnalysisResult;
}

function issue(what: string, why = ""): Issue {
  return { severity: "critical", category: "impact", what, why };
}

describe("checkAuditConsistency", () => {
  it("a coherent payload returns no inconsistencies", () => {
    expect(checkAuditConsistency(result())).toEqual([]);
  });

  it("flags an overall that sits far from its dimension mean (the 15-vs-62 bug)", () => {
    const r = result({ cv_quality: { ...GOOD_QUALITY, overall: 15 } });
    const found = checkAuditConsistency(r);
    expect(found.map((f) => f.code)).toContain("overall_vs_dimensions");
    expect(found.find((f) => f.code === "overall_vs_dimensions")?.severity).toBe("error");
  });

  it("allows an overall within tolerance of the mean", () => {
    // mean of the six is ~62.5; 50 is within 15 pts.
    const r = result({ cv_quality: { ...GOOD_QUALITY, overall: 50 } });
    expect(checkAuditConsistency(r)).toEqual([]);
  });

  it("flags an out-of-range score", () => {
    const r = result({ cv_quality: { ...GOOD_QUALITY, impact: 140 } });
    expect(checkAuditConsistency(r).map((f) => f.code)).toContain("dimension_out_of_range");
  });

  it("flags ATS scored two ways that diverge wildly", () => {
    const r = result({
      cv_quality: { ...GOOD_QUALITY, ats_format: 80 },
      ats_audit: { score: 40, issues: [] },
    });
    expect(checkAuditConsistency(r).map((f) => f.code)).toContain("ats_score_divergence");
  });

  it("flags a 'no quantified outcomes' finding when the scorecard measured numbers", () => {
    const cv = [
      "Increased serviceable yield by 18% across 1,200 blades in 2023.",
      "Led a team of 6 engineers, cutting cycle time by 30 days.",
      "Closed 45 CAPA actions within a 14-day average.",
    ].join("\n");
    const r = result({
      audit: {
        cv: {
          score: 55,
          strengths: [],
          issues: [issue("Zero quantified outcomes across all roles", "no yield, defect rate or metric appears anywhere")],
        },
      },
    });
    const found = checkAuditConsistency(r, cv);
    expect(found.map((f) => f.code)).toContain("quantified_claim_contradiction");
  });

  it("does not fire the quantified check when the CV genuinely has no numbers", () => {
    const cv = [
      "Carried out overhaul operations on compressor blades.",
      "Handled documentation to support component release.",
      "Contributed to audits and root cause investigations.",
    ].join("\n");
    const r = result({
      audit: {
        cv: {
          score: 55,
          strengths: [],
          issues: [issue("Zero quantified outcomes across all roles", "no metric anywhere")],
        },
      },
    });
    expect(checkAuditConsistency(r, cv).map((f) => f.code)).not.toContain(
      "quantified_claim_contradiction",
    );
  });

  it("skips cv_quality checks entirely when it is absent (vs-JD analyses)", () => {
    const r = { audit: { cv: { score: 55, strengths: [], issues: [] } } } as unknown as AnalysisResult;
    expect(checkAuditConsistency(r)).toEqual([]);
  });
});
