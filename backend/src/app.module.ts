import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyzeModule } from './analyze/analyze.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { StripeModule } from './stripe/stripe.module';
import { InterviewModule } from './interview/interview.module';
import { ApplicationsModule } from './applications/applications.module';
import { ChallengeModule } from './challenge/challenge.module';
import { PublicProfileModule } from './public-profile/public-profile.module';
import { SocialModule } from './social/social.module';
import { validateEnv } from './common/env.schema';
import { AppThrottlerModule } from './common/throttler.module';

@Module({
  imports: [
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
    InterviewModule,
    ApplicationsModule,
    ChallengeModule,
    PublicProfileModule,
    SocialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
