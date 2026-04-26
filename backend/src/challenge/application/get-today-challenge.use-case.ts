import { Inject, Injectable } from '@nestjs/common';
import { CHALLENGE_GENERATOR, CHALLENGE_REPOSITORY } from '../ports/tokens';
import {
  type ChallengeRepository,
  DuplicateChallengeError,
} from '../ports/challenge.repository';
import type { ChallengeGenerator } from '../ports/challenge-generator.provider';
import {
  DEFAULT_LANGUAGE,
  type ChallengeLanguage,
  getTagsForLanguage,
} from '../domain/focus-tags';
import { startOfDayUtc } from '../domain/streak.policy';
import {
  type DailyChallenge,
  type PublicDailyChallenge,
} from '../domain/challenge.types';
import { DIFFICULTIES, type Difficulty } from '../dto/challenge.dto';
import type { FocusTag } from '../domain/focus-tags';

/**
 * Returns today's challenge for the given language, generating it on first
 * request of the day. Survives a race where two concurrent requests both miss
 * the cache and try to create — the loser re-reads the winner's row.
 *
 * The public-facing payload omits `issues` to avoid leaking the answers.
 */
@Injectable()
export class GetTodayChallengeUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challenges: ChallengeRepository,
    @Inject(CHALLENGE_GENERATOR)
    private readonly generator: ChallengeGenerator,
  ) {}

  async execute(
    language: ChallengeLanguage = DEFAULT_LANGUAGE,
  ): Promise<PublicDailyChallenge> {
    const today = startOfDayUtc(new Date());

    const existing = await this.challenges.findByDate(today, language);
    if (existing) return stripIssues(existing);

    const { focusTag, difficulty } = await this.pickRotation(language);
    const generated = await this.generator.generate(
      language,
      focusTag,
      difficulty,
    );

    try {
      const created = await this.challenges.create({
        ...generated,
        date: today,
        language,
        focusTag,
        difficulty,
      });
      return stripIssues(created);
    } catch (err) {
      if (err instanceof DuplicateChallengeError) {
        // Concurrent generation on the same day: the other request won —
        // re-read its row.
        const race = await this.challenges.findByDate(today, language);
        if (race) return stripIssues(race);
      }
      throw err;
    }
  }

  /**
   * Deterministic rotation based on the count of past challenges in this
   * language. Same input → same (focusTag, difficulty) pair, so reseeding the
   * DB doesn't desync the rotation.
   */
  private async pickRotation(
    language: ChallengeLanguage,
  ): Promise<{ focusTag: FocusTag; difficulty: Difficulty }> {
    const count = await this.challenges.countByLanguage(language);
    const tags = getTagsForLanguage(language);
    const focusTag = tags[count % tags.length];
    const difficulty =
      DIFFICULTIES[Math.floor(count / tags.length) % DIFFICULTIES.length];
    return { focusTag, difficulty };
  }
}

function stripIssues(challenge: DailyChallenge): PublicDailyChallenge {
  const { issues: _issues, ...rest } = challenge;
  return rest;
}
