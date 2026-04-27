import { Inject, Injectable } from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';

@Injectable()
export class SeenFollowersUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(viewerEmail: string): Promise<{ ok: true }> {
    const myId = await this.repo.getProfileIdByEmail(viewerEmail);
    if (myId) await this.repo.markFollowersSeen(myId);
    return { ok: true };
  }
}
