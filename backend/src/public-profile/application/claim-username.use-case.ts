import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLIC_PROFILE_REPOSITORY } from '../ports/tokens';
import type { PublicProfileRepository } from '../ports/public-profile.repository';

@Injectable()
export class ClaimUsernameUseCase {
  constructor(
    @Inject(PUBLIC_PROFILE_REPOSITORY)
    private readonly repo: PublicProfileRepository,
  ) {}

  async execute(
    email: string,
    username: string,
  ): Promise<{ username: string }> {
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
