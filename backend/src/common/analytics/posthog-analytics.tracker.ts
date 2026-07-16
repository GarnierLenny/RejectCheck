import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';
import type {
  AnalyticsTracker,
  AnalyticsEvent,
} from '../ports/analytics.tracker';

/**
 * PostHog-backed server-side tracker. Emits paid-conversion events from the
 * Stripe webhook (subscription_started, sprint_pass_purchased,
 * credit_pack_purchased), the one place a settled payment is known.
 *
 * Optional infra: when POSTHOG_PROJECT_TOKEN is unset the tracker is a no-op,
 * so the backend boots and tests run without PostHog. `capture` never throws
 * into the caller — analytics must not break a webhook.
 */
@Injectable()
export class PosthogAnalyticsTracker
  implements AnalyticsTracker, OnModuleDestroy
{
  private readonly logger = new Logger(PosthogAnalyticsTracker.name);
  private readonly client: PostHog | null;

  constructor(config: ConfigService) {
    const token = config.get<string>('POSTHOG_PROJECT_TOKEN');
    if (!token) {
      this.client = null;
      this.logger.log(
        'PostHog analytics disabled (POSTHOG_PROJECT_TOKEN unset)',
      );
      return;
    }
    this.client = new PostHog(token, {
      host: config.get<string>('POSTHOG_HOST'),
      // Flush each event immediately: server-side captures are low-volume
      // (payments) and should leave before the request ends.
      flushAt: 1,
      flushInterval: 0,
    });
  }

  capture({ event, distinctId, properties }: AnalyticsEvent): void {
    if (!this.client) return;
    try {
      this.client.capture({ distinctId, event, properties });
    } catch (err) {
      this.logger.warn(`capture failed for event=${event}: ${String(err)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.shutdown();
  }
}
