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
    // consistency 55, soft 30, ats 50. Weighted avg = 38.1 -> quantize -> 40.
    const out = anchorCvQuality({
      clarity: 48,
      impact: 18,
      hard_skills: 40,
      soft_skills: 30,
      consistency: 55,
      ats_format: 50,
    });
    expect(out.overall).toBe(40);
  });

  it('never lets overall contradict its parts: all-equal sub-scores yield that value', () => {
    const out = anchorCvQuality({
      clarity: 60,
      impact: 60,
      hard_skills: 60,
      soft_skills: 60,
      consistency: 60,
      ats_format: 60,
    });
    expect(out.overall).toBe(60);
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
    expect(withInflatedOverall.overall).toBe(70);
    expect(withLowOverall.overall).toBe(70);
  });

  it('is defensive against a missing / partial cv_quality object', () => {
    const out = anchorCvQuality({});
    expect(out.overall).toBe(0);
    expect(out.impact).toBe(0);
  });

  it('has weights that sum to 1', () => {
    const sum = Object.values(CV_QUALITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe('deriveCvQualityVerdict', () => {
  it('maps the quality headline to bands (higher = better)', () => {
    expect(deriveCvQualityVerdict(70)).toBe('High');
    expect(deriveCvQualityVerdict(85)).toBe('High');
    expect(deriveCvQualityVerdict(40)).toBe('Medium');
    expect(deriveCvQualityVerdict(65)).toBe('Medium');
    expect(deriveCvQualityVerdict(35)).toBe('Low');
    expect(deriveCvQualityVerdict(0)).toBe('Low');
  });
});
