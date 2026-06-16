import type { Profile, ProfileUpdate } from '../domain/analysis.types';

export interface ProfileRepository {
  /**
   * Returns the profile row, creating an empty one on first access. `created`
   * is true only on the call that actually inserted the row — callers use it to
   * fire once-per-user side effects (e.g. the welcome email).
   */
  findOrCreate(email: string): Promise<{ profile: Profile; created: boolean }>;
  /** Read-only lookup (no auto-create). Returns null if missing. */
  findByEmail(email: string): Promise<Profile | null>;
  upsert(email: string, data: ProfileUpdate): Promise<Profile>;
}
