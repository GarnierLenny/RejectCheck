"use client";

import { useEffect, useState } from "react";

/**
 * Rolls the number from `from` to `to` once on reveal, so a re-scan result lands
 * as a movement, not a silent swap (Move B / B4). Reduced-motion and no-change
 * both snap straight to `to` (deferred into a frame so the update never runs
 * synchronously in the effect body). Shared by both re-scan flows.
 */
export function AnimatedScore({ from, to }: { from: number; to: number }) {
  const [n, setN] = useState(from);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from === to) {
      const id = requestAnimationFrame(() => setN(to));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const dur = 900;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to]);
  return <>{n}</>;
}
