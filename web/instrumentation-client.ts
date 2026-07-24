import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Defer SENTRY init off the critical hydration path so it doesn't run during the
// LCP / first-interaction window (better INP/TBT). Errors are caught from idle
// onward. Imports stay top-level (the export below must resolve synchronously);
// only the heavy init() work is scheduled at idle.
//
// PostHog is NO LONGER deferred — see initPostHog below for why.
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

/**
 * EAGER on purpose. This used to run inside whenIdle() alongside Sentry, i.e.
 * `requestIdleCallback(..., { timeout: 3000 })`, which meant that on a busy page
 * PostHog could stay uninitialised for up to three seconds. Every
 * `posthog.capture()` fired in that window is dropped silently, because captures
 * before init have nowhere to queue.
 *
 * That window is exactly where the most important events live: `user_signed_up`
 * fires right after the OAuth redirect, on a fresh, hydrating page. Measured
 * 2026-07-24 against the database: 33 real signups over 14 days produced ONE
 * `user_signed_up` event. Same story for analysis submissions.
 *
 * Deferring bought almost nothing anyway. The `import posthog from "posthog-js"`
 * above is top-level, so the bundle is already downloaded and parsed regardless;
 * postponing init() only delays a config fetch and the first pageview beacon,
 * neither of which blocks rendering. Losing three seconds of events to save that
 * is a bad trade. Sentry, which does meaningful work at init, stays deferred.
 */
initPostHog();

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
});

function initPostHog(): void {
  // NEXT_PUBLIC_* values are inlined at BUILD time, so a token added to the
  // deploy env only starts capturing after a fresh production build/redeploy.
  // Guard the init: posthog.init(undefined) silently accepts a bogus token and
  // drops every event, which is exactly how a project goes "dark" with no error.
  const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

  // .env.local carries the PRODUCTION token, so without this every `npm run dev`
  // session wrote into the production project. Measured 2026-07-24: localhost
  // accounted for 1812 of ~2400 events over 14 days, about 76%, which buried the
  // 38 real users under three times as much of our own traffic and made every
  // funnel unreadable. That is why analytics looked broken while capture was
  // working perfectly.
  //
  // Keyed on hostname rather than NODE_ENV on purpose: `next build && next start`
  // runs locally in production mode and would otherwise still pollute. Set
  // NEXT_PUBLIC_POSTHOG_ALLOW_LOCAL=true to opt a local session back in when
  // deliberately debugging analytics.
  const host = typeof window === "undefined" ? "" : window.location.hostname;
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".local");
  const allowLocal = process.env.NEXT_PUBLIC_POSTHOG_ALLOW_LOCAL === "true";

  if (isLocal && !allowLocal) {
    console.info(
      "[posthog] local host detected — analytics disabled so dev traffic stays out of the production project. Set NEXT_PUBLIC_POSTHOG_ALLOW_LOCAL=true to override.",
    );
  } else if (posthogToken) {
    posthog.init(posthogToken, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[posthog] NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN missing — analytics disabled locally.",
    );
  }
}

// Must stay a synchronous export — Next calls it on router transitions. It's a
// safe no-op until Sentry.init() runs at idle (PostHog is already up by now).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
