"use client";

import { useEffect } from "react";

/**
 * Runs `reset` when the page is restored from the back/forward cache.
 *
 * Checkout buttons deliberately keep their pending state through the redirect
 * to Stripe (clearing it would flash the button back to idle mid-navigation).
 * Safari and Firefox then restore this exact DOM when the user presses Back
 * from Stripe, leaving the buttons disabled and reading "Processing" until a
 * hard reload. This gives them a chance to snap out of it.
 */
export function useBfcacheReset(reset: () => void): void {
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reset();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  });
}
