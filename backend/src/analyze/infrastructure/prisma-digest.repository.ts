import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  DigestRepository,
  StoredDigest,
} from '../ports/digest.repository';
import type {
  DigestSourceHashes,
  ProfileDigest,
} from '../dto/profile-digest.dto';

@Injectable()
export class PrismaDigestRepository implements DigestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<StoredDigest | null> {
    const row = await this.prisma.profile.findUnique({
      where: { email },
      select: {
        digest: true,
        digestUpdatedAt: true,
        digestSourceHashes: true,
      },
    });
    if (!row || !row.digest || !row.digestUpdatedAt) return null;
    return {
      digest: row.digest as unknown as ProfileDigest,
      hashes:
        (row.digestSourceHashes as unknown as DigestSourceHashes | null) ??
        emptyHashes(),
      updatedAt: row.digestUpdatedAt,
    };
  }

  async save(
    email: string,
    digest: ProfileDigest,
    hashes: DigestSourceHashes,
  ): Promise<void> {
    // The profile row must already exist (created during onboarding). updateMany
    // is intentional: no-op if the user doesn't have a Profile yet, which lets
    // anonymous flows continue to work without crashing.
    await this.prisma.profile.updateMany({
      where: { email },
      data: {
        digest: digest as unknown as Prisma.InputJsonValue,
        digestUpdatedAt: new Date(),
        digestSourceHashes: hashes as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async invalidate(email: string): Promise<void> {
    await this.prisma.profile.updateMany({
      where: { email },
      data: {
        digest: Prisma.DbNull,
        digestUpdatedAt: null,
        digestSourceHashes: Prisma.DbNull,
      },
    });
  }
}

function emptyHashes(): DigestSourceHashes {
  return { cv: null, linkedin: null, githubUsername: null, portfolioUrl: null };
}
