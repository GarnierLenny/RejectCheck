import { Controller, Post, Get, Query, Body, Req, Headers, BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';

@Controller('api/stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('checkout')
  async createCheckout(@Body() body: { plan: 'shortlisted' | 'hired'; email?: string }) {
    return this.stripeService.createCheckoutSession(body.plan, body.email);
  }

  @Get('subscription')
  async getSubscription(@Query('email') email: string) {
    if (!email) throw new BadRequestException('email is required');
    return this.stripeService.getSubscription(email);
  }

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
