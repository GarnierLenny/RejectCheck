import { Inject, Injectable } from '@nestjs/common';
import { PUBLIC_PROFILE_REPOSITORY } from '../ports/tokens';
import type { PublicProfileRepository } from '../ports/public-profile.repository';
import type { PublicActivityEntry } from '../domain/public-profile.types';

const ACTIVITY_DAYS = 365;

@Injectable()
export class GetPublicActivityUseCase {
  constructor(
    @Inject(PUBLIC_PROFILE_REPOSITORY)
    private readonly repo: PublicProfileRepository,
  ) {}

  execute(rawUsername: string): Promise<PublicActivityEntry[]> {
    const username = rawUsername.toLowerCase();
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - ACTIVITY_DAYS);
    since.setUTCHours(0, 0, 0, 0);
    return this.repo.listActivity(username, since);
  }
}
