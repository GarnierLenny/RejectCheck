import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { OptionalSupabaseGuard } from '../auth/optional-supabase.guard';
import { OptionalAuthEmail } from '../auth/optional-auth.decorator';

import {
  ClaimUsernameSchema,
  UpdatePublicSettingsSchema,
} from './dto/public-profile.dto';

import { GetPublicProfileUseCase } from './application/get-public-profile.use-case';
import { GetPublicActivityUseCase } from './application/get-public-activity.use-case';
import { ClaimUsernameUseCase } from './application/claim-username.use-case';
import { UpdatePublicSettingsUseCase } from './application/update-public-settings.use-case';

@ApiTags('Public profile')
@Controller('api/u')
export class PublicProfileController {
  constructor(
    private readonly getProfileUc: GetPublicProfileUseCase,
    private readonly getActivityUc: GetPublicActivityUseCase,
  ) {}

  @UseGuards(OptionalSupabaseGuard)
  @Get(':username')
  @ApiOperation({ summary: 'Get a public profile by username' })
  getProfile(
    @Param('username') username: string,
    @OptionalAuthEmail() viewerEmail: string | undefined,
  ) {
    return this.getProfileUc.execute(username, viewerEmail);
  }

  @Get(':username/activity')
  @ApiOperation({
    summary: 'Get the 365-day challenge activity for a public profile',
  })
  getActivity(@Param('username') username: string) {
    return this.getActivityUc.execute(username);
  }
}

@ApiTags('Profile settings')
@Controller('api/profile')
export class ProfileSettingsController {
  constructor(
    private readonly claimUsernameUc: ClaimUsernameUseCase,
    private readonly updateSettingsUc: UpdatePublicSettingsUseCase,
  ) {}

  @UseGuards(SupabaseGuard)
  @Post('claim-username')
  @ApiOperation({
    summary: "Claim or change the authenticated user's username",
  })
  claimUsername(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = ClaimUsernameSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.claimUsernameUc.execute(email, parsed.data.username);
  }

  @UseGuards(SupabaseGuard)
  @Post('public-settings')
  @ApiOperation({ summary: 'Update isPublic flag and bio' })
  updateSettings(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = UpdatePublicSettingsSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.updateSettingsUc.execute(email, parsed.data);
  }
}
