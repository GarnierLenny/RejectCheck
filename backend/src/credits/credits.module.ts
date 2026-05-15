import { Module } from '@nestjs/common';
import { CREDIT_LEDGER_REPOSITORY } from './ports/tokens';
import { PrismaCreditLedgerRepository } from './infrastructure/prisma-credit-ledger.repository';

/**
 * Autonomous bounded context for one-time analysis credits.
 *
 * Imported by AnalyzeModule (consume on quota overflow) and StripeModule
 * (grant on credit purchase webhook). Exporting the port token avoids a
 * circular dependency between AnalyzeModule and StripeModule.
 */
@Module({
  providers: [
    {
      provide: CREDIT_LEDGER_REPOSITORY,
      useClass: PrismaCreditLedgerRepository,
    },
  ],
  exports: [CREDIT_LEDGER_REPOSITORY],
})
export class CreditsModule {}
