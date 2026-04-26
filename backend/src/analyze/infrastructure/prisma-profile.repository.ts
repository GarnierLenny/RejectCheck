import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProfileRepository } from '../ports/profile.repository';
import type { Profile, ProfileUpdate } from '../domain/analysis.types';

@Injectable()
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(email: string): Promise<Profile> {
    const existing = await this.prisma.profile.findUnique({ where: { email } });
    if (existing) return existing;
    return this.prisma.profile.create({ data: { email } });
  }

  findByEmail(email: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { email } });
  }

  upsert(email: string, data: ProfileUpdate): Promise<Profile> {
    return this.prisma.profile.upsert({
      where: { email },
      update: data,
      create: { email, ...data },
    });
  }
}
