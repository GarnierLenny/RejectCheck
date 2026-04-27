import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import {
  PublicProfileController,
  ProfileSettingsController,
} from './public-profile.controller';

import { PUBLIC_PROFILE_REPOSITORY } from './ports/tokens';
import { PrismaPublicProfileRepository } from './infrastructure/prisma-public-profile.repository';

import { GetPublicProfileUseCase } from './application/get-public-profile.use-case';
import { GetPublicActivityUseCase } from './application/get-public-activity.use-case';
import { ClaimUsernameUseCase } from './application/claim-username.use-case';
import { UpdatePublicSettingsUseCase } from './application/update-public-settings.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [PublicProfileController, ProfileSettingsController],
  providers: [
    {
      provide: PUBLIC_PROFILE_REPOSITORY,
      useClass: PrismaPublicProfileRepository,
    },
    GetPublicProfileUseCase,
    GetPublicActivityUseCase,
    ClaimUsernameUseCase,
    UpdatePublicSettingsUseCase,
  ],
})
export class PublicProfileModule {}
