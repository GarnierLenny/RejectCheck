import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Erase everything we hold about one account.
 *
 * This endpoint did not exist. The settings screen has shipped a "delete my
 * account" button that called `DELETE /api/account` against a route nobody ever
 * wrote, so every attempt returned Nest's 404 ("Cannot DELETE /api/account").
 * Production shows one real user pressing it twenty times. Account deletion is a
 * right, not a feature, so the failure mode here matters more than the feature
 * itself: a button that says "deleted" while deleting nothing is worse than no
 * button at all.
 *
 * WHAT IS DELETED: every table keyed by the user's email that holds their
 * personal data or their work. Rows that reference an Analysis (rescans, fixes,
 * interview attempts on that analysis) go with it via ON DELETE CASCADE.
 *
 * WHAT SURVIVES, deliberately:
 *  - `Suppression`. It exists to record "do not email this address". Deleting it
 *    would silently re-consent someone who opted out, which is the one thing an
 *    unsubscribe list must never do. It holds an email and nothing else.
 *  - `Subscription`. Financial history, and Stripe is the authoritative record.
 *    Removing our copy does not remove theirs, and billing records usually carry
 *    a statutory retention period. Flagged for a human decision rather than
 *    silently destroyed — see the return value, which reports what was left.
 *
 * Runs in a transaction: a partial delete is the worst outcome, because the user
 * is told they are gone while some of their CV text remains.
 */
@Injectable()
export class DeleteAccountUseCase {
  private readonly logger = new Logger(DeleteAccountUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(email: string): Promise<{
    deleted: Record<string, number>;
    retained: Record<string, number>;
  }> {
    const where = { email };

    const [
      analyses,
      applications,
      savedCvs,
      interviewAttempts,
      challengeAttempts,
      challengeStreaks,
      xpLedger,
      unlockedRewards,
      creditLedger,
      emailLogs,
      scheduledEmails,
      profiles,
    ] = await this.prisma.$transaction([
      // Analyses carry CV text, LinkedIn text and cover letters: the most
      // sensitive thing we store. Cascades take rescans/fixes with them.
      this.prisma.analysis.deleteMany({ where }),
      this.prisma.application.deleteMany({ where }),
      this.prisma.savedCv.deleteMany({ where }),
      this.prisma.interviewAttempt.deleteMany({ where }),
      this.prisma.challengeAttempt.deleteMany({ where }),
      this.prisma.challengeStreak.deleteMany({ where }),
      this.prisma.xpLedger.deleteMany({ where }),
      this.prisma.unlockedReward.deleteMany({ where }),
      this.prisma.creditLedger.deleteMany({ where }),
      this.prisma.emailLog.deleteMany({ where }),
      this.prisma.scheduledEmail.deleteMany({ where }),
      // Last: the profile is the identity row the rest hangs off.
      this.prisma.profile.deleteMany({ where }),
    ]);

    const retainedSubscriptions = await this.prisma.subscription.count({ where });

    const deleted = {
      analyses: analyses.count,
      applications: applications.count,
      savedCvs: savedCvs.count,
      interviewAttempts: interviewAttempts.count,
      challengeAttempts: challengeAttempts.count,
      challengeStreaks: challengeStreaks.count,
      xpLedger: xpLedger.count,
      unlockedRewards: unlockedRewards.count,
      creditLedger: creditLedger.count,
      emailLogs: emailLogs.count,
      scheduledEmails: scheduledEmails.count,
      profiles: profiles.count,
    };

    const total = Object.values(deleted).reduce((a, b) => a + b, 0);
    this.logger.log(
      `account purge complete: ${total} rows removed, ${retainedSubscriptions} subscription row(s) retained`,
    );

    return {
      deleted,
      retained: { subscriptions: retainedSubscriptions },
    };
  }
}
