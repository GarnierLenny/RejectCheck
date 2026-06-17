import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Defer telemetry init off the critical hydration path so it doesn't run during
// the LCP / first-interaction window (better INP/TBT). PostHog still captures the
// initial pageview on init; Sentry catches errors from idle onward. Imports stay
// top-level (the export below must resolve synchronously); only the heavy init()
// work is scheduled at idle.
function whenIdle(cb: () => void): void {
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

whenIdle(() => {
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
});

// Must stay a synchronous export — Next calls it on router transitions. It's a
// safe no-op until Sentry.init() runs at idle.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
