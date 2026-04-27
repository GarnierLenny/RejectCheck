import type {
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
}
