import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLIC_PROFILE_REPOSITORY } from '../ports/tokens';
import type { PublicProfileRepository } from '../ports/public-profile.repository';

const RATE_LIMIT_DAYS = 30;
const RATE_LIMIT_MS = RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000;

@Injectable()
export class ClaimUsernameUseCase {
  constructor(
    @Inject(PUBLIC_PROFILE_REPOSITORY)
    private readonly repo: PublicProfileRepository,
  ) {}

  async execute(email: string, username: string): Promise<{ username: string }> {
    // Re-claiming the same username is a no-op — don't reset the rate-limit clock.
    const status = await this.repo.getOwnerStatus(email);
    if (status?.username === username) {
      return { username };
    }
    if (status?.usernameUpdatedAt) {
      const elapsed = Date.now() - status.usernameUpdatedAt.getTime();
      if (elapsed < RATE_LIMIT_MS) {
        const retryAt = new Date(
          status.usernameUpdatedAt.getTime() + RATE_LIMIT_MS,
        );
        throw new HttpException(
          {
            code: 'USERNAME_RATE_LIMITED',
            message: `You can only change your username once every ${RATE_LIMIT_DAYS} days`,
            retryAt: retryAt.toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    try {
      await this.repo.claimUsername(email, username);
      return { username };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Username already taken');
      }
      throw err;
    }
  }
}
