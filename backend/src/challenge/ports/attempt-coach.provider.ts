import type { ChallengeIssue, ScoreResult } from '../dto/challenge.dto';

/**
 * Two related capabilities used in the same flow:
 *  1. After the first answer, ask a Socratic follow-up that pushes the
 *     candidate without revealing the bugs.
 *  2. Once the second answer is in, score the whole attempt against the
 *     ground-truth issues.
 *
 * Default adapter: Google Gemini. The two capabilities are kept on the same
 * port because the prompts share context — splitting them would force every
 * adapter to maintain two mirror configs.
 */
export interface AttemptCoach {
  generateSocraticFollowup(
    snippet: string,
    issues: ChallengeIssue[],
    firstAnswer: string,
  ): Promise<string>;

  scoreAttempt(
    snippet: string,
    issues: ChallengeIssue[],
    firstAnswer: string,
    aiChallenge: string,
    secondAnswer: string,
  ): Promise<ScoreResult>;
}
