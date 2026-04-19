import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  async deleteAccount(email: string, sub: string) {
    // 1. Delete applications
    await (this.prisma as any).application.deleteMany({ where: { email } });

    // 2. Delete interview attempts
    await (this.prisma as any).interviewAttempt.deleteMany({ where: { email } });

    // 3. Delete analyses
    await (this.prisma as any).analysis.deleteMany({ where: { email } });

    // 4. Delete profile
    await (this.prisma as any).profile.deleteMany({ where: { email } });

    // 5. Cancel Stripe subscription and delete from DB
    const sub_ = await this.prisma.subscription.findUnique({ where: { email } });
    if (sub_?.stripeCustomerId) {
      try {
        const activeSubs = await this.stripeService.getActiveSubscriptions(sub_.stripeCustomerId);
        for (const s of activeSubs) {
          await this.stripeService.cancelSubscription(s);
        }
      } catch { /* ignore Stripe errors on deletion */ }
    }
    await this.prisma.subscription.deleteMany({ where: { email } });

    // 6. Delete Supabase auth user
    const supabaseUrl = this.config.get<string>('SUPABASE_URL')!;
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (serviceRoleKey) {
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await admin.auth.admin.deleteUser(sub);
    }

    return { success: true };
  }
}
