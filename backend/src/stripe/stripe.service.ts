import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StripeLib = require('stripe');
import { PrismaService } from '../prisma/prisma.service';

type StripeInstance = StripeLib.Stripe;

@Injectable()
export class StripeService {
  private stripe: StripeInstance;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new StripeLib(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      {
        apiVersion: '2024-06-20' as any,
      },
    );
  }

  async createCheckoutSession(
    plan: 'shortlisted' | 'hired',
    customerEmail?: string,
  ) {
    const priceId =
      plan === 'shortlisted'
        ? this.configService.get<string>('STRIPE_SHORTLISTED_PRICE_ID')!
        : this.configService.get<string>('STRIPE_HIRED_PRICE_ID')!;

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://rejectcheck.com';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/account?success=true`,
      cancel_url: `${frontendUrl}/pricing?error=true`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata: { plan, email: customerEmail || '' },
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    )!;
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session: any = event.data.object;
      // Use only the Stripe-verified email, never the client-controlled metadata.email
      const email: string | undefined =
        session.customer_details?.email ?? undefined;
      const plan: string | undefined = session.metadata?.plan;
      const customerId: string | undefined =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;

      if (email && plan && customerId && session.subscription) {
        const subscriptionId: string =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
        const sub = await this.stripe.subscriptions.retrieve(subscriptionId);

        await this.prisma.subscription.upsert({
          where: { email },
          create: {
            email,
            stripeCustomerId: customerId,
            plan,
            status: sub.status,
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
          },
          update: {
            stripeCustomerId: customerId,
            plan,
            status: sub.status,
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
          },
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub: any = event.data.object;
      const customerId: string =
        typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      await this.prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: 'canceled' },
      });
    }
  }

  async getSubscription(email: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { email } });
    if (!sub) return null;
    return {
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  async checkSubscription(email: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({ where: { email } });
    if (!sub) return false;
    return sub.status === 'active' && sub.currentPeriodEnd > new Date();
  }
}
