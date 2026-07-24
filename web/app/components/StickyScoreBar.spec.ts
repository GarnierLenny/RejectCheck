import { describe, expect, it } from "vitest";

import { stickyScoreView } from "./StickyScoreBar";

/**
 * These exist because the risk/competitiveness polarity has been inverted in
 * this codebase before. `result.score` is RISK (higher = worse); the user always
 * sees COMPETITIVENESS (100 - risk). Lowering risk must read as the number going
 * UP. Verified, not re-reasoned.
 */
describe("stickyScoreView", () => {
  it("displays competitiveness, not the stored risk", () => {
    // Risk 90 is the screenshot case: the hero shows 10, WEAK.
    expect(stickyScoreView(90, null).current).toBe(10);
    expect(stickyScoreView(28, null).current).toBe(72);
  });

  it("treats FALLING risk as a RISING score", () => {
    // Risk 90 -> 66 is competitiveness 10 -> 34.
    const v = stickyScoreView(90, 66);
    expect(v.current).toBe(10);
    expect(v.projected).toBe(34);
    expect(v.improved).toBe(true);
    expect(v.delta).toBe(24);
  });

  it("does not claim an improvement when the draft makes things worse", () => {
    const v = stickyScoreView(60, 75); // competitiveness 40 -> 25
    expect(v.projected).toBe(25);
    expect(v.improved).toBe(false);
    expect(v.delta).toBe(0);
  });

  it("shows no projection when nothing is edited", () => {
    expect(stickyScoreView(90, null)).toEqual({
      current: 10,
      projected: null,
      improved: false,
      delta: 0,
    });
  });

  it("shows no projection when the draft changes nothing", () => {
    // Equal risk is not a change, and must not render an arrow to the same number.
    const v = stickyScoreView(90, 90);
    expect(v.projected).toBeNull();
    expect(v.improved).toBe(false);
  });
});
