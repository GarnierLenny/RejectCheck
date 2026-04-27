import type {
  PublicActivityEntry,
  PublicProfileView,
  UpdatePublicSettingsInput,
} from '../domain/public-profile.types';

export interface PublicProfileRepository {
  /** Returns null when the username is unknown OR the profile is private. */
  findByUsername(username: string): Promise<PublicProfileView | null>;

  /** Returns [] when the username is unknown OR the profile is private. */
  listActivity(username: string, since: Date): Promise<PublicActivityEntry[]>;

  /**
   * Set the username for the given email. Throws on uniqueness conflict
   * (Prisma P2002) — caller should map to ConflictException.
   */
  claimUsername(email: string, username: string): Promise<void>;

  updatePublicSettings(
    email: string,
    input: UpdatePublicSettingsInput,
  ): Promise<{ isPublic: boolean; bio: string | null }>;
}
