import { Injectable } from '@nestjs/common';
import {
  SubscriptionStatus,
  type Subscription as PrismaSubscription,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { SubscriptionRepository } from '../ports/subscription.repository';
import type {
  Subscription,
  UpsertSubscriptionInput,
} from '../domain/subscription.types';

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async upsert(input: UpsertSubscriptionInput): Promise<void> {
    await this.prisma.subscription.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        stripeCustomerId: input.stripeCustomerId,
        plan: input.plan,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
      },
      update: {
        stripeCustomerId: input.stripeCustomerId,
        plan: input.plan,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
      },
    });
  }

  async cancelByCustomerId(stripeCustomerId: string): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId },
      data: { status: SubscriptionStatus.canceled },
    });
  }

  private toDomain(row: PrismaSubscription): Subscription {
    return {
      email: row.email,
      stripeCustomerId: row.stripeCustomerId,
      plan: row.plan,
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd,
    };
  }
}
