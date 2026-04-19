import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyzeModule } from './analyze/analyze.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { StripeModule } from './stripe/stripe.module';
import { InterviewModule } from './interview/interview.module';
import { AccountModule } from './account/account.module';
import { ApplicationsModule } from './applications/applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    AnalyzeModule,
    WaitlistModule,
    StripeModule,
    InterviewModule,
    AccountModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
