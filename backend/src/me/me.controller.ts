import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { GetEntitlementUseCase } from './application/get-entitlement.use-case';

@Controller('api/me')
export class MeController {
  constructor(private readonly getEntitlement: GetEntitlementUseCase) {}

  /**
   * The authenticated user's effective entitlement across every billing
   * provider (Stripe web + RevenueCat mobile). Read by the web and mobile
   * paywalls as the single source of truth for "what is this user allowed to do".
   */
  @UseGuards(SupabaseGuard)
  @Get('entitlement')
  async entitlement(@AuthEmail() email: string) {
    return this.getEntitlement.execute(email);
  }
}
