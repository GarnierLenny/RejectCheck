const INJECTION_PATTERNS = [
  'ignore previous',
  'you are now',
  'disregard all',
  'system:',
  '<|',
];

const CV_FIELD_KEYWORDS = ['experience', 'skills', 'education'];

export function validateJobDescription(text: string): { valid: true } | { valid: false; reason: string } {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return { valid: false, reason: 'Job description too short' };
  }

  // 1. Prompt injection
  if (INJECTION_PATTERNS.some((p) => lower.includes(p))) {
    return { valid: false, reason: 'Invalid content detected' };
  }

  // 2. Inverted fields — first 3 words look like a CV section header
  const firstThreeWords = lower.split(/\s+/).slice(0, 3).join(' ');
  if (CV_FIELD_KEYWORDS.some((kw) => firstThreeWords.includes(kw))) {
    return { valid: false, reason: 'Content appears to be a CV, not a job description' };
  }

  const words = trimmed.split(/\s+/);

  // 3. Too short (< 30 words)
  if (words.length < 30) {
    return { valid: false, reason: 'Job description too short' };
  }

  // 4. Special char ratio > 40%
  const specialCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) ?? []).length;
  if (specialCount / trimmed.length > 0.4) {
    return { valid: false, reason: 'Content does not appear to be a job description' };
  }

  // 5. Single word dominates > 25% of total
  const freq: Record<string, number> = {};
  for (const w of words) {
    const wl = w.toLowerCase();
    freq[wl] = (freq[wl] ?? 0) + 1;
  }
  if (Object.keys(freq).length > 0) {
    const maxFreq = Math.max(...Object.values(freq));
    if (maxFreq / words.length > 0.25) {
      return { valid: false, reason: 'Content does not appear to be a job description' };
    }
  }

  return { valid: true };
}
