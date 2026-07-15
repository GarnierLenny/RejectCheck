import type { AnalyzeResponse } from '../../dto/analyze-response.dto';
import { matchKeywords } from '../keyword-match/keyword-match';
import { anchorScores } from './compose-score';
import { SCORE_GOLDEN_FIXTURES } from './golden/fixtures';

/**
 * Tier 1 of the score-stability harness: deterministic, free, runs on every PR.
 * Locks the reproducible parts of the score so a lexicon or formula change
 * can't silently move a user's number without a reviewable snapshot diff. The
 * real-model drift (tier 2) lives in score-drift.ts.
 */
describe('score stability — deterministic (golden set)', () => {
  describe('keyword coverage', () => {
    for (const fx of SCORE_GOLDEN_FIXTURES) {
      it(`is reproducible run-to-run for "${fx.name}"`, () => {
        const a = matchKeywords(fx.jobDescription, fx.cvText);
        const b = matchKeywords(fx.jobDescription, fx.cvText);
        expect(a).toEqual(b);
      });

      it(`pins coverage for "${fx.name}"`, () => {
        const { coverageScore, matchedCount, totalCount } = matchKeywords(
          fx.jobDescription,
          fx.cvText,
        );
        expect({ coverageScore, matchedCount, totalCount }).toMatchSnapshot();
      });
    }

    it('orders coverage strong > partial > mismatch', () => {
      const cov = (name: string): number => {
        const fx = SCORE_GOLDEN_FIXTURES.find((f) => f.name === name);
        if (!fx) throw new Error(`missing fixture ${name}`);
        return matchKeywords(fx.jobDescription, fx.cvText).coverageScore ?? 0;
      };
      expect(cov('senior-fullstack-strong-match')).toBeGreaterThan(
        cov('backend-partial-match'),
      );
      expect(cov('backend-partial-match')).toBeGreaterThan(
        cov('frontend-vs-backend-mismatch'),
      );
    });
  });

  describe('composite formula lock', () => {
    // A fixed model output; anchorScores must map it to a pinned, stable result.
    const modelResult = {
      score: 18,
      verdict: 'Low',
      breakdown: {
        keyword_match: 88,
        tech_stack_fit: 63,
        experience_level: 47,
        github_signal: 58,
        linkedin_signal: 41,
      },
      ats_simulation: {
        would_pass: true,
        score: 62,
        threshold: 70,
        reason: 'x',
      },
      hidden_red_flags: [{ flag: 'a', perception: 'x' }],
      audit: {
        cv: {
          score: 55,
          issues: [
            { severity: 'critical', category: 'impact', what: 'a', why: 'b' },
          ],
        },
      },
      bullet_reviews: { bullets: [{ verdict: 'fatal' }, { verdict: 'weak' }] },
    } as unknown as AnalyzeResponse;

    it('pins the anchored headline / verdict / breakdown / ats', () => {
      const out = anchorScores(modelResult, 62);
      expect({
        score: out.score,
        verdict: out.verdict,
        breakdown: out.breakdown,
        ats_simulation: out.ats_simulation,
      }).toMatchSnapshot();
    });

    it('is stable across repeated runs', () => {
      expect(anchorScores(modelResult, 62)).toEqual(
        anchorScores(modelResult, 62),
      );
    });
  });
});
