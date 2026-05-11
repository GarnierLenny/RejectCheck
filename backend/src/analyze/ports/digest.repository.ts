import type {
  DigestSourceHashes,
  ProfileDigest,
} from '../dto/profile-digest.dto';

/**
 * A stored ProfileDigest snapshot, plus the source hashes that produced it.
 * Hash comparison (against the current source hashes) tells callers whether
 * the digest is stale and needs regeneration.
 */
export type StoredDigest = {
  digest: ProfileDigest;
  hashes: DigestSourceHashes;
  updatedAt: Date;
};

export interface DigestRepository {
  /** Returns null if no digest has been generated for this user yet. */
  findByEmail(email: string): Promise<StoredDigest | null>;

  /** Upserts the digest on the user's Profile row. Idempotent. */
  save(
    email: string,
    digest: ProfileDigest,
    hashes: DigestSourceHashes,
  ): Promise<void>;

  /** Wipes the stored digest + hashes. Used when the user resets their profile. */
  invalidate(email: string): Promise<void>;
}
