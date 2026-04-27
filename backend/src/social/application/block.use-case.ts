import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FOLLOW_REPOSITORY } from '../ports/tokens';
import type { FollowRepository } from '../ports/follow.repository';

@Injectable()
export class BlockUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly repo: FollowRepository,
  ) {}

  async execute(
    blockerEmail: string,
    rawUsername: string,
  ): Promise<{ ok: true; created: boolean }> {
    const username = rawUsername.toLowerCase();
    const [blockerId, blockedId] = await Promise.all([
      this.repo.getProfileIdByEmail(blockerEmail),
      this.repo.getProfileIdByUsername(username),
    ]);
    if (!blockerId || !blockedId) {
      throw new NotFoundException('Profile not found');
    }
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }
    const created = await this.repo.block(blockerId, blockedId);
    return { ok: true, created };
  }
}
