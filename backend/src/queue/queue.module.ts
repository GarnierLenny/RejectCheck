import { DynamicModule, Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import IORedis from 'ioredis';
import { DEEP_ANALYSIS_QUEUE, NEGOTIATION_QUEUE } from './queue.constants';

/**
 * Wires BullMQ + Redis when REDIS_URL is set. When unset, the module is a
 * no-op — the LlmJobsService falls back to in-process execution via
 * setImmediate. This keeps local dev working without a Redis dependency
 * while letting production benefit from queue persistence, retries, and
 * concurrency control.
 */
@Module({})
export class QueueModule {
  private static readonly logger = new Logger(QueueModule.name);

  static register(): DynamicModule {
    const url = process.env.REDIS_URL;

    if (!url) {
      this.logger.warn(
        'REDIS_URL not set — LLM background jobs will run via setImmediate ' +
          'in the same Node process. Set REDIS_URL to enable BullMQ.',
      );
      return { module: QueueModule };
    }

    return {
      module: QueueModule,
      imports: [
        BullModule.forRoot({
          // BullMQ requires maxRetriesPerRequest: null. Connection is shared
          // across queues/workers via ioredis instance reuse.
          connection: new IORedis(url, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          }),
        }),
        BullModule.registerQueue(
          {
            name: DEEP_ANALYSIS_QUEUE,
            defaultJobOptions: {
              attempts: 2,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: { count: 100 },
              removeOnFail: { count: 200 },
            },
          },
          {
            name: NEGOTIATION_QUEUE,
            defaultJobOptions: {
              attempts: 2,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: { count: 100 },
              removeOnFail: { count: 200 },
            },
          },
        ),
      ],
      exports: [BullModule],
    };
  }
}
