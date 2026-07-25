import { describe, expect, it } from "vitest";

import {
  CORPUS_FAMILY_COUNT,
  CORPUS_TOTAL,
  QUANTIFIED_MEDIAN_RANGE,
  corpusFactFor,
  factFamilyLabel,
  factShareText,
} from "./corpus-facts";

describe("corpus constants", () => {
  it("derives the sample size from the corpus rather than hardcoding it", () => {
    // A hardcoded total is how a stat goes stale after a recalibration and keeps
    // circulating with the wrong n on it.
    expect(CORPUS_TOTAL).toBeGreaterThan(2000);
    expect(CORPUS_FAMILY_COUNT).toBe(14);
  });

  it("reports a plausible median range for quantified bullets", () => {
    expect(QUANTIFIED_MEDIAN_RANGE.min).toBeGreaterThan(0);
    expect(QUANTIFIED_MEDIAN_RANGE.max).toBeLessThan(50);
    expect(QUANTIFIED_MEDIAN_RANGE.min).toBeLessThan(QUANTIFIED_MEDIAN_RANGE.max);
  });
});

describe("corpusFactFor", () => {
  it("keys the fact to the resolved role family", () => {
    const f = corpusFactFor(["Senior Financial Analyst"]);
    expect(f.family).toBe("finance");
    expect(f.n).toBeGreaterThan(300);
    expect(f.p75QuantifiedPct).not.toBeNull();
  });

  it("falls back to a corpus-wide fact instead of going silent", () => {
    // Unlike the benchmark CLAIM (which asserts something about the user and must
    // stay quiet when unproven), this asserts something about the corpus, which
    // is true for everyone.
    const f = corpusFactFor([]);
    expect(f.family).toBeNull();
    expect(f.n).toBe(CORPUS_TOTAL);
    expect(f.p75QuantifiedPct).toBeNull();
  });

  it("falls back when the role cannot be placed", () => {
    // Deliberately free of any archetype cue. ("Technician" is not: it is a
    // trades cue, and the resolver is right to match it.)
    expect(corpusFactFor(["Zookeeper", "Lighthouse Keeper"]).family).toBeNull();
  });

  it("keeps the 1-in-N reading consistent with the percentage", () => {
    const f = corpusFactFor(["Backend Engineer"]);
    // ~13% quantified means roughly 1 bullet in 8, not 1 in 2 or 1 in 50.
    expect(f.oneInN).toBe(Math.round(100 / f.medianQuantifiedPct));
    expect(f.oneInN).toBeGreaterThanOrEqual(2);
  });
});

describe("factShareText", () => {
  it("always carries its sample size and attribution", () => {
    for (const hints of [["Financial Analyst"], []]) {
      for (const lang of ["en", "fr"] as const) {
        const text = factShareText(corpusFactFor(hints), lang);
        expect(text).toMatch(/n=\d+/);
        expect(text).toContain("rejectcheck.com");
      }
    }
  });

  it("does not claim these resumes failed", () => {
    // The corpus is typical resumes, NOT outcome-labelled. Any wording implying
    // rejection or causation would be a claim the data cannot support.
    const text = factShareText(corpusFactFor(["Designer"]), "en").toLowerCase();
    for (const forbidden of ["rejected", "failed", "got hired", "guarantee"]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("names the family in the family-specific variant", () => {
    const fact = corpusFactFor(["Financial Analyst"]);
    expect(factShareText(fact, "en")).toContain(factFamilyLabel(fact, "en"));
  });

  it("quotes the top quartile only when there is one", () => {
    expect(factShareText(corpusFactFor(["Financial Analyst"]), "en")).toContain(
      "top quartile",
    );
    expect(factShareText(corpusFactFor([]), "en")).not.toContain("top quartile");
  });
});
