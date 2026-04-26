export const CHALLENGE_LANGUAGES = ['typescript', 'python', 'java'] as const;
export type ChallengeLanguage = (typeof CHALLENGE_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: ChallengeLanguage = 'typescript';

export function isChallengeLanguage(value: string): value is ChallengeLanguage {
  return (CHALLENGE_LANGUAGES as readonly string[]).includes(value);
}

export const FOCUS_TAGS = [
  'naming',
  'error_boundaries',
  'race_conditions',
  'n_plus_one',
  'solid_srp',
  'api_contract',
  'null_handling',
  'async_patterns',
  'type_safety',
  'react_stale_closure',
  'react_rerenders',
  'data_validation',
] as const;
export type FocusTag = (typeof FOCUS_TAGS)[number];

export const FOCUS_TAG_DESCRIPTIONS: Record<FocusTag, string> = {
  naming: 'API/variable/type names that mislead readers or leak internals',
  error_boundaries:
    'exception handling, domain vs transport errors, consistent failure signaling',
  race_conditions:
    'check-then-act, TOCTOU, concurrent mutation of shared state',
  n_plus_one: 'query patterns, sequential fetches in loops, missing batching',
  solid_srp:
    'functions or classes doing more than one thing; responsibilities that should be split',
  api_contract:
    'DTO to domain model leakage, fields that invite misuse, HTTP concerns in domain',
  null_handling:
    '|| vs ??, nullable returns that mask failure, missing narrowing on optional fields',
  async_patterns:
    'sequential awaits that should be parallel, unhandled rejections, broken error propagation',
  type_safety:
    'any leaks, unsafe casts, missing narrowing, structural types used as nominal',
  react_stale_closure:
    'effect/callback dependency arrays capturing stale values',
  react_rerenders:
    'unnecessary re-renders, wrong keys, missing memoization at real cost points',
  data_validation:
    'input validation missing or at the wrong boundary, trust in client-supplied data',
};

/**
 * Which languages each focus tag applies to. The rotation filters on this.
 * V1 only generates TypeScript, so every tag is available today — the matrix
 * is here so later additions (Python, Java) need zero taxonomy edits.
 */
const FOCUS_TAG_LANGUAGES: Record<FocusTag, readonly ChallengeLanguage[]> = {
  naming: ['typescript', 'python', 'java'],
  error_boundaries: ['typescript', 'python', 'java'],
  race_conditions: ['typescript', 'python', 'java'],
  n_plus_one: ['typescript', 'python', 'java'],
  solid_srp: ['typescript', 'python', 'java'],
  api_contract: ['typescript', 'python', 'java'],
  null_handling: ['typescript', 'python', 'java'],
  async_patterns: ['typescript', 'python', 'java'],
  type_safety: ['typescript'],
  react_stale_closure: ['typescript'],
  react_rerenders: ['typescript'],
  data_validation: ['typescript', 'python', 'java'],
};

export function getTagsForLanguage(
  lang: ChallengeLanguage,
): readonly FocusTag[] {
  return FOCUS_TAGS.filter((t) => FOCUS_TAG_LANGUAGES[t].includes(lang));
}

export const LANGUAGE_HINTS: Record<ChallengeLanguage, string> = {
  typescript:
    'Use realistic TypeScript patterns (NestJS services, React components, Node backend code).',
  python:
    'Use realistic Python patterns (FastAPI, Django, or stdlib — idiomatic type hints when useful).',
  java: 'Use realistic Java patterns (Spring Boot services, JPA entities, or plain modern Java 21).',
};
