import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.RAILWAY_GIT_COMMIT_SHA,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Do NOT auto-attach PII: with this on, Sentry ships request headers
    // (including `Authorization: Bearer <JWT>`), cookies and client IP with
    // every event. Guards still call Sentry.setUser({ id, email }) explicitly
    // for triage, which is the only user identifier we intentionally send.
    sendDefaultPii: false,
  });
}
