import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';

@Injectable()
export class UnfollowUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(
    followerEmail: string,
    rawUsername: string,
  ): Promise<{ ok: true; removed: boolean }> {
    const username = rawUsername.toLowerCase();
    const resolution = await this.repo.resolveFollow(followerEmail, username);
    if (!resolution || !resolution.followingHasUsername) {
      throw new NotFoundException('Profile not found');
    }
    const removed = await this.repo.unfollow(
      resolution.followerProfileId,
      resolution.followingProfileId,
    );
    return { ok: true, removed };
  }
}
