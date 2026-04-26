import type { Profile, ProfileUpdate } from '../domain/analysis.types';

export interface ProfileRepository {
  /** Returns the profile row, creating an empty one on first access. */
  findOrCreate(email: string): Promise<Profile>;
  /** Read-only lookup (no auto-create). Returns null if missing. */
  findByEmail(email: string): Promise<Profile | null>;
  upsert(email: string, data: ProfileUpdate): Promise<Profile>;
}
