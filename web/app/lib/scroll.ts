/**
 * Motion-aware scrolling.
 *
 * `scrollIntoView({ behavior: "smooth" })` ignores the OS "reduce motion"
 * setting, so long animated scrolls still fire for users who asked for none.
 * These helpers downgrade to an instant jump in that case.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollIntoViewMotionSafe(
  el: Element | null | undefined,
  options: Omit<ScrollIntoViewOptions, "behavior"> = {},
): void {
  if (!el) return;
  el.scrollIntoView({
    ...options,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
