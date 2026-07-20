import { CarouselInsightsSchema } from './analyze-response.dto';

const fixture = {
  hook: 'Your senior title is not the story your bullets tell.',
  aha_moment: {
    headline: 'The evidence reads one level below the title.',
    evidence: 'Three recent bullets list delivery tasks but no scope, decision, or outcome.',
    recruiter_consequence: 'A recruiter is likely to screen this as execution support, not senior ownership.',
  },
  scorecard: [
    { label: 'Clarity', score: 7, evidence: 'Sections are easy to scan.' },
    { label: 'Impact proof', score: 3.5, evidence: 'No outcomes appear in recent roles.' },
    { label: 'Skills proof', score: 5, evidence: 'Tools lack work-sample evidence.' },
    { label: 'Seniority', score: 4, evidence: 'Scope is not made explicit.' },
    { label: 'ATS', score: 8, evidence: 'Standard headings parse cleanly.' },
    { label: 'Narrative', score: 6, evidence: 'Career direction is visible.' },
  ],
  priority_fixes: [
    { priority: 1, change: 'Rewrite the latest three bullets around outcomes.', why_it_matters: 'It makes senior ownership visible in the first scan.' },
    { priority: 2, change: 'Name the decision you owned in each role.', why_it_matters: 'It separates ownership from support work.' },
    { priority: 3, change: 'Tie core tools to named deliverables.', why_it_matters: 'It turns claimed skills into credible proof.' },
  ],
  slides: [
    { number: 1, purpose: 'hook', headline: 'A senior title is not enough.', body: 'Recruiters read the proof, not the label.' },
    { number: 2, purpose: 'scorecard', headline: 'The six-signal scorecard', body: 'Every relevant signal is rated out of ten.' },
    { number: 3, purpose: 'aha', headline: 'The title is ahead of the evidence', body: 'The current bullets show tasks without decision scope.' },
    { number: 4, purpose: 'evidence', headline: 'What the recruiter actually sees', body: 'Three recent roles list delivery but no measurable result.' },
    { number: 5, purpose: 'fixes', headline: 'Three changes to make first', body: 'Lead with outcomes, ownership, and proof for core skills.' },
    { number: 6, purpose: 'cta', headline: 'Want your own recruiter read?', body: 'Run your free CV analysis at rejectcheck.com.' },
  ],
};

describe('CarouselInsightsSchema', () => {
  it('accepts a complete six-slide, 0-10 carousel brief', () => {
    expect(CarouselInsightsSchema.parse(fixture)).toEqual(fixture);
  });

  it('rejects a score outside the public 0-10 scale', () => {
    const invalid = structuredClone(fixture);
    invalid.scorecard[0].score = 10.1;
    expect(CarouselInsightsSchema.safeParse(invalid).success).toBe(false);
  });
});
