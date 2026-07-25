import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { DeleteAccountUseCase } from './delete-account.use-case';

/**
 * Account lifecycle. Currently just deletion, which the settings screen has been
 * calling against a route that did not exist.
 */
@Module({
  controllers: [AccountController],
  providers: [DeleteAccountUseCase],
})
export class AccountModule {}
