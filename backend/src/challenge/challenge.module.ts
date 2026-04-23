import { Module } from '@nestjs/common';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { GeminiService } from './gemini.service';
import { ClaudeService } from './claude.service';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [StripeModule],
  controllers: [ChallengeController],
  providers: [ChallengeService, GeminiService, ClaudeService],
  exports: [ChallengeService, GeminiService, ClaudeService],
})
export class ChallengeModule {}
