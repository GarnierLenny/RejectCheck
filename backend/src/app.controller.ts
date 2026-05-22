import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async health(): Promise<{ status: 'ok'; ts: string }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', ts: new Date().toISOString() };
  }

  @Get('api/stats')
  async stats(): Promise<{ totalAnalyses: number }> {
    const totalAnalyses = await this.prisma.analysis.count();
    return { totalAnalyses };
  }

  // Temporary endpoint to verify Sentry wiring end-to-end. Remove after validation.
  @Get('debug-sentry')
  debugSentry(): never {
    throw new Error('Sentry test from RejectCheck backend');
  }
}
