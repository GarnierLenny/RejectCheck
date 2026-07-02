import { Injectable } from '@nestjs/common';
import {
  SubscriptionStatus,
  type SubscriptionProvider,
  type Subscription as PrismaSubscription,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { SubscriptionRepository } from '../ports/subscription.repository';
import type {
  Subscription,
  SubscriptionRefresh,
  UpsertSubscriptionInput,
} from '../domain/subscription.types';

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Subscription | null> {
    const rows = await this.prisma.subscription.findMany({ where: { email } });
    if (rows.length === 0) return null;
    return this.toDomain(this.pickEffective(rows));
  }

  async findStripeCustomerIdByEmail(email: string): Promise<string | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { email_provider: { email, provider: 'stripe' } },
      select: { stripeCustomerId: true },
    });
    return row?.stripeCustomerId ?? null;
  }

  async upsert(input: UpsertSubscriptionInput): Promise<void> {
    await this.prisma.subscription.upsert({
      where: {
        email_provider: { email: input.email, provider: input.provider },
      },
      create: {
        email: input.email,
        provider: input.provider,
        stripeCustomerId: input.stripeCustomerId ?? null,
        externalRef: input.externalRef ?? null,
        plan: input.plan,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
      },
      update: {
        stripeCustomerId: input.stripeCustomerId ?? null,
        externalRef: input.externalRef ?? null,
        plan: input.plan,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
      },
    });
  }

  async refreshByCustomerId(
    stripeCustomerId: string,
    patch: SubscriptionRefresh,
  ): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId },
      data: {
        status: patch.status,
        currentPeriodEnd: patch.currentPeriodEnd,
        // Only touch the plan when the event resolved to a known one, so a
        // legacy/unmapped price never downgrades a row.
        ...(patch.plan ? { plan: patch.plan } : {}),
      },
    });
  }

  async cancelByCustomerId(stripeCustomerId: string): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId },
      data: { status: SubscriptionStatus.canceled },
    });
  }

  async cancelByEmailAndProvider(
    email: string,
    provider: SubscriptionProvider,
  ): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { email, provider },
      data: { status: SubscriptionStatus.canceled },
    });
  }

  /**
   * With one row per (email, provider) a user may hold both a Stripe and a
   * RevenueCat subscription. Resolve the single effective one: prefer an active
   * hired sub, then any active sub (latest period end), else the most recently
   * updated row so a caller still sees the latest canceled/expired state.
   */
  private pickEffective(rows: PrismaSubscription[]): PrismaSubscription {
    const now = new Date();
    const active = rows.filter(
      (r) => r.status === 'active' && r.currentPeriodEnd > now,
    );
    if (active.length > 0) {
      const hired = active.find((r) => r.plan === 'hired');
      if (hired) return hired;
      return active.reduce((a, b) =>
        a.currentPeriodEnd > b.currentPeriodEnd ? a : b,
      );
    }
    return rows.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
  }

  private toDomain(row: PrismaSubscription): Subscription {
    return {
      email: row.email,
      provider: row.provider,
      stripeCustomerId: row.stripeCustomerId,
      externalRef: row.externalRef,
      plan: row.plan,
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd,
    };
  }
}
