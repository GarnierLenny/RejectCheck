import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { levelFromXp, type RewardKey } from '../domain/tier-config';
import type {
  ProfileXpState,
  UnlockedRewardRow,
  XpLedgerEntry,
  XpRepository,
} from '../ports/xp.repository';

@Injectable()
export class PrismaXpRepository implements XpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileXp(email: string): Promise<ProfileXpState> {
    const row = await this.prisma.profile.findUnique({
      where: { email },
      select: { totalXp: true, level: true },
    });
    return {
      totalXp: row?.totalXp ?? 0,
      level: row?.level ?? 1,
    };
  }

  async getRank(email: string): Promise<{ rank: number; totalUsers: number }> {
    const me = await this.prisma.profile.findUnique({
      where: { email },
      select: { totalXp: true, isPublic: true },
    });
    const myXp = me?.totalXp ?? 0;
    const [rankAhead, totalUsers] = await Promise.all([
      this.prisma.profile.count({
        where: { isPublic: true, totalXp: { gt: myXp } },
      }),
      this.prisma.profile.count({
        where: { isPublic: true, totalXp: { gt: 0 } },
      }),
    ]);
    return {
      rank: rankAhead + 1,
      // Include the current user in the total only if they have any XP
      totalUsers: Math.max(totalUsers, myXp > 0 ? rankAhead + 1 : 0),
    };
  }

  async hasLedgerForAttempt(attemptId: number): Promise<boolean> {
    const row = await this.prisma.xpLedger.findFirst({
      where: { attemptId },
      select: { id: true },
    });
    return row !== null;
  }

  async awardXp(input: {
    email: string;
    amount: number;
    reason: string;
    breakdown?: unknown;
    attemptId?: number | null;
    challengeId?: number | null;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Idempotency: skip if attemptId already has a ledger row
      if (input.attemptId != null) {
        const existing = await tx.xpLedger.findFirst({
          where: { attemptId: input.attemptId },
          select: { id: true },
        });
        if (existing) {
          const profile = await tx.profile.findUnique({
            where: { email: input.email },
            select: { totalXp: true, level: true },
          });
          const tot = profile?.totalXp ?? 0;
          const lvl = profile?.level ?? 1;
          return {
            inserted: false,
            newTotalXp: tot,
            oldLevel: lvl,
            newLevel: lvl,
          };
        }
      }

      // Insert ledger row
      await tx.xpLedger.create({
        data: {
          email: input.email,
          amount: input.amount,
          reason: input.reason,
          breakdown:
            (input.breakdown as Parameters<
              typeof tx.xpLedger.create
            >[0]['data']['breakdown']) ?? undefined,
          attemptId: input.attemptId ?? null,
          challengeId: input.challengeId ?? null,
        },
      });

      // Read current Profile state
      const profile = await tx.profile.findUnique({
        where: { email: input.email },
        select: { totalXp: true, level: true },
      });
      const oldTotalXp = profile?.totalXp ?? 0;
      const oldLevel = profile?.level ?? 1;
      const newTotalXp = oldTotalXp + input.amount;
      const newLevel = levelFromXp(newTotalXp).level;

      await tx.profile.upsert({
        where: { email: input.email },
        update: { totalXp: newTotalXp, level: newLevel },
        create: { email: input.email, totalXp: newTotalXp, level: newLevel },
      });

      return {
        inserted: true,
        newTotalXp,
        oldLevel,
        newLevel,
      };
    });
  }

  async recentLedger(email: string, limit: number): Promise<XpLedgerEntry[]> {
    const rows = await this.prisma.xpLedger.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      breakdown: r.breakdown,
      attemptId: r.attemptId,
      challengeId: r.challengeId,
      createdAt: r.createdAt,
    }));
  }

  async upsertReward(input: {
    email: string;
    rewardKey: RewardKey;
    unlockedAtLevel: number;
    stripeCouponId?: string | null;
    stripePromotionCode?: string | null;
  }): Promise<{ inserted: boolean; row: UnlockedRewardRow }> {
    const existing = await this.prisma.unlockedReward.findUnique({
      where: {
        email_rewardKey: { email: input.email, rewardKey: input.rewardKey },
      },
    });
    if (existing) {
      return {
        inserted: false,
        row: this.toRewardRow(existing),
      };
    }
    const created = await this.prisma.unlockedReward.create({
      data: {
        email: input.email,
        rewardKey: input.rewardKey,
        unlockedAtLevel: input.unlockedAtLevel,
        stripeCouponId: input.stripeCouponId ?? null,
        stripePromotionCode: input.stripePromotionCode ?? null,
      },
    });
    return {
      inserted: true,
      row: this.toRewardRow(created),
    };
  }

  async listUnlockedRewards(email: string): Promise<UnlockedRewardRow[]> {
    const rows = await this.prisma.unlockedReward.findMany({
      where: { email },
      orderBy: { unlockedAt: 'desc' },
    });
    return rows.map((r) => this.toRewardRow(r));
  }

  async markRewardRedeemed(email: string, rewardKey: RewardKey): Promise<void> {
    await this.prisma.unlockedReward.update({
      where: { email_rewardKey: { email, rewardKey } },
      data: { redeemed: true, redeemedAt: new Date() },
    });
  }

  private toRewardRow(r: {
    id: number;
    rewardKey: string;
    unlockedAt: Date;
    unlockedAtLevel: number;
    redeemed: boolean;
    stripeCouponId: string | null;
    stripePromotionCode: string | null;
  }): UnlockedRewardRow {
    return {
      id: r.id,
      rewardKey: r.rewardKey as RewardKey,
      unlockedAt: r.unlockedAt,
      unlockedAtLevel: r.unlockedAtLevel,
      redeemed: r.redeemed,
      stripeCouponId: r.stripeCouponId,
      stripePromotionCode: r.stripePromotionCode,
    };
  }
}
