import { Inject, Injectable } from '@nestjs/common';
import { PUBLIC_PROFILE_REPOSITORY } from '../ports/tokens';
import type { PublicProfileRepository } from '../ports/public-profile.repository';
import type { UpdatePublicSettingsInput } from '../domain/public-profile.types';

@Injectable()
export class UpdatePublicSettingsUseCase {
  constructor(
    @Inject(PUBLIC_PROFILE_REPOSITORY)
    private readonly repo: PublicProfileRepository,
  ) {}

  execute(
    email: string,
    input: UpdatePublicSettingsInput,
  ): Promise<{ isPublic: boolean; bio: string | null }> {
    return this.repo.updatePublicSettings(email, input);
  }
}
