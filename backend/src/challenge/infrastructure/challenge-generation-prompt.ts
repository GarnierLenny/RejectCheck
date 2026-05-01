import { BadGatewayException } from '@nestjs/common';
import type {
  ChallengeIssue,
  GeneratedChallenge,
  Difficulty,
} from '../dto/challenge.dto';
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
  "question": string,         // 60–180 words of MARKDOWN. 2–4 paragraphs separated by \\n\\n. Open with what the snippet does and the operating context (e.g. "Review this NestJS seat reservation service for correctness under concurrent load."). Then a contextual hook that frames the trap WITHOUT naming the bug, using inline \`code\` for identifiers from the snippet (e.g. "The code looks defensive — there's even a \`processingSeats\` guard — but two callers hitting the same \`seatId\` within microseconds will still both succeed."). Close with a one-line PR-style instruction (e.g. "Walk through your review like you would in a PR. What's wrong, why it matters in production, and what you'd ship instead."). Markdown allowed: paragraphs, inline \`code\`, **bold**. NOT allowed: headings, lists, links, images, fenced code blocks.
  "issues": [{ "title": string, "description": string, "severity": "critical" | "major" | "minor" }],   // server-only, NOT shown to the user
  "whatToLookFor": [string, string, string],   // EXACTLY 3 watchpoints — short, actionable, point at the angle (e.g. "Where the check-then-act window opens between guard and mutation"). Do NOT name the bug, do NOT cite line numbers, do NOT include code fences.
  "hints": [string, string, string],           // EXACTLY 3 Socratic QUESTIONS that orient the reviewer toward the issues. Each MUST end with "?". MUST NOT contain the answer, the fix name, or any code citation (no \`L8\`-style line refs, no triple backticks). Bad: "Use SELECT FOR UPDATE to fix it.". Good: "What happens between line 8 reading the state and line 14 writing it under concurrent load?"
  "estimatedTime": number     // minutes, 1–60
}

Constraints: single file, 20–45 lines, 3–5 issues all grounded in "{focus_tag}", no comments hinting at bugs. Escape newlines inside "snippet" as \\n. \`question\` is markdown but kept short and editorial. \`whatToLookFor\` and \`hints\` are PUBLIC (shipped to the user); \`issues\` are PRIVATE (server-only).`;

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

const HINT_LEAKS_CODE = /```|\bL\d+\b/i;

/**
 * Snippet + issues sanity checks (run on legacy data too).
 * Throws BadGatewayException if the snippet leaks answers, stitches multiple
 * files, or has too few issues.
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

/**
 * Full generation validator: snippet + issues checks + hints contract.
 * Use this on every fresh AI generation. For legacy DB rows (which may lack
 * hints), call `validateGeneratedSnippet` directly with snippet + issues only.
 */
export function validateGenerated(gen: GeneratedChallenge): void {
  validateGeneratedSnippet(gen.snippet, gen.issues);

  for (const hint of gen.hints) {
    if (!hint.trimEnd().endsWith('?')) {
      throw new BadGatewayException(
        'Generated hints must be questions (each must end with "?").',
      );
    }
    if (HINT_LEAKS_CODE.test(hint)) {
      throw new BadGatewayException(
        'Generated hints must not cite lines (L\\d+) or include code fences.',
      );
    }
  }
}

