import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { StripeModule } from '../stripe/stripe.module';
import { SocialModule } from '../social/social.module';

import {
  ANALYSIS_REPOSITORY,
  CLAUDE_PROVIDER,
  GITHUB_PROVIDER,
  PDF_PARSER,
  PROFILE_REPOSITORY,
  SAVED_CV_REPOSITORY,
} from './ports/tokens';

import { PrismaAnalysisRepository } from './infrastructure/prisma-analysis.repository';
import { PrismaProfileRepository } from './infrastructure/prisma-profile.repository';
import { PrismaSavedCvRepository } from './infrastructure/prisma-saved-cv.repository';
import { AnthropicClaudeProvider } from './infrastructure/anthropic-claude.provider';
import { GithubHttpProvider } from './infrastructure/github-http.provider';
import { PdfParseParser } from './infrastructure/pdf-parse.parser';

import { AnalyzeCvUseCase } from './application/analyze-cv.use-case';
import { RewriteCvUseCase } from './application/rewrite-cv.use-case';
import { GenerateCoverLetterUseCase } from './application/generate-cover-letter.use-case';
import { ListHistoryUseCase } from './application/list-history.use-case';
import { GetAnalysisUseCase } from './application/get-analysis.use-case';
import { DeleteAnalysisUseCase } from './application/delete-analysis.use-case';
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
  imports: [StripeModule, SocialModule],
  controllers: [AnalyzeController],
  providers: [
    { provide: ANALYSIS_REPOSITORY, useClass: PrismaAnalysisRepository },
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
    { provide: SAVED_CV_REPOSITORY, useClass: PrismaSavedCvRepository },
    { provide: CLAUDE_PROVIDER, useClass: AnthropicClaudeProvider },
    { provide: GITHUB_PROVIDER, useClass: GithubHttpProvider },
    { provide: PDF_PARSER, useClass: PdfParseParser },

    AnalyzeCvUseCase,
    RewriteCvUseCase,
    GenerateCoverLetterUseCase,
    ListHistoryUseCase,
    GetAnalysisUseCase,
    DeleteAnalysisUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    ListSavedCvsUseCase,
    AddSavedCvUseCase,
    RemoveSavedCvUseCase,
  ],
})
export class AnalyzeModule {}
