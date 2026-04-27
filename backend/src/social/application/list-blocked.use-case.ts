import { Inject, Injectable } from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';
import type { BlockList, ListPaginationInput } from '../domain/social.types';

@Injectable()
export class ListBlockedUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(
    viewerEmail: string,
    pagination: ListPaginationInput,
  ): Promise<BlockList> {
    const myId = await this.repo.getProfileIdByEmail(viewerEmail);
    if (!myId) return { entries: [], nextCursor: null };
    return this.repo.listBlocked(myId, pagination);
  }
}
