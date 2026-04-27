import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PUBLIC_PROFILE_REPOSITORY } from '../ports/tokens';
import type { PublicProfileRepository } from '../ports/public-profile.repository';
import type { PublicProfileView } from '../domain/public-profile.types';

@Injectable()
export class GetPublicProfileUseCase {
  constructor(
    @Inject(PUBLIC_PROFILE_REPOSITORY)
    private readonly repo: PublicProfileRepository,
  ) {}

  async execute(
    rawUsername: string,
    viewerEmail?: string,
  ): Promise<PublicProfileView> {
    const username = rawUsername.toLowerCase();
    const view = await this.repo.findByUsername(username, viewerEmail);
    if (!view) throw new NotFoundException('Profile not found');
    return view;
  }
}
