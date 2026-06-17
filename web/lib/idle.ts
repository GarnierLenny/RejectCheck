// Run a callback when the browser is idle (after the critical render/hydration
// window), falling back to a near-immediate timeout where requestIdleCallback
// isn't available. SSR-safe: runs synchronously on the server.
export function whenIdle(cb: () => void): void {
  if (typeof window === "undefined") {
    cb();
    return;
  }
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") ric(cb, { timeout: 3000 });
  else setTimeout(cb, 1);
}
