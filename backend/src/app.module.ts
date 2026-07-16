import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyzeModule } from './analyze/analyze.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { StripeModule } from './stripe/stripe.module';
import { RevenueCatModule } from './revenuecat/revenuecat.module';
import { MeModule } from './me/me.module';
import { InterviewModule } from './interview/interview.module';
import { ApplicationsModule } from './applications/applications.module';
import { ChallengeModule } from './challenge/challenge.module';
import { PublicProfileModule } from './public-profile/public-profile.module';
import { SocialModule } from './social/social.module';
import { XpModule } from './xp/xp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './common/analytics/analytics.module';
import { validateEnv } from './common/env.schema';
import { AppThrottlerModule } from './common/throttler.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validate: validateEnv,
    }),
    AppThrottlerModule,
    PrismaModule,
    AnalyzeModule,
    WaitlistModule,
    StripeModule,
    RevenueCatModule,
    MeModule,
    InterviewModule,
    ApplicationsModule,
    ChallengeModule,
    PublicProfileModule,
    SocialModule,
    XpModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
