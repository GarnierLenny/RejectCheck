import { Inject, Injectable } from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';
import type { FollowList, ListPaginationInput } from '../domain/social.types';

@Injectable()
export class ListMyFollowingUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(
    viewerEmail: string,
    pagination: ListPaginationInput,
  ): Promise<FollowList> {
    const myId = await this.repo.getProfileIdByEmail(viewerEmail);
    if (!myId) return { entries: [], nextCursor: null };
    return this.repo.listFollowing(myId, pagination);
  }
}
