import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import {
  SocialController,
  PublicFollowListsController,
} from './social.controller';

import { FOLLOW_REPOSITORY } from './ports/tokens';
import { PrismaFollowRepository } from './infrastructure/prisma-follow.repository';

import { FollowUseCase } from './application/follow.use-case';
import { UnfollowUseCase } from './application/unfollow.use-case';
import { ListMyFollowersUseCase } from './application/list-my-followers.use-case';
import { ListMyFollowingUseCase } from './application/list-my-following.use-case';
import { ListPublicFollowersUseCase } from './application/list-public-followers.use-case';
import { ListPublicFollowingUseCase } from './application/list-public-following.use-case';
import { SeenFollowersUseCase } from './application/seen-followers.use-case';
import { GetFeedUseCase } from './application/get-feed.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [SocialController, PublicFollowListsController],
  providers: [
    { provide: FOLLOW_REPOSITORY, useClass: PrismaFollowRepository },
    FollowUseCase,
    UnfollowUseCase,
    ListMyFollowersUseCase,
    ListMyFollowingUseCase,
    ListPublicFollowersUseCase,
    ListPublicFollowingUseCase,
    SeenFollowersUseCase,
    GetFeedUseCase,
  ],
  exports: [FOLLOW_REPOSITORY],
})
export class SocialModule {}
