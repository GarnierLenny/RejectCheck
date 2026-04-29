import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { OptionalAuthEmail } from '../auth/optional-auth.decorator';
import { OptionalSupabaseGuard } from '../auth/optional-supabase.guard';

import { ListPaginationSchema } from './dto/social.dto';
import { FollowUseCase } from './application/follow.use-case';
import { UnfollowUseCase } from './application/unfollow.use-case';
import { ListMyFollowersUseCase } from './application/list-my-followers.use-case';
import { ListMyFollowingUseCase } from './application/list-my-following.use-case';
import { ListPublicFollowersUseCase } from './application/list-public-followers.use-case';
import { ListPublicFollowingUseCase } from './application/list-public-following.use-case';
import { SeenFollowersUseCase } from './application/seen-followers.use-case';
import { GetFeedUseCase } from './application/get-feed.use-case';
import { BlockUseCase } from './application/block.use-case';
import { UnblockUseCase } from './application/unblock.use-case';
import { ListBlockedUseCase } from './application/list-blocked.use-case';

@ApiTags('Social')
@Controller('api/social')
export class SocialController {
  constructor(
    private readonly followUc: FollowUseCase,
    private readonly unfollowUc: UnfollowUseCase,
    private readonly listMyFollowers: ListMyFollowersUseCase,
    private readonly listMyFollowing: ListMyFollowingUseCase,
    private readonly seenUc: SeenFollowersUseCase,
    private readonly feedUc: GetFeedUseCase,
    private readonly blockUc: BlockUseCase,
    private readonly unblockUc: UnblockUseCase,
    private readonly listBlockedUc: ListBlockedUseCase,
  ) {}

  @UseGuards(SupabaseGuard)
  @Post('follow/:username')
  @ApiOperation({ summary: 'Follow a user by username' })
  follow(@AuthEmail() email: string, @Param('username') username: string) {
    return this.followUc.execute(email, username);
  }

  @UseGuards(SupabaseGuard)
  @Delete('follow/:username')
  @ApiOperation({ summary: 'Unfollow a user by username' })
  unfollow(@AuthEmail() email: string, @Param('username') username: string) {
    return this.unfollowUc.execute(email, username);
  }

  @UseGuards(SupabaseGuard)
  @Get('me/followers')
  @ApiOperation({ summary: 'List my followers' })
  myFollowers(@AuthEmail() email: string, @Query() query: unknown) {
    const parsed = ListPaginationSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.listMyFollowers.execute(email, parsed.data);
  }

  @UseGuards(SupabaseGuard)
  @Get('me/following')
  @ApiOperation({ summary: 'List who I follow' })
  myFollowing(@AuthEmail() email: string, @Query() query: unknown) {
    const parsed = ListPaginationSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.listMyFollowing.execute(email, parsed.data);
  }

  @UseGuards(SupabaseGuard)
  @Post('me/seen-followers')
  @ApiOperation({
    summary: 'Mark followers list as seen (clears unread count)',
  })
  seenFollowers(@AuthEmail() email: string) {
    return this.seenUc.execute(email);
  }

  @UseGuards(SupabaseGuard)
  @Get('me/feed')
  @ApiOperation({
    summary:
      'Activity feed: recent finalized challenge attempts from people I follow',
  })
  feed(@AuthEmail() email: string, @Query() query: unknown) {
    const parsed = ListPaginationSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.feedUc.execute(email, parsed.data);
  }

  @UseGuards(SupabaseGuard)
  @Post('block/:username')
  @ApiOperation({
    summary: 'Block a user (mutual unfollow + future-follow blocked)',
  })
  block(@AuthEmail() email: string, @Param('username') username: string) {
    return this.blockUc.execute(email, username);
  }

  @UseGuards(SupabaseGuard)
  @Delete('block/:username')
  @ApiOperation({ summary: 'Unblock a previously-blocked user' })
  unblock(@AuthEmail() email: string, @Param('username') username: string) {
    return this.unblockUc.execute(email, username);
  }

  @UseGuards(SupabaseGuard)
  @Get('me/blocked')
  @ApiOperation({ summary: 'List users I have blocked' })
  myBlocked(@AuthEmail() email: string, @Query() query: unknown) {
    const parsed = ListPaginationSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.listBlockedUc.execute(email, parsed.data);
  }
}

@ApiTags('Public follow lists')
@Controller('api/u')
export class PublicFollowListsController {
  constructor(
    private readonly listPublicFollowers: ListPublicFollowersUseCase,
    private readonly listPublicFollowing: ListPublicFollowingUseCase,
  ) {}

  @UseGuards(OptionalSupabaseGuard)
  @Get(':username/followers')
  @ApiOperation({ summary: "List a public profile's followers" })
  followers(
    @Param('username') username: string,
    @OptionalAuthEmail() viewerEmail: string | undefined,
    @Query() query: unknown,
  ) {
    const parsed = ListPaginationSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.listPublicFollowers.execute(username, parsed.data, viewerEmail);
  }

  @UseGuards(OptionalSupabaseGuard)
  @Get(':username/following')
  @ApiOperation({ summary: 'List who a public profile follows' })
  following(
    @Param('username') username: string,
    @OptionalAuthEmail() viewerEmail: string | undefined,
    @Query() query: unknown,
  ) {
    const parsed = ListPaginationSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.listPublicFollowing.execute(username, parsed.data, viewerEmail);
  }
}
