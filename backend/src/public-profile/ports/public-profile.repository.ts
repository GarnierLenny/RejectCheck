import type {
  PublicActivityEntry,
  PublicAttemptView,
  PublicProfileView,
  UpdatePublicSettingsInput,
} from '../domain/public-profile.types';

export interface PublicProfileRepository {
  /**
   * Returns null when the username is unknown OR the profile is private.
   * If `viewerEmail` is provided, fills `isFollowing` (false when viewer is owner).
   */
  findByUsername(
    username: string,
    viewerEmail?: string,
  ): Promise<PublicProfileView | null>;

  /** Returns [] when the username is unknown OR the profile is private. */
  listActivity(username: string, since: Date): Promise<PublicActivityEntry[]>;

  /**
   * Returns a finalized challenge attempt by a public profile, used by the
   * per-challenge share page. Null when profile is missing/private OR the
   * attempt isn't finalized (score = 0).
   */
  findAttempt(
    username: string,
    challengeId: number,
  ): Promise<PublicAttemptView | null>;

  /**
   * Set the username for the given email. Throws on uniqueness conflict
   * (Prisma P2002) — caller should map to ConflictException.
   */
  claimUsername(email: string, username: string): Promise<void>;

  /**
   * Returns the current username + last update timestamp for the email's
   * profile. Used by the use case to enforce rate-limiting of username
   * changes. Returns null when the user has no Profile row yet.
   */
  getOwnerStatus(email: string): Promise<{
    username: string | null;
    usernameUpdatedAt: Date | null;
  } | null>;

  updatePublicSettings(
    email: string,
    input: UpdatePublicSettingsInput,
  ): Promise<{ isPublic: boolean; bio: string | null }>;
}
