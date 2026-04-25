import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { StreakSummary } from '../domain/challenge.types';
import type { StreakState } from '../domain/streak.policy';
import type { StreakRepository } from '../ports/streak.repository';

@Injectable()
export class PrismaStreakRepository implements StreakRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<StreakState | null> {
    const row = await this.prisma.challengeStreak.findUnique({
      where: { email },
    });
    if (!row) return null;
    return {
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastCompletedAt: row.lastCompletedAt,
    };
  }

  async upsert(email: string, state: StreakState): Promise<StreakSummary> {
    const row = await this.prisma.challengeStreak.upsert({
      where: { email },
      create: {
        email,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastCompletedAt: state.lastCompletedAt,
      },
      update: {
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastCompletedAt: state.lastCompletedAt,
      },
    });
    return {
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastCompletedAt: row.lastCompletedAt,
    };
  }
}
