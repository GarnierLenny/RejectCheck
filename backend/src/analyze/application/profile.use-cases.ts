import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_REPOSITORY } from '../ports/tokens';
import type { ProfileRepository } from '../ports/profile.repository';
import type { Profile, ProfileUpdate } from '../domain/analysis.types';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
  ) {}

  execute(email: string): Promise<Profile> {
    return this.profiles.findOrCreate(email);
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
