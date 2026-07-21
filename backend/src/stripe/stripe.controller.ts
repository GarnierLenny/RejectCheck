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
import { OptionalSupabaseGuard } from '../auth/optional-supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { OptionalAuthEmail } from '../auth/optional-auth.decorator';
import { CreateCheckoutSessionUseCase } from './application/create-checkout-session.use-case';
import { GetFounderAvailabilityUseCase } from './application/get-founder-availability.use-case';
import { CreateCreditsCheckoutSessionUseCase } from './application/create-credits-checkout-session.use-case';
import { CreateAnalysisUnlockCheckoutSessionUseCase } from './application/create-analysis-unlock-checkout-session.use-case';
import { CreateSprintPassCheckoutSessionUseCase } from './application/create-sprint-pass-checkout-session.use-case';
import { CreatePortalSessionUseCase } from './application/create-portal-session.use-case';
import { CheckSubscriptionUseCase } from './application/check-subscription.use-case';
import { GetSubscriptionUseCase } from './application/get-subscription.use-case';
import { HandleWebhookUseCase } from './application/handle-webhook.use-case';

@Controller('api/stripe')
export class StripeController {
  constructor(
    private readonly createCheckout: CreateCheckoutSessionUseCase,
    private readonly founderAvailability: GetFounderAvailabilityUseCase,
    private readonly createCreditsCheckout: CreateCreditsCheckoutSessionUseCase,
    private readonly createAnalysisUnlockCheckout: CreateAnalysisUnlockCheckoutSessionUseCase,
    private readonly createSprintPassCheckout: CreateSprintPassCheckoutSessionUseCase,
    private readonly createPortal: CreatePortalSessionUseCase,
    private readonly checkSubscription: CheckSubscriptionUseCase,
    private readonly getSubscription: GetSubscriptionUseCase,
    private readonly handleWebhookUc: HandleWebhookUseCase,
  ) {}

  /**
   * Creates a subscription Checkout session. Works anonymously (pricing page),
   * but when a valid JWT is present we trust that email over the body.
   *
   * Guard against double billing: if the authenticated user already has an
   * active subscription, we return a Billing Portal URL instead of a second
   * Checkout — so "Get Hired" on an existing sub sends them to upgrade (Stripe
   * prorates) rather than creating a parallel, separately-charged subscription.
   */
  @UseGuards(OptionalSupabaseGuard)
  @Post('checkout')
  async createCheckoutSession(
    @OptionalAuthEmail() authedEmail: string | undefined,
    @Body() body: { plan: 'shortlisted' | 'hired' | 'founder'; email?: string },
  ) {
    if (authedEmail && (await this.checkSubscription.isPremium(authedEmail))) {
      return this.createPortal.execute({ email: authedEmail });
    }
    return this.createCheckout.execute({
      plan: body.plan,
      customerEmail: authedEmail ?? body.email,
    });
  }

  /**
   * Public — how many capped founder seats remain, for the pricing page's
   * scarcity counter. Anonymous (no subscription data leaked, just a count).
   */
  @Get('founder-availability')
  async getFounderAvailability() {
    return this.founderAvailability.execute();
  }

  /**
   * Protected — opens a Stripe Billing Portal session for self-service
   * cancellation, payment-method changes, invoices and plan changes. Email
   * comes from the JWT; the customer id is resolved server-side.
   */
  @UseGuards(SupabaseGuard)
  @Post('portal')
  async createPortalSession(
    @AuthEmail() email: string,
    @Body() body: { returnUrl?: string },
  ) {
    return this.createPortal.execute({ email, returnUrl: body?.returnUrl });
  }

  /** Protected — returns the authenticated user's own subscription only. */
  @UseGuards(SupabaseGuard)
  @Get('subscription')
  async subscription(@AuthEmail() email: string) {
    return this.getSubscription.execute(email);
  }

  /**
   * Protected — kicks off a one-time payment Checkout for analysis credits.
   * The email is taken from the Supabase JWT, never from the request body,
   * so balance grants on the webhook can trust `customer_details.email`.
   */
  @UseGuards(SupabaseGuard)
  @Post('credits/checkout')
  async createCreditsCheckoutSession(
    @AuthEmail() email: string,
    @Body() body: { quantity: number },
  ) {
    return this.createCreditsCheckout.execute({
      email,
      quantity: body?.quantity,
    });
  }

  /**
   * Protected — one-time "unlock the CV rewrite for this analysis" Checkout.
   * Email comes from the JWT (never the body) so the webhook can trust
   * `customer_details.email` when granting the per-analysis unlock.
   */
  @UseGuards(SupabaseGuard)
  @Post('analysis-unlock/checkout')
  async createAnalysisUnlockCheckoutSession(
    @AuthEmail() email: string,
    @Body() body: { analysisId: number; locale?: string },
  ) {
    return this.createAnalysisUnlockCheckout.execute({
      email,
      analysisId: body?.analysisId,
      locale: body?.locale,
    });
  }

  /**
   * Works anonymously (guest paywall) and signed-in (free_cap paywall): a
   * one-time Sprint pass Checkout (mode=payment) granting hired-tier access for
   * a bounded window. When a JWT is present we trust that email; otherwise
   * Stripe collects it at checkout and the webhook grants access by the verified
   * `customer_details.email`. Already-premium signed-in users don't need it, so
   * we no-op with url:null; anonymous callers can't be premium, so that check
   * only runs when we actually have an identity.
   */
  @UseGuards(OptionalSupabaseGuard)
  @Post('sprint-pass/checkout')
  async createSprintPassCheckoutSession(
    @OptionalAuthEmail() email: string | undefined,
    @Body() body: { locale?: string },
  ) {
    if (email && (await this.checkSubscription.isPremium(email))) {
      return { url: null };
    }
    return this.createSprintPassCheckout.execute({
      email,
      locale: body?.locale,
    });
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
