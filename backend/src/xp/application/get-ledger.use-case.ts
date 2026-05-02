import { Inject, Injectable } from '@nestjs/common';
import { XP_REPOSITORY } from '../ports/tokens';
import type { XpRepository } from '../ports/xp.repository';

export type LedgerEntryView = {
  id: number;
  amount: number;
  reason: string;
  challengeId: number | null;
  createdAt: Date;
};

@Injectable()
export class GetLedgerUseCase {
  constructor(@Inject(XP_REPOSITORY) private readonly repo: XpRepository) {}

  async execute(email: string, limit = 50): Promise<LedgerEntryView[]> {
    const rows = await this.repo.recentLedger(email, Math.min(200, Math.max(1, limit)));
    return rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      challengeId: r.challengeId,
      createdAt: r.createdAt,
    }));
  }
}
