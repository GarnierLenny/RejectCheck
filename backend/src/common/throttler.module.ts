import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Default: 60 req / minute / IP. Override per-route with @Throttle() / @SkipThrottle().
// Stripe webhook MUST be exempted via @SkipThrottle() at the controller level —
// Stripe does not retry indefinitely and signature verification already protects it.
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 60,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppThrottlerModule {}
