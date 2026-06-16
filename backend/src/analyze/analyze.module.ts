import { Module, Provider } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { ShareController } from './share.controller';
import { StripeModule } from '../stripe/stripe.module';
import { SocialModule } from '../social/social.module';
import { ChallengeModule } from '../challenge/challenge.module';
import { QueueModule } from '../queue/queue.module';
import { LlmJobsService } from '../queue/llm-jobs.service';
import { QUEUE_ENABLED } from '../queue/queue.constants';
import { CreditsModule } from '../credits/credits.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaimAnalysisUseCase } from './application/claim-analysis.use-case';
import { AnalysisCleanupCron } from './infrastructure/analysis-cleanup.cron';
import { DeepAnalysisProcessor } from './infrastructure/queue/deep-analysis.processor';
import { NegotiationProcessor } from './infrastructure/queue/negotiation.processor';

// BullMQ processors create live Worker instances on module init — they only
// boot safely when the BullModule (and therefore Redis) is wired. Skip
// registration when REDIS_URL is unset; the LlmJobsService falls back to
// in-process execution via setImmediate.
const queueProviders: Provider[] = QUEUE_ENABLED
  ? [DeepAnalysisProcessor, NegotiationProcessor]
  : [];

import {
  ANALYSIS_REPOSITORY,
  CLAUDE_PROVIDER,
  DIGEST_REPOSITORY,
  GITHUB_PROVIDER,
  PDF_PARSER,
  PORTFOLIO_SCRAPER,
  PROFILE_REPOSITORY,
  SAVED_CV_REPOSITORY,
} from './ports/tokens';

import { PrismaAnalysisRepository } from './infrastructure/prisma-analysis.repository';
import { PrismaDigestRepository } from './infrastructure/prisma-digest.repository';
import { PrismaProfileRepository } from './infrastructure/prisma-profile.repository';
import { PrismaSavedCvRepository } from './infrastructure/prisma-saved-cv.repository';
import { AnthropicClaudeProvider } from './infrastructure/anthropic-claude.provider';
import { GithubHttpProvider } from './infrastructure/github-http.provider';
import { JinaPortfolioScraper } from './infrastructure/jina-portfolio.scraper';
import { PdfParseParser } from './infrastructure/pdf-parse.parser';

import { AnalyzeCvUseCase } from './application/analyze-cv.use-case';
import { ReviewCvUseCase } from './application/review-cv.use-case';
import { GetQuotaSummaryUseCase } from './application/get-quota-summary.use-case';
import { RewriteCvUseCase } from './application/rewrite-cv.use-case';
import { GenerateCoverLetterUseCase } from './application/generate-cover-letter.use-case';
import { GenerateNegotiationUseCase } from './application/generate-negotiation.use-case';
import { GenerateProfileDigestUseCase } from './application/generate-profile-digest.use-case';
import { RegenerateDeepUseCase } from './application/regenerate-deep.use-case';
import { GenerateStarterRepoUseCase } from './application/generate-starter-repo.use-case';
import { GeminiStarterRepoProvider } from './infrastructure/gemini-starter-repo.provider';
import { ListHistoryUseCase } from './application/list-history.use-case';
import { GetAnalysisUseCase } from './application/get-analysis.use-case';
import { DeleteAnalysisUseCase } from './application/delete-analysis.use-case';
import { CreateShareTokenUseCase } from './application/create-share-token.use-case';
import { GetSharedAnalysisUseCase } from './application/get-shared-analysis.use-case';
import {
  GetProfileUseCase,
  UpdateProfileUseCase,
} from './application/profile.use-cases';
import {
  AddSavedCvUseCase,
  ListSavedCvsUseCase,
  RemoveSavedCvUseCase,
} from './application/saved-cv.use-cases';

// SUBSCRIPTION_GATE is provided by StripeModule (exported) and consumed via
// @Inject(SUBSCRIPTION_GATE) wherever needed in this module.
@Module({
  imports: [
    StripeModule,
    SocialModule,
    ChallengeModule,
    CreditsModule,
    NotificationsModule,
    QueueModule.register(),
  ],
  controllers: [AnalyzeController, ShareController],
  providers: [
    LlmJobsService,
    ...queueProviders,
    { provide: ANALYSIS_REPOSITORY, useClass: PrismaAnalysisRepository },
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
    { provide: SAVED_CV_REPOSITORY, useClass: PrismaSavedCvRepository },
    { provide: DIGEST_REPOSITORY, useClass: PrismaDigestRepository },
    { provide: CLAUDE_PROVIDER, useClass: AnthropicClaudeProvider },
    { provide: GITHUB_PROVIDER, useClass: GithubHttpProvider },
    { provide: PORTFOLIO_SCRAPER, useClass: JinaPortfolioScraper },
    { provide: PDF_PARSER, useClass: PdfParseParser },

    AnalyzeCvUseCase,
    ReviewCvUseCase,
    GetQuotaSummaryUseCase,
    RewriteCvUseCase,
    GenerateCoverLetterUseCase,
    GenerateNegotiationUseCase,
    GenerateProfileDigestUseCase,
    RegenerateDeepUseCase,
    ListHistoryUseCase,
    GetAnalysisUseCase,
    DeleteAnalysisUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    ClaimAnalysisUseCase,
    AnalysisCleanupCron,
    ListSavedCvsUseCase,
    AddSavedCvUseCase,
    RemoveSavedCvUseCase,
    CreateShareTokenUseCase,
    GetSharedAnalysisUseCase,
    GeminiStarterRepoProvider,
    GenerateStarterRepoUseCase,
  ],
})
export class AnalyzeModule {}
