import { Controller, Delete, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { AuthSub } from '../auth/auth-sub.decorator';

@Controller('api/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @UseGuards(SupabaseGuard)
  @Delete()
  async deleteAccount(@AuthEmail() email: string, @AuthSub() sub: string) {
    return this.accountService.deleteAccount(email, sub);
  }
}
