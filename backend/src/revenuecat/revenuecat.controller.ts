import { Body, Controller, Headers, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HandleRevenueCatWebhookUseCase } from './application/handle-revenuecat-webhook.use-case';

@Controller('api/revenuecat')
export class RevenueCatController {
  constructor(
    private readonly handleWebhook: HandleRevenueCatWebhookUseCase,
  ) {}

  /**
   * RevenueCat webhook — authenticated by a shared secret in the Authorization
   * header (not a body HMAC, so no raw body needed). Exempt from rate limiting
   * because RevenueCat retries on non-2xx. Returns 2xx for handled AND ignored
   * events; only unauthenticated/malformed requests surface a 4xx.
   */
  @SkipThrottle()
  @Post('webhook')
  async webhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ) {
    await this.handleWebhook.execute(authorization, body);
    return { received: true };
  }
}
