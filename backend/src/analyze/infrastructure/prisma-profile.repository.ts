import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileRepository } from '../ports/profile.repository';
import type { Profile, ProfileUpdate } from '../domain/analysis.types';

/**
 * Fields exposed to API consumers. Excludes `digest` (raw synthesis, internal
 * to the analyze flow) and `digestSourceHashes` (security: leaks hash info).
 * Only `digestUpdatedAt` is surfaced so the UI can render the sync indicator.
 */
const PROFILE_SAFE_SELECT = {
  id: true,
  email: true,
  username: true,
  usernameUpdatedAt: true,
  isPublic: true,
  bio: true,
  avatarUrl: true,
  displayName: true,
  githubUsername: true,
  linkedinUrl: true,
  portfolioUrl: true,
  socialLinks: true,
  coverLetterName: true,
  followersCount: true,
  followingCount: true,
  followersLastSeenAt: true,
  roleType: true,
  roleTypeOther: true,
  experienceLevel: true,
  techStack: true,
  languages: true,
  country: true,
  remotePreference: true,
  needsSponsorship: true,
  onboardedAt: true,
  onboardingSkipped: true,
  digestUpdatedAt: true,
  createdAt: true,
  updatedAt: true,
  totalChallengeScore: true,
  totalChallengeCount: true,
  totalXp: true,
  level: true,
} as const;

@Injectable()
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(
    email: string,
  ): Promise<{ profile: Profile; created: boolean }> {
    const existing = await this.prisma.profile.findUnique({
      where: { email },
      select: PROFILE_SAFE_SELECT,
    });
    if (existing) {
      return { profile: existing as unknown as Profile, created: false };
    }
    const profile = (await this.prisma.profile.create({
      data: { email },
      select: PROFILE_SAFE_SELECT,
    })) as unknown as Profile;
    return { profile, created: true };
  }

  findByEmail(email: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { email },
      select: PROFILE_SAFE_SELECT,
    }) as unknown as Promise<Profile | null>;
  }

  upsert(email: string, data: ProfileUpdate): Promise<Profile> {
    return this.prisma.profile.upsert({
      where: { email },
      update: data,
      create: { email, ...data },
      select: PROFILE_SAFE_SELECT,
    }) as unknown as Promise<Profile>;
  }
}
