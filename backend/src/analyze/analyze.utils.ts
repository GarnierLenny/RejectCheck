const INJECTION_PATTERNS = [
  'ignore previous',
  'you are now',
  'disregard all',
  'system:',
  '<|',
];

export function validateJobDescription(
  text: string,
): { valid: true } | { valid: false; reason: string } {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return { valid: false, reason: 'Job description too short' };
  }

  if (INJECTION_PATTERNS.some((p) => lower.includes(p))) {
    return { valid: false, reason: 'Invalid content detected' };
  }

  return { valid: true };
}
