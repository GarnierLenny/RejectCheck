import {
  anchorCvQuality,
  deriveCvQualityVerdict,
  CV_QUALITY_WEIGHTS,
} from './compose-cv-review-score';

describe('anchorCvQuality', () => {
  it('quantizes every sub-score to the nearest step of 5', () => {
    const out = anchorCvQuality({
      clarity: 48,
      impact: 18,
      hard_skills: 42,
      soft_skills: 31,
      consistency: 53,
      ats_format: 49,
    });
    expect(out.clarity).toBe(50);
    expect(out.impact).toBe(20);
    expect(out.hard_skills).toBe(40);
    expect(out.soft_skills).toBe(30);
    expect(out.consistency).toBe(55);
    expect(out.ats_format).toBe(50);
  });

  it('recomputes overall as the quantized weighted average of the six sub-scores', () => {
    // Marketing-sample sub-scores. Quantized: impact 20, clarity 50, hard 40,
    // consistency 55, soft 30, ats 50. Weighted avg 38.1 -> deflate(.15) 34.6 -> 35.
    const out = anchorCvQuality({
      clarity: 48,
      impact: 18,
      hard_skills: 40,
      soft_skills: 30,
      consistency: 55,
      ats_format: 50,
    });
    expect(out.overall).toBe(35);
  });

  it('deflates an all-equal sub-score set (60 -> 55) instead of echoing it', () => {
    const out = anchorCvQuality({
      clarity: 60,
      impact: 60,
      hard_skills: 60,
      soft_skills: 60,
      consistency: 60,
      ats_format: 60,
    });
    // deflate(60, CV_DEFLATION) = 56.4 -> quantize -> 55. Still pulled down, but
    // no longer to 40: the old 0.85 curve was correcting a generosity the six
    // sub-scores do not actually have (measured median 52, not 70-90).
    expect(out.overall).toBe(55);
  });

  it('ignores the model-supplied overall entirely (pure function of the sub-scores)', () => {
    const base = {
      clarity: 70,
      impact: 70,
      hard_skills: 70,
      soft_skills: 70,
      consistency: 70,
      ats_format: 70,
    };
    const withInflatedOverall = anchorCvQuality({ ...base, overall: 99 });
    const withLowOverall = anchorCvQuality({ ...base, overall: 5 });
    // Pure function of the sub-scores: deflate(70, .15) = 66.85 -> quantize -> 65.
    expect(withInflatedOverall.overall).toBe(65);
    expect(withLowOverall.overall).toBe(65);
  });

  it('is defensive against a missing / partial cv_quality object', () => {
    const out = anchorCvQuality({});
    expect(out.overall).toBe(0);
    expect(out.impact).toBe(0);
  });

  it('subtracts a credibility penalty so a flagged CV is punished, not merely light', () => {
    const subs = {
      clarity: 80,
      impact: 80,
      hard_skills: 80,
      soft_skills: 80,
      consistency: 80,
      ats_format: 80,
    };
    const clean = anchorCvQuality(subs).overall;
    // deflate(80,.15)=77.6 -> 80 clean ; CV penalty 2*1+1*1+1*1=4 -> 73.6 -> 75.
    const flagged = anchorCvQuality(subs, {
      redFlagCount: 2,
      criticalIssueCount: 1,
      fatalBulletCount: 1,
    }).overall;
    expect(clean).toBe(80);
    expect(flagged).toBe(75);
    expect(flagged).toBeLessThan(clean);
  });

  it('caps the penalty far below the vs-JD cap, so a flagged CV is not floored', () => {
    // The regression this locks: production CVs carry a MEDIAN of 3 red flags,
    // 2 critical issues and 3 fatal bullets. Under the old shared costs that was
    // 24 of a 29-point cap on the median CV, which combined with the old
    // deflation to floor 34% of real CVs at exactly 0. The signals must still
    // cost something, but they must not be able to erase the score.
    const subs = {
      clarity: 60,
      impact: 60,
      hard_skills: 60,
      soft_skills: 60,
      consistency: 60,
      ats_format: 60,
    };
    const typical = anchorCvQuality(subs, {
      redFlagCount: 3,
      criticalIssueCount: 2,
      fatalBulletCount: 3,
    }).overall;
    // deflate(60,.15)=56.4, penalty 3+2+3=8 -> 48.4 -> 50. Not zero.
    expect(typical).toBe(50);

    // Even a pathological signal count cannot exceed the 10-point cap.
    const pathological = anchorCvQuality(subs, {
      redFlagCount: 99,
      criticalIssueCount: 99,
      fatalBulletCount: 99,
    }).overall;
    expect(pathological).toBe(45); // 56.4 - 10 = 46.4 -> 45
    expect(pathological).toBeGreaterThan(0);
  });

  it('has weights that sum to 1', () => {
    const sum = Object.values(CV_QUALITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe('deriveCvQualityVerdict', () => {
  it('maps the quality headline to bands (higher = better)', () => {
    // Quality bands (NOT the vs-JD competitiveness cutoffs): Strong >= 55,
    // Decent 30-54, Weak < 30. Derived from the distribution the recalibrated
    // curve produces over the 74 production CVs: 26% / 54% / 20%.
    expect(deriveCvQualityVerdict(55)).toBe('High');
    expect(deriveCvQualityVerdict(85)).toBe('High');
    expect(deriveCvQualityVerdict(54)).toBe('Medium');
    expect(deriveCvQualityVerdict(30)).toBe('Medium');
    expect(deriveCvQualityVerdict(29)).toBe('Low');
    expect(deriveCvQualityVerdict(0)).toBe('Low');
  });
});
