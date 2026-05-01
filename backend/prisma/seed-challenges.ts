/**
 * Seeds daily challenges via Claude Sonnet.
 * - Rotation: FOCUS_TAGS × DIFFICULTIES, filtered by language's applicable tags
 * - Dates start at today's UTC date and increment one UTC day per row
 * - Idempotent: skips any (date, language) pair that already has a challenge
 * - TOTAL capped at 2 to limit Claude spend during dev; raise when ready.
 *
 * Run with: npm run seed:challenges
 * Requires: ANTHROPIC_API_KEY and DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import {
  GeneratedChallengeSchema,
  DIFFICULTIES,
  Difficulty,
} from '../src/challenge/dto/challenge.dto';
import {
  buildChallengePrompt,
  validateGenerated,
} from '../src/challenge/infrastructure/challenge-generation-prompt';
import {
  ChallengeLanguage,
  DEFAULT_LANGUAGE,
  FocusTag,
  getTagsForLanguage,
} from '../src/challenge/domain/focus-tags';

config();

const prisma = new PrismaClient();
const MODEL_NAME = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

const TARGET_LANGUAGE: ChallengeLanguage = DEFAULT_LANGUAGE;
const TOTAL = 1; // intentionally small to limit Claude spend during dev

function startOfDayUtc(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function generate(
  client: Anthropic,
  language: ChallengeLanguage,
  focusTag: FocusTag,
  difficulty: Difficulty,
) {
  const prompt = buildChallengePrompt(
    language,
    focusTag,
    difficulty,
    process.env.CHALLENGE_GENERATION_PROMPT,
  );

  const response = await client.messages.create({
    model: MODEL_NAME,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : '';
  if (!rawText) throw new Error('Empty response from Claude');

  const raw = stripJsonFences(rawText);
  const parsed = JSON.parse(raw);
  const safe = GeneratedChallengeSchema.safeParse(parsed);
  if (!safe.success) {
    throw new Error(
      `Invalid Claude output for ${focusTag}/${difficulty}: ${safe.error.issues[0].message}`,
    );
  }
  validateGenerated(safe.data);
  return safe.data;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set — aborting seed.');
  }

  const client = new Anthropic({ apiKey });
  const today = startOfDayUtc(new Date());
  const tags = getTagsForLanguage(TARGET_LANGUAGE);
  const existingCount = await prisma.dailyChallenge.count({
    where: { language: TARGET_LANGUAGE },
  });

  let seeded = 0;
  let skipped = 0;

  for (let i = 0; i < TOTAL; i++) {
    const date = addDays(today, i);
    const rotationIndex = existingCount + i;
    const focusTag = tags[rotationIndex % tags.length];
    const difficulty =
      DIFFICULTIES[
        Math.floor(rotationIndex / tags.length) % DIFFICULTIES.length
      ];

    const existing = await prisma.dailyChallenge.findUnique({
      where: { date_language: { date, language: TARGET_LANGUAGE } },
    });
    if (existing) {
      console.log(
        `[${date.toISOString().slice(0, 10)}] ${TARGET_LANGUAGE} exists — skipping`,
      );
      skipped++;
      continue;
    }

    console.log(
      `[${date.toISOString().slice(0, 10)}] generating ${TARGET_LANGUAGE}/${focusTag}/${difficulty}...`,
    );
    try {
      const gen = await generate(client, TARGET_LANGUAGE, focusTag, difficulty);
      await prisma.dailyChallenge.create({
        data: {
          date,
          language: TARGET_LANGUAGE,
          title: gen.title,
          focusTag,
          difficulty,
          snippet: gen.snippet,
          question: gen.question,
          issues: gen.issues,
          whatToLookFor: gen.whatToLookFor,
          hints: gen.hints,
          estimatedTime: gen.estimatedTime,
        },
      });
      seeded++;
    } catch (err: any) {
      console.error(`  ✗ failed: ${err.message}`);
    }
  }

  console.log(
    `\nSeeded ${seeded} new challenges. Skipped ${skipped} existing.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
