/**
 * One-shot backfill: compute totalXp/level for every existing user from their
 * past ChallengeAttempt rows and populate Profile.totalXp/level + XpLedger.
 *
 * Idempotent: skips users that already have any XpLedger row (so it can be
 * re-run safely; only first run does work).
 *
 * Run with:  cd backend && npx ts-node prisma/backfill-xp.ts
 * Requires:  DATABASE_URL pointing at a direct connection (port 5432, NOT pgbouncer).
 *
 * Limitations:
 *   - No streak bonus applied (no reliable historical streak data).
 *   - No first-perfect-on-focus-tag bonus.
 *   So computed totalXp is conservative; users will gain more XP going forward.
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { computeXpAward } from '../src/xp/domain/xp-formula';
import { levelFromXp } from '../src/xp/domain/tier-config';

config();

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    select: { email: true },
  });
  console.log(`Found ${profiles.length} profiles to backfill.`);

  let processed = 0;
  let skipped = 0;
  let totalXpGranted = 0;

  for (const { email } of profiles) {
    // Skip if any XpLedger row exists for this user (idempotent)
    const existing = await prisma.xpLedger.findFirst({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const attempts = await prisma.challengeAttempt.findMany({
      where: { email, score: { gt: 0 } },
      orderBy: { completedAt: 'asc' },
      select: {
        id: true,
        score: true,
        challengeId: true,
        completedAt: true,
        challenge: { select: { difficulty: true } },
      },
    });

    if (attempts.length === 0) {
      processed++;
      continue;
    }

    let totalXp = 0;
    const ledgerRows = attempts.map((a) => {
      const award = computeXpAward({
        score: a.score,
        difficulty: (a.challenge.difficulty as 'easy' | 'medium' | 'hard') ?? 'easy',
        currentStreak: 0,
        isFirstPerfectOnFocusTag: false,
      });
      totalXp += award.amount;
      return {
        email,
        amount: award.amount,
        reason: 'backfill_legacy' as const,
        attemptId: a.id,
        challengeId: a.challengeId,
        createdAt: a.completedAt,
      };
    });

    await prisma.$transaction([
      prisma.xpLedger.createMany({ data: ledgerRows }),
      prisma.profile.update({
        where: { email },
        data: {
          totalXp,
          level: levelFromXp(totalXp).level,
        },
      }),
    ]);

    totalXpGranted += totalXp;
    processed++;
    if (processed % 25 === 0) {
      console.log(`  ${processed}/${profiles.length} processed (skipped=${skipped})`);
    }
  }

  console.log(
    `\nDone. Processed ${processed}, skipped ${skipped} (already had XP).`,
  );
  console.log(`Total XP granted: ${totalXpGranted}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
