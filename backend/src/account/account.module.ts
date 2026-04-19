import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [PrismaModule, StripeModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
