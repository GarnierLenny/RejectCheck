import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ConsumeCreditInput,
  CreditLedgerRepository,
  GrantCreditInput,
} from '../ports/credit-ledger.repository';

@Injectable()
export class PrismaCreditLedgerRepository implements CreditLedgerRepository {
  private readonly logger = new Logger(PrismaCreditLedgerRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(email: string): Promise<number> {
    // One grouped query is cheaper than two count(*) aggregates. The
    // [email, createdAt DESC] index isn't useful here — we need a simple
    // (email) filter that the FK-style index already covers via leftmost
    // prefix. Worst case for a single user: a few hundred rows.
    const groups = await this.prisma.creditLedger.groupBy({
      by: ['type'],
      where: { email },
      _sum: { amount: true },
    });
    let grants = 0;
    let consumes = 0;
    for (const g of groups) {
      if (g.type === 'grant') grants = g._sum.amount ?? 0;
      else if (g.type === 'consume') consumes = g._sum.amount ?? 0;
    }
    return grants - consumes;
  }

  async grant(input: GrantCreditInput): Promise<void> {
    // createMany + skipDuplicates relies on the (type, referenceId) unique
    // index to swallow replays silently — no need to wrap in a SELECT-then-
    // INSERT race.
    const result = await this.prisma.creditLedger.createMany({
      data: [
        {
          email: input.email,
          type: 'grant',
          amount: input.amount,
          source: input.source,
          referenceId: input.referenceId,
        },
      ],
      skipDuplicates: true,
    });
    if (result.count === 0) {
      this.logger.log(
        `Credit grant noop (replay): email=${input.email} ref=${input.referenceId}`,
      );
    }
  }

  async consume(input: ConsumeCreditInput): Promise<void> {
    // R3: namespace the idempotency key per chargeable action so distinct
    // consumes on the same analysis (analyze / review / fixes / rewrite) don't
    // collide on @@unique([type, referenceId]).
    const referenceId = `${input.analysisId}:${input.scope}`;
    const result = await this.prisma.creditLedger.createMany({
      data: [
        {
          email: input.email,
          type: 'consume',
          amount: input.amount,
          source: 'analysis',
          referenceId,
        },
      ],
      skipDuplicates: true,
    });
    if (result.count === 0) {
      this.logger.log(
        `Credit consume noop (replay): email=${input.email} ref=${referenceId}`,
      );
    }
  }
}
