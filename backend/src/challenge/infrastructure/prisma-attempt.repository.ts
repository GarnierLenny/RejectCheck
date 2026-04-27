import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AttemptHistoryItem,
  ChallengeAttempt,
  DayStats,
} from '../domain/challenge.types';
import type {
  ActivityEntry,
  AttemptRepository,
  FinalizeAttemptInput,
  UpsertFirstAnswerInput,
} from '../ports/attempt.repository';

type AttemptRow = {
  id: number;
  email: string;
  challengeId: number;
  firstAnswer: string;
  aiChallenge: string | null;
  secondAnswer: string | null;
  score: number;
  scoreBreakdown: Prisma.JsonValue;
  completedAt: Date;
};

@Injectable()
export class PrismaAttemptRepository implements AttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailAndChallenge(
    email: string,
    challengeId: number,
  ): Promise<ChallengeAttempt | null> {
    const row = await this.prisma.challengeAttempt.findUnique({
      where: { email_challengeId: { email, challengeId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async upsertFirstAnswer(input: UpsertFirstAnswerInput): Promise<void> {
    await this.prisma.challengeAttempt.upsert({
      where: {
        email_challengeId: {
          email: input.email,
          challengeId: input.challengeId,
        },
      },
      create: {
        email: input.email,
        challengeId: input.challengeId,
        firstAnswer: input.firstAnswer,
        aiChallenge: input.aiChallenge,
        score: 0,
        scoreBreakdown: {},
      },
      update: {
        firstAnswer: input.firstAnswer,
        aiChallenge: input.aiChallenge,
      },
    });
  }

  async finalize(input: FinalizeAttemptInput): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.challengeAttempt.update({
        where: {
          email_challengeId: {
            email: input.email,
            challengeId: input.challengeId,
          },
        },
        data: {
          secondAnswer: input.secondAnswer,
          score: input.score,
          scoreBreakdown:
            input.scoreBreakdown as unknown as Prisma.InputJsonValue,
          completedAt: input.completedAt,
        },
      }),
      // Bump denormalized counters used by the all-time leaderboard. Upsert
      // covers the case where the user has no Profile row yet (e.g. completed
      // a challenge before opening /settings).
      this.prisma.profile.upsert({
        where: { email: input.email },
        create: {
          email: input.email,
          totalChallengeScore: input.score,
          totalChallengeCount: 1,
        },
        update: {
          totalChallengeScore: { increment: input.score },
          totalChallengeCount: { increment: 1 },
        },
      }),
    ]);
  }

  async getDayStats(challengeId: number): Promise<DayStats> {
    const attempts = await this.prisma.challengeAttempt.findMany({
      where: { challengeId, score: { gt: 0 } },
      select: { score: true },
    });
    const completions = attempts.length;
    const averageScore =
      completions === 0
        ? 0
        : Math.round(attempts.reduce((a, b) => a + b.score, 0) / completions);

    const scoreDistribution: number[] = Array(10).fill(0) as number[];
    for (const a of attempts) {
      const bucket = Math.min(9, Math.floor(a.score / 10));
      scoreDistribution[bucket] += 1;
    }
    return { completions, averageScore, scoreDistribution };
  }

  async listHistory(
    email: string,
    take: number,
  ): Promise<AttemptHistoryItem[]> {
    const rows = await this.prisma.challengeAttempt.findMany({
      where: { email, score: { gt: 0 } },
      orderBy: { completedAt: 'desc' },
      take,
      include: {
        challenge: {
          select: {
            id: true,
            date: true,
            language: true,
            title: true,
            focusTag: true,
            difficulty: true,
            estimatedTime: true,
          },
        },
      },
    });
    return rows.map((r) => ({
      ...this.toDomain(r),
      challenge: r.challenge,
    }));
  }

  async listActivity(email: string, since: Date): Promise<ActivityEntry[]> {
    const rows = await this.prisma.challengeAttempt.findMany({
      where: { email, score: { gt: 0 }, completedAt: { gte: since } },
      orderBy: { completedAt: 'asc' },
      select: { score: true, completedAt: true },
    });
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const day = r.completedAt.toISOString().slice(0, 10);
      const prev = byDay.get(day) ?? 0;
      if (r.score > prev) byDay.set(day, r.score);
    }
    return Array.from(byDay, ([date, score]) => ({ date, score }));
  }

  private toDomain(row: AttemptRow): ChallengeAttempt {
    return {
      id: row.id,
      email: row.email,
      challengeId: row.challengeId,
      firstAnswer: row.firstAnswer,
      aiChallenge: row.aiChallenge,
      secondAnswer: row.secondAnswer,
      score: row.score,
      scoreBreakdown:
        (row.scoreBreakdown as Record<string, unknown> | null) ?? {},
      completedAt: row.completedAt,
    };
  }
}
