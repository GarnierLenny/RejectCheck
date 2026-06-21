const INJECTION_PATTERNS = [
  'ignore previous',
  'you are now',
  'disregard all',
  'system:',
  '<|',
];

/**
 * Minimum meaningful job-description length. A few words is not enough to
 * ground an analysis — without this floor the model is forced (tool_choice)
 * to emit a confident score + ATS verdict + red flags on essentially no input.
 * Better to refuse than to ship false precision.
 */
export const MIN_JD_CHARS = 50;

export function validateJobDescription(
  text: string,
): { valid: true } | { valid: false; reason: string } {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (trimmed.length < MIN_JD_CHARS) {
    return {
      valid: false,
      reason:
        'Job description too short — paste the full job posting so the analysis has enough to work with.',
    };
  }

  if (INJECTION_PATTERNS.some((p) => lower.includes(p))) {
    return { valid: false, reason: 'Invalid content detected' };
  }

  return { valid: true };
}
