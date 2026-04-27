import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_REPOSITORY } from '../ports/tokens';
import type { ProfileRepository } from '../ports/profile.repository';
import type { Profile, ProfileUpdate } from '../domain/analysis.types';
import { FOLLOW_REPOSITORY } from '../../social/ports/tokens';
import type { FollowRepository } from '../../social/ports/follow.repository';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
  ) {}

  async execute(email: string): Promise<Profile> {
    const profile = await this.profiles.findOrCreate(email);
    const unreadFollowersCount = await this.follows.countUnreadFollowers(
      profile.id,
    );
    return { ...profile, unreadFollowersCount };
  }
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
  ) {}

  execute(email: string, data: ProfileUpdate): Promise<Profile> {
    return this.profiles.upsert(email, data);
  }
}
