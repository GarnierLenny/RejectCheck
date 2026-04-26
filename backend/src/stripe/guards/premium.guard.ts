import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SUBSCRIPTION_GATE } from '../../common/ports/tokens';
import type { SubscriptionGate } from '../../common/ports/subscription.gate';
import { PremiumRequiredException } from '../../common/exceptions';

export const REQUIRED_PLAN_KEY = 'requiredPlan';
export type RequiredPlan = 'shortlisted' | 'hired';

type AuthenticatedRequest = Request & {
  authUser?: { email: string; sub?: string };
};

/**
 * Reads the required plan from route metadata (set by @RequiresPremium) and
 * checks it against the user's current subscription via SubscriptionGate.
 *
 * Must run AFTER SupabaseGuard — it expects `request.authUser.email` to be
 * populated. The composite @RequiresPremium decorator wires both guards in
 * the right order.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(SUBSCRIPTION_GATE)
    private readonly subscription: SubscriptionGate,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan =
      this.reflector.getAllAndOverride<RequiredPlan>(REQUIRED_PLAN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'shortlisted';

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const email = request.authUser?.email;
    if (!email) {
      throw new UnauthorizedException(
        'PremiumGuard requires an authenticated request',
      );
    }

    const allowed =
      requiredPlan === 'hired'
        ? await this.subscription.isHired(email)
        : await this.subscription.isPremium(email);

    if (!allowed) {
      throw new PremiumRequiredException(
        requiredPlan === 'hired'
          ? 'HIRED plan required'
          : 'This feature requires an active subscription.',
        { requiredPlan },
      );
    }
    return true;
  }
}
