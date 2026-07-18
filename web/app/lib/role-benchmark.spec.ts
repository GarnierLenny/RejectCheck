import { describe, expect, it } from "vitest";

import { resolveRoleFamily } from "./role-benchmark";

describe("resolveRoleFamily", () => {
  it("maps an aerospace quality engineer to engineering, not finance", () => {
    // Regression: 'auditor' (a finance cue) used to win by list order even
    // though the CV screams engineering on several signals.
    expect(
      resolveRoleFamily(["Quality Engineer", "Quality Assurance Engineer", "aerospace", "manufacturing"]),
    ).toBe("engineering");
  });

  it("a single incidental finance cue does not outrank a richer family match", () => {
    expect(resolveRoleFamily(["Quality Auditor", "aerospace", "aviation"])).toBe("engineering");
  });

  it("still resolves genuine finance roles", () => {
    expect(resolveRoleFamily(["Financial Analyst", "investment banking"])).toBe("finance");
  });

  it("still resolves software roles", () => {
    expect(resolveRoleFamily(["Backend Developer", "software"])).toBe("software");
  });

  it("returns null when no cue matches (confidence gate)", () => {
    expect(resolveRoleFamily(["Astronaut", "wizard"])).toBeNull();
    expect(resolveRoleFamily([])).toBeNull();
  });
});
