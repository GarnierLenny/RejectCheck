import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { PublicProfileRepository } from '../ports/public-profile.repository';
import type {
  AchievementsBundle,
  EarnedAchievement,
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

    const [aggregate, streak, recentRows, achievements] = await Promise.all([
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
      this.computeAchievements(profile.email, profile.followersCount),
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
      achievements,
    };
  }

  /**
   * Computes earned achievements + progress counters from existing data.
   * No new tables — derived from ChallengeAttempt + ChallengeStreak + Profile.
   * Two queries:
   *   1) attempts (id, score, completedAt, challenge.focusTag, challenge.language) for everything below
   *   2) streak max (longestStreak)
   */
  private async computeAchievements(
    email: string,
    followersCount: number,
  ): Promise<AchievementsBundle> {
    const [attempts, streak] = await Promise.all([
      this.prisma.challengeAttempt.findMany({
        where: { email, score: { gt: 0 } },
        orderBy: { completedAt: 'asc' },
        select: {
          score: true,
          completedAt: true,
          challenge: { select: { focusTag: true, language: true } },
        },
      }),
      this.prisma.challengeStreak.findUnique({
        where: { email },
        select: { longestStreak: true },
      }),
    ]);

    const totalCount = attempts.length;
    const perfectAttempts = attempts.filter((a) => a.score === 100);
    const perfectCount = perfectAttempts.length;
    const longestStreak = streak?.longestStreak ?? 0;

    const seenLanguages = new Map<string, Date>();
    const focusMasterCounts: Record<string, number> = {};
    const focusMasterFifthAt: Record<string, Date> = {};
    for (const a of attempts) {
      const lang = a.challenge.language;
      if (!seenLanguages.has(lang)) seenLanguages.set(lang, a.completedAt);
      if (a.score >= 90) {
        const tag = a.challenge.focusTag;
        focusMasterCounts[tag] = (focusMasterCounts[tag] ?? 0) + 1;
        if (focusMasterCounts[tag] === 5) {
          focusMasterFifthAt[tag] = a.completedAt;
        }
      }
    }
    const languagesCount = seenLanguages.size;

    const earned: EarnedAchievement[] = [];

    // first_steps: oldest score > 0 attempt (attempts is sorted asc, so [0])
    if (totalCount >= 1) {
      earned.push({ slug: 'first_steps', earnedAt: attempts[0].completedAt });
    }
    // perfect_score: oldest score = 100
    if (perfectCount >= 1) {
      earned.push({ slug: 'perfect_score', earnedAt: perfectAttempts[0].completedAt });
    }
    // triple_crown: 5 perfect scores — earnedAt = 5th perfect's completedAt
    if (perfectCount >= 5) {
      earned.push({
        slug: 'triple_crown',
        earnedAt: perfectAttempts[4].completedAt,
      });
    }
    // week_warrior / month_warrior: streak-based, no exact date available
    if (longestStreak >= 7) {
      earned.push({ slug: 'week_warrior', earnedAt: null });
    }
    if (longestStreak >= 30) {
      earned.push({ slug: 'month_warrior', earnedAt: null });
    }
    // polyglot: 3 distinct languages — earnedAt = completedAt of the 3rd new language
    if (languagesCount >= 3) {
      const sortedLangDates = [...seenLanguages.values()].sort(
        (a, b) => a.getTime() - b.getTime(),
      );
      earned.push({ slug: 'polyglot', earnedAt: sortedLangDates[2] });
    }
    // focus_master:<tag>: one entry per tag with >= 5 high scores
    for (const [tag, count] of Object.entries(focusMasterCounts)) {
      if (count >= 5) {
        earned.push({
          slug: `focus_master:${tag}`,
          earnedAt: focusMasterFifthAt[tag] ?? null,
        });
      }
    }
    // centurion: 100 attempts — earnedAt = 100th attempt's completedAt
    if (totalCount >= 100) {
      earned.push({ slug: 'centurion', earnedAt: attempts[99].completedAt });
    }
    // connected: 10 followers — date unknown
    if (followersCount >= 10) {
      earned.push({ slug: 'connected', earnedAt: null });
    }

    return {
      earned,
      progress: {
        totalCount,
        perfectCount,
        longestStreak,
        languagesCount,
        followersCount,
        focusMasterCounts,
      },
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

  async getOwnerStatus(
    email: string,
  ): Promise<{ username: string | null; usernameUpdatedAt: Date | null } | null> {
    const row = await this.prisma.profile.findUnique({
      where: { email },
      select: { username: true, usernameUpdatedAt: true },
    });
    return row ?? null;
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
