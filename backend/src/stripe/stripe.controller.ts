import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';

@Controller('api/stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  /** Public — creates a checkout session (email is optional, used for pre-filling Stripe form). */
  @Post('checkout')
  async createCheckout(
    @Body() body: { plan: 'shortlisted' | 'hired'; email?: string },
  ) {
    return this.stripeService.createCheckoutSession(body.plan, body.email);
  }

  /** Protected — returns the authenticated user's own subscription only. */
  @UseGuards(SupabaseGuard)
  @Get('subscription')
  async getSubscription(@AuthEmail() email: string) {
    return this.stripeService.getSubscription(email);
  }

  @UseGuards(SupabaseGuard)
  @Post('portal')
  async createPortal(
    @AuthEmail() email: string,
    @Body() body: { returnUrl: string },
  ) {
    return this.stripeService.createPortalSession(email, body.returnUrl);
  }

  /** Stripe-signed webhook — verified by stripe-signature header, not by Supabase JWT. */
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) throw new BadRequestException('Missing raw body');
    await this.stripeService.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}
