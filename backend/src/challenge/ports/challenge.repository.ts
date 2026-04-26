import type { DailyChallenge } from '../domain/challenge.types';
import type { ChallengeLanguage } from '../domain/focus-tags';
import type { GeneratedChallenge, Difficulty } from '../dto/challenge.dto';
import type { FocusTag } from '../domain/focus-tags';

export type CreateDailyChallengeInput = GeneratedChallenge & {
  date: Date;
  language: ChallengeLanguage;
  focusTag: FocusTag;
  difficulty: Difficulty;
};

export interface ChallengeRepository {
  findByDate(
    date: Date,
    language: ChallengeLanguage,
  ): Promise<DailyChallenge | null>;

  findById(id: number): Promise<DailyChallenge | null>;

  /**
   * Counts existing challenges in this language. Used to deterministically
   * rotate (focusTag, difficulty) for new generations.
   */
  countByLanguage(language: ChallengeLanguage): Promise<number>;

  /**
   * Creates today's challenge. Throws a DuplicateChallengeError when another
   * concurrent request has already created the same (date, language) row;
   * callers must catch and re-read.
   */
  create(input: CreateDailyChallengeInput): Promise<DailyChallenge>;
}

/**
 * Sentinel error so use cases can recognise the (date, language) unique
 * conflict without leaking Prisma error codes upward.
 */
export class DuplicateChallengeError extends Error {
  constructor() {
    super('Daily challenge already exists for this date/language');
    this.name = 'DuplicateChallengeError';
  }
}
