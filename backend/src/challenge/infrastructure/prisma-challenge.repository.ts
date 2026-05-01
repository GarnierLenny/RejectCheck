import { Injectable } from '@nestjs/common';
import type { DailyChallenge as PrismaDailyChallenge } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ChallengeIssue, Difficulty } from '../dto/challenge.dto';
import type { DailyChallenge } from '../domain/challenge.types';
import { type ChallengeLanguage, type FocusTag } from '../domain/focus-tags';
import {
  type ChallengeRepository,
  type CreateDailyChallengeInput,
  DuplicateChallengeError,
} from '../ports/challenge.repository';

@Injectable()
export class PrismaChallengeRepository implements ChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDate(
    date: Date,
    language: ChallengeLanguage,
  ): Promise<DailyChallenge | null> {
    const row = await this.prisma.dailyChallenge.findUnique({
      where: { date_language: { date, language } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: number): Promise<DailyChallenge | null> {
    const row = await this.prisma.dailyChallenge.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  countByLanguage(language: ChallengeLanguage): Promise<number> {
    return this.prisma.dailyChallenge.count({ where: { language } });
  }

  async create(input: CreateDailyChallengeInput): Promise<DailyChallenge> {
    try {
      const created = await this.prisma.dailyChallenge.create({
        data: {
          date: input.date,
          language: input.language,
          title: input.title,
          focusTag: input.focusTag,
          difficulty: input.difficulty,
          snippet: input.snippet,
          question: input.question,
          issues: input.issues,
          whatToLookFor: input.whatToLookFor,
          hints: input.hints,
          estimatedTime: input.estimatedTime,
        },
      });
      return this.toDomain(created);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        (err as { code?: string }).code === 'P2002'
      ) {
        throw new DuplicateChallengeError();
      }
      throw err;
    }
  }

  private toDomain(row: PrismaDailyChallenge): DailyChallenge {
    return {
      id: row.id,
      date: row.date,
      language: row.language as ChallengeLanguage,
      title: row.title,
      focusTag: row.focusTag as FocusTag,
      difficulty: row.difficulty as Difficulty,
      snippet: row.snippet,
      question: row.question,
      // The schema stores issues as Prisma.JsonValue. They were written through
      // GeneratedChallengeSchema (Zod) and are reread as-is — cast is safe.
      issues: row.issues as unknown as ChallengeIssue[],
      // whatToLookFor / hints default to '[]' on insert; coerce null defensively.
      whatToLookFor: (row.whatToLookFor as unknown as string[] | null) ?? [],
      hints: (row.hints as unknown as string[] | null) ?? [],
      estimatedTime: row.estimatedTime,
    };
  }
}
