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
  STREAK_REPOSITORY,
} from '../ports/tokens';
import type { ChallengeRepository } from '../ports/challenge.repository';
import type { AttemptRepository } from '../ports/attempt.repository';
import type { StreakRepository } from '../ports/streak.repository';
import type { AttemptCoach } from '../ports/attempt-coach.provider';
import { isChallengeActiveOn, nextStreakState } from '../domain/streak.policy';
import type {
  DailyChallenge,
  DayStats,
  StreakSummary,
} from '../domain/challenge.types';
import type { ChallengeIssue } from '../dto/challenge.dto';

export type SubmitFinalAnswerResult = {
  score: number;
  scoreBreakdown: {
    issues_found: number;
    explanation_quality: number;
    prioritization: number;
    bonus: number;
  };
  feedback: string;
  missed_issues: string[];
  issues: ChallengeIssue[];
  stats: DayStats;
  streak: StreakSummary;
};

@Injectable()
export class SubmitFinalAnswerUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challenges: ChallengeRepository,
    @Inject(ATTEMPT_REPOSITORY)
    private readonly attempts: AttemptRepository,
    @Inject(STREAK_REPOSITORY)
    private readonly streaks: StreakRepository,
    @Inject(ATTEMPT_COACH) private readonly coach: AttemptCoach,
  ) {}

  async execute(
    email: string,
    challengeId: number,
    secondAnswer: string,
  ): Promise<SubmitFinalAnswerResult> {
    const challenge = await this.loadActive(challengeId);

    const attempt = await this.attempts.findByEmailAndChallenge(
      email,
      challengeId,
    );
    if (!attempt || !attempt.aiChallenge) {
      throw new BadRequestException(
        'Submit the first answer before the final answer.',
      );
    }
    if (attempt.score > 0) {
      throw new ConflictException({
        code: 'ALREADY_COMPLETED',
        message: 'You already completed this challenge today.',
      });
    }

    const score = await this.coach.scoreAttempt(
      challenge.snippet,
      challenge.issues,
      attempt.firstAnswer,
      attempt.aiChallenge,
      secondAnswer,
    );

    await this.attempts.finalize({
      email,
      challengeId,
      secondAnswer,
      score: score.total,
      scoreBreakdown: {
        issues_found: score.issues_found,
        explanation_quality: score.explanation_quality,
        prioritization: score.prioritization,
        bonus: score.bonus,
        feedback: score.feedback,
        missed_issues: score.missed_issues,
      },
      completedAt: new Date(),
    });

    const streak = await this.advanceStreak(email);
    const stats = await this.attempts.getDayStats(challengeId);

    return {
      score: score.total,
      scoreBreakdown: {
        issues_found: score.issues_found,
        explanation_quality: score.explanation_quality,
        prioritization: score.prioritization,
        bonus: score.bonus,
      },
      feedback: score.feedback,
      missed_issues: score.missed_issues,
      issues: challenge.issues,
      stats,
      streak,
    };
  }

  private async advanceStreak(email: string): Promise<StreakSummary> {
    const current = await this.streaks.findByEmail(email);
    const next = nextStreakState(current, new Date());
    return this.streaks.upsert(email, next);
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
