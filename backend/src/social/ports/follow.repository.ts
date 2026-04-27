import type {
  BlockList,
  Feed,
  FollowList,
  ListPaginationInput,
} from '../domain/social.types';

export type FollowResolution = {
  followerProfileId: number;
  followingProfileId: number;
  followingIsPublic: boolean;
  followingHasUsername: boolean;
};

export interface FollowRepository {
  /**
   * Resolves the follower (by email) and the target (by username) into
   * profile ids + privacy flags. Returns null if either is missing.
   */
  resolveFollow(
    followerEmail: string,
    followingUsername: string,
  ): Promise<FollowResolution | null>;

  /** Idempotent: returns true if a new row was created, false if it already existed. */
  follow(followerProfileId: number, followingProfileId: number): Promise<boolean>;

  /** Idempotent: returns true if a row was deleted. */
  unfollow(
    followerProfileId: number,
    followingProfileId: number,
  ): Promise<boolean>;

  /** True if `viewerProfileId` follows `targetProfileId`. */
  isFollowing(
    viewerProfileId: number,
    targetProfileId: number,
  ): Promise<boolean>;

  /** Bulk lookup used to annotate list rows with `isFollowing` for the viewer. */
  whichAreFollowedBy(
    viewerProfileId: number,
    targetProfileIds: number[],
  ): Promise<Set<number>>;

  /** People that profileId follows. */
  listFollowing(
    profileId: number,
    pagination: ListPaginationInput,
    options?: { onlyPublic?: boolean },
  ): Promise<FollowList>;

  /** People that follow profileId. */
  listFollowers(
    profileId: number,
    pagination: ListPaginationInput,
    options?: { onlyPublic?: boolean },
  ): Promise<FollowList>;

  /** Number of followers since the user's last visit to the followers page. */
  countUnreadFollowers(profileId: number): Promise<number>;

  /**
   * Activity feed: chronological list of finalized challenge attempts from
   * profiles that `viewerProfileId` follows. Filters to public profiles with
   * a username. Capped to 500 follows for query bounds.
   */
  listFeed(
    viewerProfileId: number,
    pagination: ListPaginationInput,
  ): Promise<Feed>;

  /** Mark the followers page as seen — clears the unread count. */
  markFollowersSeen(profileId: number): Promise<void>;

  /** Lookups used by the controller to pivot between email/username/profile id. */
  getProfileIdByEmail(email: string): Promise<number | null>;
  getProfileIdByUsername(username: string): Promise<number | null>;

  // ── Block primitives ────────────────────────────────────────────────────
  /**
   * Atomically: insert a Block row, remove any Follow rows in either direction,
   * decrement the corresponding counters. Returns false if already blocked.
   */
  block(blockerProfileId: number, blockedProfileId: number): Promise<boolean>;

  /** Returns true if a Block row was deleted. */
  unblock(blockerProfileId: number, blockedProfileId: number): Promise<boolean>;

  /** True if A blocks B OR B blocks A — either direction is fatal for follow / visibility. */
  isBlockedEitherWay(profileIdA: number, profileIdB: number): Promise<boolean>;

  /** Bulk filter: returns the subset of `targetProfileIds` blocked by viewer (in either direction). */
  blockedEitherWayAmong(
    viewerProfileId: number,
    targetProfileIds: number[],
  ): Promise<Set<number>>;

  /** Bulk filter by email (used by feed/leaderboard which key on email). */
  blockedEitherWayEmails(
    viewerProfileId: number,
    candidateEmails: string[],
  ): Promise<Set<string>>;

  /** Paginated list of users I have blocked. */
  listBlocked(
    blockerProfileId: number,
    pagination: ListPaginationInput,
  ): Promise<BlockList>;
}
