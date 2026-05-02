import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { GetUserXpUseCase } from './application/get-user-xp.use-case';
import { GetLedgerUseCase } from './application/get-ledger.use-case';
import { GetRewardsUseCase } from './application/get-rewards.use-case';

@ApiTags('XP')
@Controller('api/xp')
export class XpController {
  constructor(
    private readonly getUserXp: GetUserXpUseCase,
    private readonly getLedger: GetLedgerUseCase,
    private readonly getRewards: GetRewardsUseCase,
  ) {}

  @Get('me')
  @UseGuards(SupabaseGuard)
  @ApiOperation({
    summary: 'Get the current user XP / level / tier progress',
  })
  async me(@AuthEmail() email: string) {
    return this.getUserXp.execute(email);
  }

  @Get('ledger')
  @UseGuards(SupabaseGuard)
  @ApiOperation({ summary: 'Recent XP transactions for the current user' })
  async ledger(
    @AuthEmail() email: string,
    @Query('limit') limit?: string,
  ) {
    const lim = limit ? Math.min(200, parseInt(limit, 10) || 50) : 50;
    return this.getLedger.execute(email, lim);
  }

  @Get('rewards')
  @UseGuards(SupabaseGuard)
  @ApiOperation({
    summary: 'All tier rewards with unlock/redeem status for the current user',
  })
  async rewards(@AuthEmail() email: string) {
    return this.getRewards.execute(email);
  }
}
