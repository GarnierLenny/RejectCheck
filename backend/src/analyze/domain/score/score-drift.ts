/**
 * Tier 2 of the score-stability harness: REAL-model drift.
 *
 * Runs each golden {JD, CV} through the live analysis N times, anchors every
 * result the same way production does, and reports how much the headline moves
 * run-to-run. Exits non-zero when the anchored risk spread or the ATS pass flag
 * drifts beyond the allowed band, so it can gate a nightly/manual job. This is
 * the number that tells us whether the "stable judgment" claim actually holds
 * for real users — the deterministic specs (score-stability.spec.ts) only cover
 * the reproducible parts.
 *
 * NOT run by Jest (it is not a *.spec.ts) and NOT in CI by default: it spends
 * real API tokens. Run on demand:
 *
 *   ANTHROPIC_API_KEY=... npm --prefix backend run score-drift
 *   DRIFT_RUNS=5 DRIFT_SCORE_BAND=10 ANTHROPIC_API_KEY=... npm run score-drift
 */

import { ConfigService } from '@nestjs/config';
import { AnthropicClaudeProvider } from '../../infrastructure/anthropic-claude.provider';
import { matchKeywords } from '../keyword-match/keyword-match';
import { anchorScores } from './compose-score';
import { SCORE_GOLDEN_FIXTURES } from './golden/fixtures';

/** How many times to re-run each fixture. */
const RUNS = Number(process.env.DRIFT_RUNS ?? 3);
/** Max acceptable spread (max - min) of the anchored risk, in points. */
const SCORE_BAND = Number(process.env.DRIFT_SCORE_BAND ?? 10);

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      'score-drift: set ANTHROPIC_API_KEY to run the real harness.',
    );
    process.exit(2);
  }

  const provider = new AnthropicClaudeProvider(new ConfigService());
  let failed = false;

  console.log(
    `score-drift: ${SCORE_GOLDEN_FIXTURES.length} fixtures x ${RUNS} runs, band=${SCORE_BAND}pts\n`,
  );

  for (const fx of SCORE_GOLDEN_FIXTURES) {
    const coverage = matchKeywords(fx.jobDescription, fx.cvText).coverageScore;

    const scores: number[] = [];
    const passes: boolean[] = [];

    for (let i = 0; i < RUNS; i += 1) {
      const raw = await provider.analyzeApplication({
        jobText: fx.jobDescription,
        cvText: fx.cvText,
        githubInfo: '',
        linkedinText: '',
        motivationLetterText: '',
        challengeStats: null,
      });
      const anchored = anchorScores(raw, coverage);
      scores.push(anchored.score);
      passes.push(anchored.ats_simulation.would_pass);
    }

    const spread = Math.max(...scores) - Math.min(...scores);
    const passFlip = new Set(passes).size > 1;
    const bad = spread > SCORE_BAND || passFlip;
    if (bad) failed = true;

    console.log(
      `${bad ? 'DRIFT' : 'ok   '}  ${fx.name}: coverage=${coverage ?? 'n/a'} ` +
        `scores=[${scores.join(', ')}] spread=${spread}pts ` +
        `wouldPassFlip=${passFlip}`,
    );
  }

  console.log(`\nscore-drift: ${failed ? 'FAIL — drift over band' : 'pass'}`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('score-drift crashed:', err);
  process.exit(2);
});
