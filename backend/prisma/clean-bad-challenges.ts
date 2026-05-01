/**
 * Delete DailyChallenge rows whose snippet fails the current generation validator.
 * Safe to run repeatedly — rows that pass are untouched.
 * After cleaning, run `npm run seed:challenges` to backfill.
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { validateGeneratedSnippet } from '../src/challenge/infrastructure/challenge-generation-prompt';
import type { ChallengeIssue } from '../src/challenge/dto/challenge.dto';

config();

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.dailyChallenge.findMany({
    select: { id: true, date: true, title: true, snippet: true, issues: true },
    orderBy: { date: 'asc' },
  });

  const bad: typeof rows = [];
  for (const row of rows) {
    try {
      validateGeneratedSnippet(row.snippet, row.issues as unknown as ChallengeIssue[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(
        `[${row.date.toISOString().slice(0, 10)}] #${row.id} "${row.title}" — ${message}`,
      );
      bad.push(row);
    }
  }

  if (bad.length === 0) {
    console.log('All challenges pass the validator. Nothing to clean.');
    return;
  }

  const { count } = await prisma.dailyChallenge.deleteMany({
    where: { id: { in: bad.map((r) => r.id) } },
  });
  console.log(`\nDeleted ${count} bad challenge(s). Run \`npm run seed:challenges\` to backfill.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
