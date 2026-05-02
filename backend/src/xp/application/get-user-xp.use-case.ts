import { Inject, Injectable } from '@nestjs/common';
import { XP_REPOSITORY } from '../ports/tokens';
import type { XpRepository } from '../ports/xp.repository';
import { xpProgress, type LevelDef, type TierKey } from '../domain/tier-config';

export type UserXpView = {
  totalXp: number;
  level: number;
  tier: TierKey;
  tierLabel: string;
  xpInLevel: number;
  xpForNextLevel: number;
  percentToNextLevel: number;
  next: { level: number; tier: TierKey; tierLabel: string; xpRequired: number } | null;
  rank: number;
  totalUsers: number;
};

@Injectable()
export class GetUserXpUseCase {
  constructor(@Inject(XP_REPOSITORY) private readonly repo: XpRepository) {}

  async execute(email: string): Promise<UserXpView> {
    const [{ totalXp }, rank] = await Promise.all([
      this.repo.getProfileXp(email),
      this.repo.getRank(email),
    ]);
    return { ...projectXp(totalXp), rank: rank.rank, totalUsers: rank.totalUsers };
  }
}

export function projectXp(totalXp: number): Omit<UserXpView, 'rank' | 'totalUsers'> {
  const progress = xpProgress(totalXp);
  return {
    totalXp,
    level: progress.current.level,
    tier: progress.current.tier,
    tierLabel: progress.current.tierLabel,
    xpInLevel: progress.xpInLevel,
    xpForNextLevel: progress.xpForNextLevel,
    percentToNextLevel: progress.percentToNextLevel,
    next: progress.next
      ? {
          level: progress.next.level,
          tier: progress.next.tier,
          tierLabel: progress.next.tierLabel,
          xpRequired: progress.next.xpRequired,
        }
      : null,
  };
}

export type _LevelDefAlias = LevelDef;
