import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SUBSCRIPTION_GATE } from '../common/ports/tokens';
import type { SubscriptionGate } from '../common/ports/subscription.gate';
import { PremiumRequiredException } from '../common/exceptions';
import { GeminiService } from './gemini.service';
import { ClaudeService } from './claude.service';
import { ChallengeIssue, DIFFICULTIES, Difficulty } from './dto/challenge.dto';
import {
  ChallengeLanguage,
  DEFAULT_LANGUAGE,
  FocusTag,
  getTagsForLanguage,
} from './focus-tags';

function startOfDayUtc(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function daysBetweenUtc(a: Date, b: Date): number {
  const ms = startOfDayUtc(a).getTime() - startOfDayUtc(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function stripIssues<T extends { issues: unknown }>(
  challenge: T,
): Omit<T, 'issues'> {
  const { issues: _issues, ...rest } = challenge;
  return rest;
}

@Injectable()
export class ChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SUBSCRIPTION_GATE)
    private readonly subscription: SubscriptionGate,
    private readonly gemini: GeminiService,
    private readonly claude: ClaudeService,
  ) {}

  private async pickFocusTagAndDifficulty(
    language: ChallengeLanguage,
  ): Promise<{ focusTag: FocusTag; difficulty: Difficulty }> {
    const count = await this.prisma.dailyChallenge.count({
      where: { language },
    });
    const tags = getTagsForLanguage(language);
    const focusTag = tags[count % tags.length];
    const difficulty =
      DIFFICULTIES[Math.floor(count / tags.length) % DIFFICULTIES.length];
    return { focusTag, difficulty };
  }

  async getTodayChallenge(language: ChallengeLanguage = DEFAULT_LANGUAGE) {
    const today = startOfDayUtc(new Date());

    const existing = await this.prisma.dailyChallenge.findUnique({
      where: { date_language: { date: today, language } },
    });
    if (existing) return stripIssues(existing);

    const { focusTag, difficulty } =
      await this.pickFocusTagAndDifficulty(language);
    const generated = await this.claude.generateChallenge(
      language,
      focusTag,
      difficulty,
    );

    try {
      const created = await this.prisma.dailyChallenge.create({
        data: {
          date: today,
          language,
          title: generated.title,
          focusTag,
          difficulty,
          snippet: generated.snippet,
          question: generated.question,
          issues: generated.issues,
          estimatedTime: generated.estimatedTime,
        },
      });
      return stripIssues(created);
    } catch (err: any) {
      // Concurrent generation on same day — re-read.
      if (err.code === 'P2002') {
        const race = await this.prisma.dailyChallenge.findUnique({
          where: { date_language: { date: today, language } },
        });
        if (race) return stripIssues(race);
      }
      throw err;
    }
  }

  private async loadChallengeOrThrow(challengeId: number) {
    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    const today = startOfDayUtc(new Date());
    if (startOfDayUtc(challenge.date).getTime() !== today.getTime()) {
      throw new BadRequestException('Challenge is not active today');
    }
    return challenge;
  }

  async submitFirstAnswer(
    email: string,
    challengeId: number,
    firstAnswer: string,
  ) {
    const challenge = await this.loadChallengeOrThrow(challengeId);

    const existing = await this.prisma.challengeAttempt.findUnique({
      where: { email_challengeId: { email, challengeId } },
    });

    if (existing && existing.score > 0) {
      const stats = await this.getDayStats(challengeId);
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

    const aiChallenge = await this.gemini.generateSocraticFollowup(
      challenge.snippet,
      challenge.issues as unknown as ChallengeIssue[],
      firstAnswer,
    );

    await this.prisma.challengeAttempt.upsert({
      where: { email_challengeId: { email, challengeId } },
      create: {
        email,
        challengeId,
        firstAnswer,
        aiChallenge,
        score: 0,
        scoreBreakdown: {},
      },
      update: {
        firstAnswer,
        aiChallenge,
      },
    });

    return { aiChallenge };
  }

  async submitFinalAnswer(
    email: string,
    challengeId: number,
    secondAnswer: string,
  ) {
    const challenge = await this.loadChallengeOrThrow(challengeId);

    const attempt = await this.prisma.challengeAttempt.findUnique({
      where: { email_challengeId: { email, challengeId } },
    });

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

    const score = await this.gemini.scoreAttempt(
      challenge.snippet,
      challenge.issues as unknown as ChallengeIssue[],
      attempt.firstAnswer,
      attempt.aiChallenge,
      secondAnswer,
    );

    await this.prisma.challengeAttempt.update({
      where: { email_challengeId: { email, challengeId } },
      data: {
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
      },
    });

    const streak = await this.updateStreak(email);
    const stats = await this.getDayStats(challengeId);

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

  private async updateStreak(email: string) {
    const today = startOfDayUtc(new Date());
    const existing = await this.prisma.challengeStreak.findUnique({
      where: { email },
    });

    if (!existing) {
      return this.prisma.challengeStreak.create({
        data: {
          email,
          currentStreak: 1,
          longestStreak: 1,
          lastCompletedAt: today,
        },
      });
    }

    if (existing.lastCompletedAt) {
      const last = startOfDayUtc(existing.lastCompletedAt);
      if (last.getTime() === today.getTime()) {
        return existing; // Already counted today — defensive.
      }
      const gap = daysBetweenUtc(today, last);
      const next = gap === 1 ? existing.currentStreak + 1 : 1;
      return this.prisma.challengeStreak.update({
        where: { email },
        data: {
          currentStreak: next,
          longestStreak: Math.max(existing.longestStreak, next),
          lastCompletedAt: today,
        },
      });
    }

    return this.prisma.challengeStreak.update({
      where: { email },
      data: {
        currentStreak: 1,
        longestStreak: Math.max(existing.longestStreak, 1),
        lastCompletedAt: today,
      },
    });
  }

  async getDayStats(challengeId: number) {
    const attempts = await this.prisma.challengeAttempt.findMany({
      where: { challengeId, score: { gt: 0 } },
      select: { score: true },
    });
    const completions = attempts.length;
    const averageScore =
      completions === 0
        ? 0
        : Math.round(attempts.reduce((a, b) => a + b.score, 0) / completions);
    const scoreDistribution = Array(10).fill(0) as number[];
    for (const a of attempts) {
      const bucket = Math.min(9, Math.floor(a.score / 10));
      scoreDistribution[bucket] += 1;
    }
    return { completions, averageScore, scoreDistribution };
  }

  async getUserStreak(email: string) {
    const streak = await this.prisma.challengeStreak.findUnique({
      where: { email },
    });
    if (!streak) {
      return { currentStreak: 0, longestStreak: 0, lastCompletedAt: null };
    }
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastCompletedAt: streak.lastCompletedAt,
    };
  }

  async getHistory(email: string) {
    const hasAccess = await this.subscription.isPremium(email);
    if (!hasAccess) {
      throw new PremiumRequiredException(
        'SHORTLISTED plan required to view challenge history.',
      );
    }
    return this.prisma.challengeAttempt.findMany({
      where: { email, score: { gt: 0 } },
      orderBy: { completedAt: 'desc' },
      take: 30,
      include: {
        challenge: {
          select: {
            id: true,
            date: true,
            language: true,
            title: true,
            focusTag: true,
            difficulty: true,
            estimatedTime: true,
          },
        },
      },
    });
  }
}
