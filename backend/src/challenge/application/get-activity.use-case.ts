import { Inject, Injectable } from '@nestjs/common';
import { ATTEMPT_REPOSITORY } from '../ports/tokens';
import type {
  ActivityEntry,
  AttemptRepository,
} from '../ports/attempt.repository';

const ACTIVITY_DAYS = 365;

@Injectable()
export class GetActivityUseCase {
  constructor(
    @Inject(ATTEMPT_REPOSITORY) private readonly attempts: AttemptRepository,
  ) {}

  execute(email: string): Promise<ActivityEntry[]> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - ACTIVITY_DAYS);
    since.setUTCHours(0, 0, 0, 0);
    return this.attempts.listActivity(email, since);
  }
}
