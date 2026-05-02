import { Inject, Injectable, Logger } from '@nestjs/common';
import { XP_REPOSITORY } from '../ports/tokens';
import type { XpRepository } from '../ports/xp.repository';
import {
  computeXpAward,
  type XpAwardBreakdown,
  type XpAwardInput,
} from '../domain/xp-formula';
import { rewardsBetween, type RewardKey } from '../domain/tier-config';
import { CheckTierRewardsUseCase } from './check-tier-rewards.use-case';

export type AwardXpResult = {
  gained: number;
  breakdown: XpAwardBreakdown;
  total: number;
  oldLevel: number;
  newLevel: number;
  newRewards: RewardKey[];
};

export type AwardXpInput = XpAwardInput & {
  email: string;
  attemptId: number;
  challengeId: number;
};

@Injectable()
export class AwardXpUseCase {
  private readonly logger = new Logger(AwardXpUseCase.name);

  constructor(
    @Inject(XP_REPOSITORY) private readonly repo: XpRepository,
    private readonly checkRewards: CheckTierRewardsUseCase,
  ) {}

  async execute(input: AwardXpInput): Promise<AwardXpResult> {
    const { email, attemptId, challengeId, ...xpInput } = input;

    // Skip if XP already awarded for this attempt (network retry safety)
    const already = await this.repo.hasLedgerForAttempt(attemptId);
    if (already) {
      this.logger.debug(
        `XP already awarded for attempt ${attemptId}, skipping (idempotent)`,
      );
      const cur = await this.repo.getProfileXp(email);
      return {
        gained: 0,
        breakdown: { base: 0, scoreMult: 0, streakMult: 1, bonus: 0 },
        total: cur.totalXp,
        oldLevel: cur.level,
        newLevel: cur.level,
        newRewards: [],
      };
    }

    const award = computeXpAward(xpInput);
    const reason = award.breakdown.bonus > 0
      ? 'first_perfect_focus_tag'
      : 'challenge_completion';

    const result = await this.repo.awardXp({
      email,
      amount: award.amount,
      reason,
      breakdown: award.breakdown,
      attemptId,
      challengeId,
    });

    if (!result.inserted) {
      // Race condition: another concurrent submit beat us. Treat as already-awarded.
      this.logger.debug(
        `XP award skipped for attempt ${attemptId} (race-condition idempotent)`,
      );
      return {
        gained: 0,
        breakdown: award.breakdown,
        total: result.newTotalXp,
        oldLevel: result.oldLevel,
        newLevel: result.newLevel,
        newRewards: [],
      };
    }

    let newRewards: RewardKey[] = [];
    if (result.newLevel > result.oldLevel) {
      const oldXp = result.newTotalXp - award.amount;
      const candidateRewards = rewardsBetween(oldXp, result.newTotalXp);
      newRewards = await this.checkRewards.execute({
        email,
        rewardKeys: candidateRewards,
        atLevel: result.newLevel,
      });
      this.logger.log(
        `User ${email} leveled up ${result.oldLevel} → ${result.newLevel}, unlocked: ${newRewards.join(', ')}`,
      );
    }

    return {
      gained: award.amount,
      breakdown: award.breakdown,
      total: result.newTotalXp,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      newRewards,
    };
  }
}
