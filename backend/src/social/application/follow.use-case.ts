import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';

@Injectable()
export class FollowUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(
    followerEmail: string,
    rawUsername: string,
  ): Promise<{ ok: true; created: boolean }> {
    const username = rawUsername.toLowerCase();
    const resolution = await this.repo.resolveFollow(followerEmail, username);
    if (!resolution || !resolution.followingHasUsername) {
      throw new NotFoundException('Profile not found');
    }
    if (resolution.followerProfileId === resolution.followingProfileId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    if (!resolution.followingIsPublic) {
      throw new ForbiddenException('Cannot follow a private profile');
    }
    const blocked = await this.repo.isBlockedEitherWay(
      resolution.followerProfileId,
      resolution.followingProfileId,
    );
    if (blocked) {
      throw new ForbiddenException('Cannot follow a blocked profile');
    }
    const created = await this.repo.follow(
      resolution.followerProfileId,
      resolution.followingProfileId,
    );
    return { ok: true, created };
  }
}
