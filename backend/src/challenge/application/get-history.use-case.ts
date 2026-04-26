import { Inject, Injectable } from '@nestjs/common';
import { ATTEMPT_REPOSITORY } from '../ports/tokens';
import type { AttemptRepository } from '../ports/attempt.repository';
import type { AttemptHistoryItem } from '../domain/challenge.types';

const HISTORY_LIMIT = 30;

/**
 * Premium gating is enforced at the route level via @RequiresPremium() — see
 * ChallengeController. The use case only owns the data access concern.
 */
@Injectable()
export class GetHistoryUseCase {
  constructor(
    @Inject(ATTEMPT_REPOSITORY) private readonly attempts: AttemptRepository,
  ) {}

  execute(email: string): Promise<AttemptHistoryItem[]> {
    return this.attempts.listHistory(email, HISTORY_LIMIT);
  }
}
