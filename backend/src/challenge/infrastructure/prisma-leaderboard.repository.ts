import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FOLLOW_REPOSITORY } from '../../social/ports/tokens';
import type { FollowRepository } from '../../social/ports/follow.repository';
import type { LeaderboardRepository } from '../ports/leaderboard.repository';
import type {
  ChallengeLeaderboardInput,
  GlobalLeaderboardInput,
  LeaderboardEntry,
  StreakLeaderboardInput,
} from '../domain/leaderboard.types';

@Injectable()
export class PrismaLeaderboardRepository implements LeaderboardRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
  ) {}

  async perChallenge({
    challengeId,
    scope,
    limit,
    viewerEmail,
  }: ChallengeLeaderboardInput): Promise<LeaderboardEntry[]> {
    const followingEmails = await this.maybeResolveFollowingEmails(
      scope,
      viewerEmail,
    );
    if (followingEmails && followingEmails.length === 0) return [];

    const rows = await this.prisma.challengeAttempt.findMany({
      where: {
        challengeId,
        score: { gt: 0 },
        ...(followingEmails && { email: { in: followingEmails } }),
      },
      orderBy: [
        { score: 'desc' },
        { completedAt: 'asc' },
      ],
      take: limit,
      select: {
        email: true,
        score: true,
        completedAt: true,
      },
    });
    if (rows.length === 0) return [];

    const profilesByEmail = await this.fetchPublicProfiles(
      rows.map((r) => r.email),
    );
    return rows
      .map((row, idx): LeaderboardEntry | null => {
        const p = profilesByEmail.get(row.email);
        if (!p) return null;
        return {
          rank: idx + 1,
          username: p.username!,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          score: row.score,
          completedAt: row.completedAt,
        };
      })
      .filter((e): e is LeaderboardEntry => e !== null);
  }

  async global({
    scope,
    period,
    limit,
    viewerEmail,
  }: GlobalLeaderboardInput): Promise<LeaderboardEntry[]> {
    if (period === 'week') {
      return this.globalWeekly({ scope, limit, viewerEmail });
    }
    return this.globalAlltime({ scope, limit, viewerEmail });
  }

  async streaks({
    scope,
    limit,
    viewerEmail,
  }: StreakLeaderboardInput): Promise<LeaderboardEntry[]> {
    const followingEmails = await this.maybeResolveFollowingEmails(
      scope,
      viewerEmail,
    );
    if (followingEmails && followingEmails.length === 0) return [];

    const rows = await this.prisma.challengeStreak.findMany({
      where: {
        currentStreak: { gt: 0 },
        ...(followingEmails && { email: { in: followingEmails } }),
      },
      orderBy: { currentStreak: 'desc' },
      take: limit,
      select: { email: true, currentStreak: true },
    });
    if (rows.length === 0) return [];

    const profilesByEmail = await this.fetchPublicProfiles(
      rows.map((r) => r.email),
    );
    return rows
      .map((row, idx): LeaderboardEntry | null => {
        const p = profilesByEmail.get(row.email);
        if (!p) return null;
        return {
          rank: idx + 1,
          username: p.username!,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          score: row.currentStreak,
        };
      })
      .filter((e): e is LeaderboardEntry => e !== null);
  }

  private async globalAlltime({
    scope,
    limit,
    viewerEmail,
  }: {
    scope: GlobalLeaderboardInput['scope'];
    limit: number;
    viewerEmail?: string;
  }): Promise<LeaderboardEntry[]> {
    const followingEmails = await this.maybeResolveFollowingEmails(
      scope,
      viewerEmail,
    );
    if (followingEmails && followingEmails.length === 0) return [];

    const rows = await this.prisma.profile.findMany({
      where: {
        isPublic: true,
        username: { not: null },
        totalChallengeScore: { gt: 0 },
        ...(followingEmails && { email: { in: followingEmails } }),
      },
      orderBy: { totalChallengeScore: 'desc' },
      take: limit,
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
        totalChallengeScore: true,
      },
    });
    return rows.map((row, idx) => ({
      rank: idx + 1,
      username: row.username!,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      score: row.totalChallengeScore,
    }));
  }

  private async globalWeekly({
    scope,
    limit,
    viewerEmail,
  }: {
    scope: GlobalLeaderboardInput['scope'];
    limit: number;
    viewerEmail?: string;
  }): Promise<LeaderboardEntry[]> {
    const followingEmails = await this.maybeResolveFollowingEmails(
      scope,
      viewerEmail,
    );
    if (followingEmails && followingEmails.length === 0) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    const grouped = await this.prisma.challengeAttempt.groupBy({
      by: ['email'],
      where: {
        score: { gt: 0 },
        completedAt: { gte: sevenDaysAgo },
        ...(followingEmails && { email: { in: followingEmails } }),
      },
      _sum: { score: true },
      orderBy: { _sum: { score: 'desc' } },
      take: limit,
    });
    if (grouped.length === 0) return [];

    const profilesByEmail = await this.fetchPublicProfiles(
      grouped.map((g) => g.email),
    );
    return grouped
      .map((g, idx): LeaderboardEntry | null => {
        const p = profilesByEmail.get(g.email);
        if (!p) return null;
        return {
          rank: idx + 1,
          username: p.username!,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          score: g._sum.score ?? 0,
        };
      })
      .filter((e): e is LeaderboardEntry => e !== null);
  }

  /**
   * Returns the list of emails the viewer follows (their `Following` peers'
   * emails), restricted to public profiles with usernames.
   * Returns null if scope is `global` (no filter), or [] if scope=following
   * but the viewer is anonymous.
   */
  private async maybeResolveFollowingEmails(
    scope: 'global' | 'following',
    viewerEmail?: string,
  ): Promise<string[] | null> {
    if (scope === 'global') return null;
    if (!viewerEmail) return [];
    const viewerId = await this.follows.getProfileIdByEmail(viewerEmail);
    if (!viewerId) return [];
    // Pull the full following list (cap at 500 — leaderboards make sense for a
    // bounded peer set; users with thousands of follows can revisit).
    const list = await this.follows.listFollowing(
      viewerId,
      { limit: 500 },
      { onlyPublic: true },
    );
    if (list.entries.length === 0) return [];
    const usernames = list.entries.map((e) => e.username);
    const profiles = await this.prisma.profile.findMany({
      where: { username: { in: usernames } },
      select: { email: true },
    });
    return profiles.map((p) => p.email);
  }

  private async fetchPublicProfiles(emails: string[]): Promise<
    Map<string, {
      username: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    }>
  > {
    if (emails.length === 0) return new Map();
    const rows = await this.prisma.profile.findMany({
      where: {
        email: { in: emails },
        isPublic: true,
        username: { not: null },
      },
      select: {
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });
    return new Map(
      rows.map((r) => [
        r.email,
        {
          username: r.username,
          displayName: r.displayName,
          avatarUrl: r.avatarUrl,
        },
      ]),
    );
  }
}

