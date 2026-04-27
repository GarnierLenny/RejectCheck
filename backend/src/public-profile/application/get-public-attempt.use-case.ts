import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PUBLIC_PROFILE_REPOSITORY } from '../ports/tokens';
import type { PublicProfileRepository } from '../ports/public-profile.repository';
import type { PublicAttemptView } from '../domain/public-profile.types';

@Injectable()
export class GetPublicAttemptUseCase {
  constructor(
    @Inject(PUBLIC_PROFILE_REPOSITORY)
    private readonly repo: PublicProfileRepository,
  ) {}

  async execute(
    rawUsername: string,
    challengeId: number,
  ): Promise<PublicAttemptView> {
    const username = rawUsername.toLowerCase();
    const view = await this.repo.findAttempt(username, challengeId);
    if (!view) throw new NotFoundException('Attempt not found');
    return view;
  }
}
