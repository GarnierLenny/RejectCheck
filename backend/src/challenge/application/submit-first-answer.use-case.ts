import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ATTEMPT_COACH,
  ATTEMPT_REPOSITORY,
  CHALLENGE_REPOSITORY,
} from '../ports/tokens';
import type { ChallengeRepository } from '../ports/challenge.repository';
import type { AttemptRepository } from '../ports/attempt.repository';
import type { AttemptCoach } from '../ports/attempt-coach.provider';
import { isChallengeActiveOn } from '../domain/streak.policy';
import type { DailyChallenge } from '../domain/challenge.types';

export type SubmitFirstAnswerResult = {
  aiChallenge: string;
};

@Injectable()
export class SubmitFirstAnswerUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challenges: ChallengeRepository,
    @Inject(ATTEMPT_REPOSITORY)
    private readonly attempts: AttemptRepository,
    @Inject(ATTEMPT_COACH) private readonly coach: AttemptCoach,
  ) {}

  async execute(
    email: string,
    challengeId: number,
    firstAnswer: string,
  ): Promise<SubmitFirstAnswerResult> {
    const challenge = await this.loadActive(challengeId);

    const existing = await this.attempts.findByEmailAndChallenge(
      email,
      challengeId,
    );

    if (existing && existing.score > 0) {
      const stats = await this.attempts.getDayStats(challengeId);
      throw new ConflictException({
        code: 'ALREADY_COMPLETED',
        message: 'You already completed this challenge today.',
        attempt: {
          score: existing.score,
          scoreBreakdown: existing.scoreBreakdown,
          firstAnswer: existing.firstAnswer,
          secondAnswer: existing.secondAnswer,
          aiChallenge: existing.aiChallenge,
        },
        issues: challenge.issues,
        stats,
      });
    }

    if (existing && existing.aiChallenge) {
      throw new ConflictException({
        code: 'FIRST_ANSWER_PENDING',
        message: 'You already submitted a first answer — finish the challenge.',
        firstAnswer: existing.firstAnswer,
        aiChallenge: existing.aiChallenge,
      });
    }

    const aiChallenge = await this.coach.generateSocraticFollowup(
      challenge.snippet,
      challenge.issues,
      firstAnswer,
    );

    await this.attempts.upsertFirstAnswer({
      email,
      challengeId,
      firstAnswer,
      aiChallenge,
    });

    return { aiChallenge };
  }

  private async loadActive(challengeId: number): Promise<DailyChallenge> {
    const challenge = await this.challenges.findById(challengeId);
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (!isChallengeActiveOn(challenge.date, new Date())) {
      throw new BadRequestException('Challenge is not active today');
    }
    return challenge;
  }
}
