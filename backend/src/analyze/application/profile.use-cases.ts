import { Inject, Injectable, Logger } from '@nestjs/common';
import { PROFILE_REPOSITORY } from '../ports/tokens';
import type { ProfileRepository } from '../ports/profile.repository';
import type { Profile, ProfileUpdate } from '../domain/analysis.types';
import { FOLLOW_REPOSITORY } from '../../social/ports/tokens';
import type { FollowRepository } from '../../social/ports/follow.repository';
import { EnqueueEmailUseCase } from '../../notifications/application/enqueue-email.use-case';
import { ScheduleDripsUseCase } from '../../notifications/application/schedule-drips.use-case';
import type { EmailLocale } from '../../notifications/domain/email.types';

@Injectable()
export class GetProfileUseCase {
  private readonly logger = new Logger(GetProfileUseCase.name);

  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    private readonly enqueueEmail: EnqueueEmailUseCase,
    private readonly scheduleDrips: ScheduleDripsUseCase,
  ) {}

  async execute(email: string, locale: EmailLocale = 'en'): Promise<Profile> {
    const { profile, created } = await this.profiles.findOrCreate(email);

    // First time the backend persists this user (covers email + OAuth signups):
    // fire the welcome email + schedule the D1/D3 drip sequence. Fire-and-forget
    // + idempotent (dedupe on welcome:email / drip_*:email), so it never blocks
    // or fails the profile load and never double-fires.
    if (created) {
      void this.enqueueEmail
        .execute({
          to: email,
          locale,
          context: { type: 'welcome', firstName: profile.displayName },
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`welcome enqueue failed for ${email}: ${msg}`);
        });
      void this.scheduleDrips.execute(email, locale).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`drip scheduling failed for ${email}: ${msg}`);
      });
    }

    const unreadFollowersCount = await this.follows.countUnreadFollowers(
      profile.id,
    );
    return { ...profile, unreadFollowersCount };
  }
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
  ) {}

  execute(email: string, data: ProfileUpdate): Promise<Profile> {
    return this.profiles.upsert(email, data);
  }
}
