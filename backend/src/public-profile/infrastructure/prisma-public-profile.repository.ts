import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { PublicProfileRepository } from '../ports/public-profile.repository';
import type {
  PublicActivityEntry,
  PublicProfileView,
  UpdatePublicSettingsInput,
} from '../domain/public-profile.types';

@Injectable()
export class PrismaPublicProfileRepository implements PublicProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(
    username: string,
    viewerEmail?: string,
  ): Promise<PublicProfileView | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
    });
    if (!profile || !profile.isPublic) return null;

    const [aggregate, streak, recentRows] = await Promise.all([
      this.prisma.challengeAttempt.aggregate({
        where: { email: profile.email, score: { gt: 0 } },
        _count: { _all: true },
        _avg: { score: true },
        _max: { score: true },
      }),
      this.prisma.challengeStreak.findUnique({
        where: { email: profile.email },
      }),
      this.prisma.challengeAttempt.findMany({
        where: { email: profile.email, score: { gt: 0 } },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: {
          challengeId: true,
          score: true,
          completedAt: true,
          challenge: {
            select: {
              title: true,
              focusTag: true,
              difficulty: true,
              language: true,
            },
          },
        },
      }),
    ]);

    let isFollowing: boolean | undefined;
    if (viewerEmail && viewerEmail !== profile.email) {
      const viewer = await this.prisma.profile.findUnique({
        where: { email: viewerEmail },
        select: { id: true },
      });
      if (viewer) {
        const row = await this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewer.id,
              followingId: profile.id,
            },
          },
          select: { id: true },
        });
        isFollowing = !!row;
      }
    }

    return {
      username: profile.username!,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      githubUsername: profile.githubUsername,
      linkedinUrl: profile.linkedinUrl,
      portfolioUrl: profile.portfolioUrl,
      socialLinks: profile.socialLinks,
      joinedAt: profile.createdAt,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      isFollowing,
      challenges: {
        total: aggregate._count._all,
        avgScore: Math.round(aggregate._avg.score ?? 0),
        bestScore: aggregate._max.score ?? 0,
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        lastCompletedAt: streak?.lastCompletedAt ?? null,
      },
      recentChallenges: recentRows.map((r) => ({
        challengeId: r.challengeId,
        title: r.challenge.title,
        focusTag: r.challenge.focusTag,
        difficulty: r.challenge.difficulty,
        language: r.challenge.language,
        score: r.score,
        completedAt: r.completedAt,
      })),
    };
  }

  async listActivity(
    username: string,
    since: Date,
  ): Promise<PublicActivityEntry[]> {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
      select: { email: true, isPublic: true },
    });
    if (!profile || !profile.isPublic) return [];

    const rows = await this.prisma.challengeAttempt.findMany({
      where: {
        email: profile.email,
        score: { gt: 0 },
        completedAt: { gte: since },
      },
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

  async claimUsername(email: string, username: string): Promise<void> {
    await this.prisma.profile.upsert({
      where: { email },
      update: { username, usernameUpdatedAt: new Date() },
      create: { email, username, usernameUpdatedAt: new Date() },
    });
  }

  async updatePublicSettings(
    email: string,
    input: UpdatePublicSettingsInput,
  ): Promise<{ isPublic: boolean; bio: string | null }> {
    return this.prisma.profile.upsert({
      where: { email },
      update: {
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
        ...(input.bio !== undefined && { bio: input.bio }),
      },
      create: {
        email,
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
        ...(input.bio !== undefined && { bio: input.bio }),
      },
      select: { isPublic: true, bio: true },
    });
  }
}
