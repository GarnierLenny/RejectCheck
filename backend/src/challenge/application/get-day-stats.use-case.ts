import { Inject, Injectable } from '@nestjs/common';
import { ATTEMPT_REPOSITORY } from '../ports/tokens';
import type { AttemptRepository } from '../ports/attempt.repository';
import type { DayStats } from '../domain/challenge.types';

@Injectable()
export class GetDayStatsUseCase {
  constructor(
    @Inject(ATTEMPT_REPOSITORY) private readonly attempts: AttemptRepository,
  ) {}

  execute(challengeId: number): Promise<DayStats> {
    return this.attempts.getDayStats(challengeId);
  }
}
