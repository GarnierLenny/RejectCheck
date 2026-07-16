import { Global, Module } from '@nestjs/common';
import { ANALYTICS_TRACKER } from '../ports/tokens';
import { PosthogAnalyticsTracker } from './posthog-analytics.tracker';

/**
 * Global analytics: exposes ANALYTICS_TRACKER so any module can emit
 * server-side events without wiring its own provider. PostHog-backed, or a
 * no-op when POSTHOG_PROJECT_TOKEN is unset (see PosthogAnalyticsTracker).
 */
@Global()
@Module({
  providers: [
    { provide: ANALYTICS_TRACKER, useClass: PosthogAnalyticsTracker },
  ],
  exports: [ANALYTICS_TRACKER],
})
export class AnalyticsModule {}
