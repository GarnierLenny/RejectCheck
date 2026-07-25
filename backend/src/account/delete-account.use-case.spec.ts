import { DeleteAccountUseCase } from './delete-account.use-case';

/**
 * Every table the purge is expected to clear. Kept as an explicit list because
 * the real failure mode here is silent: someone adds a new email-keyed table,
 * forgets to purge it, and a "deleted" account quietly keeps personal data.
 */
const MUST_PURGE = [
  'analysis',
  'application',
  'savedCv',
  'interviewAttempt',
  'challengeAttempt',
  'challengeStreak',
  'xpLedger',
  'unlockedReward',
  'creditLedger',
  'emailLog',
  'scheduledEmail',
  'profile',
] as const;

/** Deliberately survives a deletion. See the use-case docblock for why. */
const MUST_SURVIVE = ['suppression', 'subscription'] as const;

function makePrisma() {
  const calls: Record<string, unknown[]> = {};
  const model = (name: string) => ({
    deleteMany: (args: unknown) => {
      (calls[name] ??= []).push(args);
      return { __model: name, count: 1 };
    },
    count: () => Promise.resolve(0),
  });

  const prisma: Record<string, unknown> = {
    // Mirrors Prisma's array form: it resolves the pre-built operations.
    $transaction: (ops: unknown[]) => Promise.resolve(ops),
  };
  for (const name of [...MUST_PURGE, ...MUST_SURVIVE]) {
    prisma[name] = model(name);
  }
  return { prisma, calls };
}

describe('DeleteAccountUseCase', () => {
  it('purges every email-keyed table that holds personal data', async () => {
    const { prisma, calls } = makePrisma();
    const uc = new DeleteAccountUseCase(prisma as never);

    await uc.execute('someone@example.com');

    for (const table of MUST_PURGE) {
      expect(calls[table]).toBeDefined();
      expect(calls[table][0]).toEqual({ where: { email: 'someone@example.com' } });
    }
  });

  it('never deletes the unsubscribe list or the billing record', async () => {
    const { prisma, calls } = makePrisma();
    const uc = new DeleteAccountUseCase(prisma as never);

    await uc.execute('someone@example.com');

    // Wiping Suppression would silently re-consent someone who opted out, which
    // is the one thing an unsubscribe list must never do. Subscription is
    // financial history and Stripe is authoritative.
    for (const table of MUST_SURVIVE) {
      expect(calls[table]).toBeUndefined();
    }
  });

  it('scopes every delete to the caller and nobody else', async () => {
    const { prisma, calls } = makePrisma();
    const uc = new DeleteAccountUseCase(prisma as never);

    await uc.execute('victim@example.com');

    // An unscoped deleteMany here would empty the table for every user.
    for (const table of MUST_PURGE) {
      for (const args of calls[table] as Array<{ where?: { email?: string } }>) {
        expect(args.where?.email).toBe('victim@example.com');
      }
    }
  });

  it('runs as a single transaction, so a partial purge cannot happen', async () => {
    const { prisma } = makePrisma();
    let used = false;
    (prisma as { $transaction: unknown }).$transaction = (ops: unknown[]) => {
      used = true;
      return Promise.resolve(ops);
    };
    const uc = new DeleteAccountUseCase(prisma as never);

    await uc.execute('someone@example.com');

    // Told "your account is deleted" while some CV text survives is the worst
    // outcome available here.
    expect(used).toBe(true);
  });

  it('reports what it removed and what it kept', async () => {
    const { prisma } = makePrisma();
    const uc = new DeleteAccountUseCase(prisma as never);

    const res = await uc.execute('someone@example.com');

    expect(Object.keys(res.deleted).length).toBe(MUST_PURGE.length);
    expect(res.retained).toHaveProperty('subscriptions');
  });
});
