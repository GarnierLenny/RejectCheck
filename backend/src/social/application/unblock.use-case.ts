import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';

@Injectable()
export class UnblockUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(
    blockerEmail: string,
    rawUsername: string,
  ): Promise<{ ok: true; removed: boolean }> {
    const username = rawUsername.toLowerCase();
    const [blockerId, blockedId] = await Promise.all([
      this.repo.getProfileIdByEmail(blockerEmail),
      this.repo.getProfileIdByUsername(username),
    ]);
    if (!blockerId || !blockedId) {
      throw new NotFoundException('Profile not found');
    }
    const removed = await this.repo.unblock(blockerId, blockedId);
    return { ok: true, removed };
  }
}
