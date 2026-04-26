import type { GeneratedChallenge, Difficulty } from '../dto/challenge.dto';
import type { ChallengeLanguage, FocusTag } from '../domain/focus-tags';

/**
 * Generates a brand new challenge from a (language, focusTag, difficulty)
 * tuple. Returns the structured payload to persist as today's challenge.
 *
 * Default adapter: Anthropic Claude. Swappable to any model that can produce
 * JSON matching `GeneratedChallengeSchema`.
 */
export interface ChallengeGenerator {
  generate(
    language: ChallengeLanguage,
    focusTag: FocusTag,
    difficulty: Difficulty,
  ): Promise<GeneratedChallenge>;
}
