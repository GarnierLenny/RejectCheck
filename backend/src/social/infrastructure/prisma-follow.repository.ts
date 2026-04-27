import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  FollowRepository,
  FollowResolution,
} from '../ports/follow.repository';
import type {
  BlockList,
  BlockSummary,
  Feed,
  FeedEntry,
  FollowList,
  FollowSummary,
  ListPaginationInput,
} from '../domain/social.types';

@Injectable()
export class PrismaFollowRepository implements FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFollow(
    followerEmail: string,
    followingUsername: string,
  ): Promise<FollowResolution | null> {
    const [follower, following] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { email: followerEmail },
        select: { id: true },
      }),
      this.prisma.profile.findUnique({
        where: { username: followingUsername },
        select: { id: true, username: true, isPublic: true },
      }),
    ]);
    if (!follower || !following) return null;
    return {
      followerProfileId: follower.id,
      followingProfileId: following.id,
      followingIsPublic: following.isPublic,
      followingHasUsername: !!following.username,
    };
  }

  async follow(
    followerProfileId: number,
    followingProfileId: number,
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction([
        this.prisma.follow.create({
          data: { followerId: followerProfileId, followingId: followingProfileId },
        }),
        this.prisma.profile.update({
          where: { id: followerProfileId },
          data: { followingCount: { increment: 1 } },
        }),
        this.prisma.profile.update({
          where: { id: followingProfileId },
          data: { followersCount: { increment: 1 } },
        }),
      ]);
      return true;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return false;
      }
      throw err;
    }
  }

  async unfollow(
    followerProfileId: number,
    followingProfileId: number,
  ): Promise<boolean> {
    const result = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.follow.deleteMany({
        where: {
          followerId: followerProfileId,
          followingId: followingProfileId,
        },
      });
      if (deleted.count === 0) return false;
      await tx.profile.update({
        where: { id: followerProfileId },
        data: { followingCount: { decrement: 1 } },
      });
      await tx.profile.update({
        where: { id: followingProfileId },
        data: { followersCount: { decrement: 1 } },
      });
      return true;
    });
    return result;
  }

  async isFollowing(
    viewerProfileId: number,
    targetProfileId: number,
  ): Promise<boolean> {
    const row = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerProfileId,
          followingId: targetProfileId,
        },
      },
      select: { id: true },
    });
    return !!row;
  }

  async whichAreFollowedBy(
    viewerProfileId: number,
    targetProfileIds: number[],
  ): Promise<Set<number>> {
    if (targetProfileIds.length === 0) return new Set();
    const rows = await this.prisma.follow.findMany({
      where: {
        followerId: viewerProfileId,
        followingId: { in: targetProfileIds },
      },
      select: { followingId: true },
    });
    return new Set(rows.map((r) => r.followingId));
  }

  async listFollowing(
    profileId: number,
    pagination: ListPaginationInput,
    options: { onlyPublic?: boolean } = {},
  ): Promise<FollowList> {
    const rows = await this.prisma.follow.findMany({
      where: {
        followerId: profileId,
        ...(pagination.cursor !== undefined && {
          id: { lt: pagination.cursor },
        }),
        ...(options.onlyPublic && {
          following: { isPublic: true, username: { not: null } },
        }),
      },
      orderBy: { id: 'desc' },
      take: pagination.limit + 1,
      select: this.followSelect(),
    });
    return this.toFollowList(rows, pagination.limit, 'following');
  }

  async listFollowers(
    profileId: number,
    pagination: ListPaginationInput,
    options: { onlyPublic?: boolean } = {},
  ): Promise<FollowList> {
    const rows = await this.prisma.follow.findMany({
      where: {
        followingId: profileId,
        ...(pagination.cursor !== undefined && {
          id: { lt: pagination.cursor },
        }),
        ...(options.onlyPublic && {
          follower: { isPublic: true, username: { not: null } },
        }),
      },
      orderBy: { id: 'desc' },
      take: pagination.limit + 1,
      select: this.followSelect(),
    });
    return this.toFollowList(rows, pagination.limit, 'follower');
  }

  async countUnreadFollowers(profileId: number): Promise<number> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { followersLastSeenAt: true },
    });
    return this.prisma.follow.count({
      where: {
        followingId: profileId,
        ...(profile?.followersLastSeenAt && {
          createdAt: { gt: profile.followersLastSeenAt },
        }),
      },
    });
  }

  async markFollowersSeen(profileId: number): Promise<void> {
    await this.prisma.profile.update({
      where: { id: profileId },
      data: { followersLastSeenAt: new Date() },
    });
  }

  async listFeed(
    viewerProfileId: number,
    pagination: ListPaginationInput,
  ): Promise<Feed> {
    // Step 1: emails of public profiles I follow (cap 500)
    const followRows = await this.prisma.follow.findMany({
      where: {
        followerId: viewerProfileId,
        following: { isPublic: true, username: { not: null } },
      },
      select: {
        following: { select: { email: true } },
      },
      take: 500,
    });
    const emails = followRows.map((r) => r.following.email);
    if (emails.length === 0) return { entries: [], nextCursor: null };

    // Step 2: their finalized attempts, paginated by ChallengeAttempt.id desc
    const rows = await this.prisma.challengeAttempt.findMany({
      where: {
        email: { in: emails },
        score: { gt: 0 },
        ...(pagination.cursor !== undefined && {
          id: { lt: pagination.cursor },
        }),
      },
      orderBy: { id: 'desc' },
      take: pagination.limit + 1,
      select: {
        id: true,
        email: true,
        score: true,
        completedAt: true,
        challenge: {
          select: {
            id: true,
            title: true,
            focusTag: true,
            difficulty: true,
            language: true,
          },
        },
      },
    });
    if (rows.length === 0) return { entries: [], nextCursor: null };

    const hasMore = rows.length > pagination.limit;
    const sliced = hasMore ? rows.slice(0, pagination.limit) : rows;
    const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

    // Step 3: bulk-fetch profiles for the visible authors (still public)
    const authorEmails = sliced.map((r) => r.email);
    const profiles = await this.prisma.profile.findMany({
      where: {
        email: { in: authorEmails },
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
    const profileByEmail = new Map(profiles.map((p) => [p.email, p]));

    const entries: FeedEntry[] = sliced
      .map((row): FeedEntry | null => {
        const author = profileByEmail.get(row.email);
        if (!author?.username) return null;
        return {
          id: row.id,
          user: {
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
          },
          challenge: row.challenge,
          score: row.score,
          completedAt: row.completedAt,
        };
      })
      .filter((e): e is FeedEntry => e !== null);

    return { entries, nextCursor };
  }

  async getProfileIdByEmail(email: string): Promise<number | null> {
    const row = await this.prisma.profile.findUnique({
      where: { email },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async getProfileIdByUsername(username: string): Promise<number | null> {
    const row = await this.prisma.profile.findUnique({
      where: { username },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async block(
    blockerProfileId: number,
    blockedProfileId: number,
  ): Promise<boolean> {
    const result = await this.prisma.$transaction(async (tx) => {
      // Idempotent: if already blocked, no-op
      const existing = await tx.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: blockerProfileId,
            blockedId: blockedProfileId,
          },
        },
        select: { id: true },
      });
      if (existing) return false;

      await tx.block.create({
        data: { blockerId: blockerProfileId, blockedId: blockedProfileId },
      });

      // Mutual unfollow + decrement counters
      const blockerFollowsBlocked = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: blockerProfileId,
            followingId: blockedProfileId,
          },
        },
        select: { id: true },
      });
      if (blockerFollowsBlocked) {
        await tx.follow.delete({ where: { id: blockerFollowsBlocked.id } });
        await tx.profile.update({
          where: { id: blockerProfileId },
          data: { followingCount: { decrement: 1 } },
        });
        await tx.profile.update({
          where: { id: blockedProfileId },
          data: { followersCount: { decrement: 1 } },
        });
      }

      const blockedFollowsBlocker = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: blockedProfileId,
            followingId: blockerProfileId,
          },
        },
        select: { id: true },
      });
      if (blockedFollowsBlocker) {
        await tx.follow.delete({ where: { id: blockedFollowsBlocker.id } });
        await tx.profile.update({
          where: { id: blockedProfileId },
          data: { followingCount: { decrement: 1 } },
        });
        await tx.profile.update({
          where: { id: blockerProfileId },
          data: { followersCount: { decrement: 1 } },
        });
      }

      return true;
    });
    return result;
  }

  async unblock(
    blockerProfileId: number,
    blockedProfileId: number,
  ): Promise<boolean> {
    const deleted = await this.prisma.block.deleteMany({
      where: { blockerId: blockerProfileId, blockedId: blockedProfileId },
    });
    return deleted.count > 0;
  }

  async isBlockedEitherWay(
    profileIdA: number,
    profileIdB: number,
  ): Promise<boolean> {
    const row = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: profileIdA, blockedId: profileIdB },
          { blockerId: profileIdB, blockedId: profileIdA },
        ],
      },
      select: { id: true },
    });
    return !!row;
  }

  async blockedEitherWayAmong(
    viewerProfileId: number,
    targetProfileIds: number[],
  ): Promise<Set<number>> {
    if (targetProfileIds.length === 0) return new Set();
    const rows = await this.prisma.block.findMany({
      where: {
        OR: [
          {
            blockerId: viewerProfileId,
            blockedId: { in: targetProfileIds },
          },
          {
            blockedId: viewerProfileId,
            blockerId: { in: targetProfileIds },
          },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blocked = new Set<number>();
    for (const row of rows) {
      blocked.add(row.blockerId === viewerProfileId ? row.blockedId : row.blockerId);
    }
    return blocked;
  }

  async blockedEitherWayEmails(
    viewerProfileId: number,
    candidateEmails: string[],
  ): Promise<Set<string>> {
    if (candidateEmails.length === 0) return new Set();
    const candidateProfiles = await this.prisma.profile.findMany({
      where: { email: { in: candidateEmails } },
      select: { id: true, email: true },
    });
    const idByEmail = new Map(candidateProfiles.map((p) => [p.id, p.email]));
    const blockedIds = await this.blockedEitherWayAmong(
      viewerProfileId,
      [...idByEmail.keys()],
    );
    const blockedEmails = new Set<string>();
    for (const id of blockedIds) {
      const email = idByEmail.get(id);
      if (email) blockedEmails.add(email);
    }
    return blockedEmails;
  }

  async listBlocked(
    blockerProfileId: number,
    pagination: ListPaginationInput,
  ): Promise<BlockList> {
    const rows = await this.prisma.block.findMany({
      where: {
        blockerId: blockerProfileId,
        ...(pagination.cursor !== undefined && {
          id: { lt: pagination.cursor },
        }),
        blocked: { username: { not: null } },
      },
      orderBy: { id: 'desc' },
      take: pagination.limit + 1,
      select: {
        id: true,
        createdAt: true,
        blocked: {
          select: { username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    const hasMore = rows.length > pagination.limit;
    const sliced = hasMore ? rows.slice(0, pagination.limit) : rows;
    const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;
    const entries: BlockSummary[] = sliced
      .filter((r) => r.blocked.username !== null)
      .map((r) => ({
        username: r.blocked.username!,
        displayName: r.blocked.displayName,
        avatarUrl: r.blocked.avatarUrl,
        blockedAt: r.createdAt,
      }));
    return { entries, nextCursor };
  }

  private followSelect() {
    return {
      id: true,
      followerId: true,
      followingId: true,
      createdAt: true,
      follower: this.profileSelect(),
      following: this.profileSelect(),
    } as const;
  }

  private profileSelect() {
    return {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        email: true,
      },
    } as const;
  }

  private async toFollowList(
    rows: Array<{
      id: number;
      followerId: number;
      followingId: number;
      createdAt: Date;
      follower: {
        id: number;
        username: string | null;
        displayName: string | null;
        avatarUrl: string | null;
        bio: string | null;
        email: string;
      };
      following: {
        id: number;
        username: string | null;
        displayName: string | null;
        avatarUrl: string | null;
        bio: string | null;
        email: string;
      };
    }>,
    limit: number,
    side: 'follower' | 'following',
  ): Promise<FollowList> {
    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

    // Fetch streaks for the visible peers in one query.
    const peers = sliced.map((r) =>
      side === 'follower' ? r.follower : r.following,
    );
    const peerEmails = peers.map((p) => p.email);
    const streakRows = await this.prisma.challengeStreak.findMany({
      where: { email: { in: peerEmails } },
      select: { email: true, currentStreak: true },
    });
    const streakByEmail = new Map(
      streakRows.map((s) => [s.email, s.currentStreak]),
    );

    const entries: FollowSummary[] = sliced.map((row) => {
      const peer = side === 'follower' ? row.follower : row.following;
      return {
        username: peer.username ?? '',
        displayName: peer.displayName,
        avatarUrl: peer.avatarUrl,
        bio: peer.bio,
        currentStreak: streakByEmail.get(peer.email) ?? 0,
        followedAt: row.createdAt,
      };
    });
    return { entries, nextCursor };
  }
}
