import { Inject, Injectable } from '@nestjs/common';
import { XP_REPOSITORY } from '../ports/tokens';
import type { XpRepository } from '../ports/xp.repository';
import { LEVELS, REWARDS, type RewardKey } from '../domain/tier-config';

export type RewardStatus = {
  key: RewardKey;
  type: 'cosmetic' | 'stripe_coupon';
  label: string;
  description: string;
  unlockedAtLevel: number;
  unlocked: boolean;
  promotionCode: string | null;
  redeemed: boolean;
};

@Injectable()
export class GetRewardsUseCase {
  constructor(@Inject(XP_REPOSITORY) private readonly repo: XpRepository) {}

  async execute(email: string): Promise<RewardStatus[]> {
    const unlocked = await this.repo.listUnlockedRewards(email);
    const unlockedMap = new Map(unlocked.map((r) => [r.rewardKey, r]));

    // Build the canonical list ordered by the level at which each reward unlocks
    const allRewardsWithLevel: Array<{ key: RewardKey; level: number }> = [];
    for (const lvl of LEVELS) {
      for (const r of lvl.rewards) {
        allRewardsWithLevel.push({ key: r, level: lvl.level });
      }
    }

    return allRewardsWithLevel.map(({ key, level }) => {
      const def = REWARDS[key];
      const row = unlockedMap.get(key);
      return {
        key,
        type: def.type,
        label: def.label,
        description: def.description,
        unlockedAtLevel: level,
        unlocked: !!row,
        promotionCode: row?.stripePromotionCode ?? null,
        redeemed: row?.redeemed ?? false,
      };
    });
  }
}
