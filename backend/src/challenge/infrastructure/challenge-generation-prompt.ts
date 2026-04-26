import { BadGatewayException } from '@nestjs/common';
import type { ChallengeIssue, Difficulty } from '../dto/challenge.dto';
import {
  type ChallengeLanguage,
  type FocusTag,
  FOCUS_TAG_DESCRIPTIONS,
  LANGUAGE_HINTS,
} from '../domain/focus-tags';

/**
 * Minimal fallback prompt. It works but produces generic output.
 * Production must override via `CHALLENGE_GENERATION_PROMPT` in the environment.
 * The real prompt is a private asset and does not live in this repo.
 */
const DEFAULT_CHALLENGE_GENERATION_PROMPT = `Generate a {language} code review challenge focused on "{focus_tag}" at {difficulty} difficulty.

Return JSON only:
{
  "title": string,
  "snippet": string,
  "question": string,
  "issues": [{ "title": string, "description": string, "severity": "critical" | "major" | "minor" }],
  "estimatedTime": number
}

Constraints: single file, 20–45 lines, 3–5 issues all grounded in "{focus_tag}", no comments hinting at bugs. Escape newlines inside "snippet" as \\n.`;

export function buildChallengePrompt(
  language: ChallengeLanguage,
  focusTag: FocusTag,
  difficulty: Difficulty,
  overrideTemplate?: string | null,
): string {
  const template =
    overrideTemplate && overrideTemplate.trim().length > 0
      ? overrideTemplate
      : DEFAULT_CHALLENGE_GENERATION_PROMPT;
  return template
    .replaceAll('{language}', language)
    .replaceAll('{language_hint}', LANGUAGE_HINTS[language])
    .replaceAll('{focus_tag}', focusTag)
    .replaceAll('{focus_description}', FOCUS_TAG_DESCRIPTIONS[focusTag])
    .replaceAll('{difficulty}', difficulty);
}

const MAX_LINES_HARD = 60;
const LEAK_LINE = /^\s*\/\/\s*(issue|bug|problem|fixme|todo|xxx)\b/i;
const INLINE_ISSUE_LABEL = /\bissue\s*[#]?\s*\d+\b/i;
const BLOCK_ISSUE_LABEL = /\/\*+\s*issue\s*[#]?\s*\d*/i;
const FILENAME_HEADER =
  /^\s*\/\/\s*[\w./-]+\.(ts|tsx|js|jsx|vue|svelte|py|java)\s*$/;
const IMPORT_LINE = /^\s*(import|from)\b/;

/**
 * Inspect a generated snippet + its issues array and throw BadGatewayException
 * if the output leaks answers or looks stitched from multiple files.
 * Provider-agnostic (runs against Claude and Gemini output alike).
 */
export function validateGeneratedSnippet(
  snippet: string,
  issues: ChallengeIssue[],
): void {
  const lines = snippet.split('\n');

  if (lines.length > MAX_LINES_HARD) {
    throw new BadGatewayException(
      `Generated snippet is too long (${lines.length} lines, max ${MAX_LINES_HARD}).`,
    );
  }

  for (const line of lines) {
    if (
      LEAK_LINE.test(line) ||
      INLINE_ISSUE_LABEL.test(line) ||
      BLOCK_ISSUE_LABEL.test(line)
    ) {
      throw new BadGatewayException(
        'Generated snippet leaks issue markers in comments.',
      );
    }
  }

  const filenameHeaders = lines.filter((line) => FILENAME_HEADER.test(line));
  if (filenameHeaders.length >= 2) {
    throw new BadGatewayException(
      'Generated snippet contains multiple filename headers — must be a single file.',
    );
  }

  let importBlocks = 0;
  let inBlock = false;
  for (const line of lines) {
    if (IMPORT_LINE.test(line)) {
      if (!inBlock) {
        importBlocks += 1;
        inBlock = true;
      }
    } else if (line.trim().length > 0) {
      inBlock = false;
    }
    if (importBlocks >= 2) {
      throw new BadGatewayException(
        'Generated snippet contains multiple import blocks — looks like stitched files.',
      );
    }
  }

  if (!issues || issues.length < 3) {
    throw new BadGatewayException(
      'Generated snippet must expose at least 3 issues.',
    );
  }
}
