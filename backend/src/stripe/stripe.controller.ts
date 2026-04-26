import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { CreateCheckoutSessionUseCase } from './application/create-checkout-session.use-case';
import { GetSubscriptionUseCase } from './application/get-subscription.use-case';
import { HandleWebhookUseCase } from './application/handle-webhook.use-case';

@Controller('api/stripe')
export class StripeController {
  constructor(
    private readonly createCheckout: CreateCheckoutSessionUseCase,
    private readonly getSubscription: GetSubscriptionUseCase,
    private readonly handleWebhookUc: HandleWebhookUseCase,
  ) {}

  /** Public — creates a checkout session (email is optional, used for pre-filling the Stripe form). */
  @Post('checkout')
  async createCheckoutSession(
    @Body() body: { plan: 'shortlisted' | 'hired'; email?: string },
  ) {
    return this.createCheckout.execute({
      plan: body.plan,
      customerEmail: body.email,
    });
  }

  /** Protected — returns the authenticated user's own subscription only. */
  @UseGuards(SupabaseGuard)
  @Get('subscription')
  async subscription(@AuthEmail() email: string) {
    return this.getSubscription.execute(email);
  }

  /** Stripe-signed webhook — verified by stripe-signature header, not by Supabase JWT.
   *  Exempted from rate limiting (Stripe handles retries) and from the global
   *  validation pipe via the @Req() raw body. */
  @SkipThrottle()
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('Missing raw body');
    await this.handleWebhookUc.execute(req.rawBody, signature);
    return { received: true };
  }
}
