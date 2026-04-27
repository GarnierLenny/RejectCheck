import { Inject, Injectable } from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';
import type { Feed, ListPaginationInput } from '../domain/social.types';

@Injectable()
export class GetFeedUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(
    viewerEmail: string,
    pagination: ListPaginationInput,
  ): Promise<Feed> {
    const myId = await this.repo.getProfileIdByEmail(viewerEmail);
    if (!myId) return { entries: [], nextCursor: null };
    return this.repo.listFeed(myId, pagination);
  }
}
