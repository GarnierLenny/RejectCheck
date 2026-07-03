import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type AnalysisOutcome } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalysisNotFoundException } from '../../common/exceptions';
import type {
  AnalysisRepository,
  ApplicationUpsertInput,
  HistoryPage,
  SaveAnalysisInput,
  SaveAnonymousInput,
} from '../ports/analysis.repository';
import type { AnalysisDetail, StoredAnalysis } from '../domain/analysis.types';
import type {
  AnalyzeResponse,
  DeepAnalyzeResponse,
} from '../dto/analyze-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';

type AnalysisRow = {
  id: number;
  email: string | null;
  ip: string | null;
  jobDescription: string | null;
  jobLabel: string | null;
  company: string | null;
  jdLanguage: string | null;
  cvText: string | null;
  cvTextFormatted: string | null;
  linkedinText: string | null;
  linkedinTextFormatted: string | null;
  cvFileUrl: string | null;
  liFileUrl: string | null;
  mlFileUrl: string | null;
  githubInfo: string | null;
  motivationLetter: string | null;
  coverLetter: string | null;
  result: Prisma.JsonValue | null;
  deepAnalysis: Prisma.JsonValue | null;
  negotiationAnalysis: Prisma.JsonValue | null;
  rewriteCount: number;
  outcome: AnalysisOutcome;
  outcomeUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaAnalysisRepository implements AnalysisRepository {
  private readonly logger = new Logger(PrismaAnalysisRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  countByEmail(email: string): Promise<number> {
    return this.prisma.analysis.count({ where: { email } });
  }

  countByIp(ip: string): Promise<number> {
    return this.prisma.analysis.count({ where: { ip } });
  }

  countByEmailSince(email: string, since: Date): Promise<number> {
    // Index `[email, createdAt DESC]` covers this query — no full table scan.
    return this.prisma.analysis.count({
      where: { email, createdAt: { gte: since } },
    });
  }

  async creditsSince(email: string, since: Date): Promise<number> {
    const agg = await this.prisma.analysis.aggregate({
      where: { email, createdAt: { gte: since } },
      _sum: { creditCost: true },
    });
    return agg._sum.creditCost ?? 0;
  }

  async saveRegistered(input: SaveAnalysisInput): Promise<{ id: number }> {
    const created = await this.prisma.analysis.create({
      data: {
        email: input.email,
        ip: input.ip ?? null,
        jobDescription: input.jobDescription,
        jobLabel: input.jobLabel,
        company: input.company,
        jdLanguage: input.jdLanguage,
        cvText: input.cvText,
        cvTextFormatted: input.cvTextFormatted ?? null,
        linkedinText: input.linkedinText,
        linkedinTextFormatted: input.linkedinTextFormatted ?? null,
        githubInfo: input.githubInfo,
        motivationLetter: input.motivationLetter,
        creditCost: input.creditCost,
        result: input.result as unknown as Prisma.InputJsonValue,
        deepAnalysis: input.deepAnalysis
          ? (input.deepAnalysis as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
        negotiationAnalysis: input.negotiationAnalysis
          ? (input.negotiationAnalysis as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });
    return { id: created.id };
  }

  async saveAnonymous(
    input: SaveAnonymousInput,
  ): Promise<{ id: number; claimToken: string }> {
    const claimToken = randomUUID();
    const created = await this.prisma.analysis.create({
      data: {
        email: null,
        ip: input.ip ?? null,
        claimToken,
        jobDescription: input.jobDescription,
        jobLabel: input.jobLabel,
        company: input.company,
        jdLanguage: input.jdLanguage,
        cvText: input.cvText,
        cvTextFormatted: input.cvTextFormatted ?? null,
        linkedinText: input.linkedinText,
        linkedinTextFormatted: input.linkedinTextFormatted ?? null,
        githubInfo: input.githubInfo,
        motivationLetter: input.motivationLetter,
        creditCost: 0, // anonymous analyses don't consume credits
        result: input.result as unknown as Prisma.InputJsonValue,
      },
    });
    return { id: created.id, claimToken };
  }

  async claimByToken(
    email: string,
    claimToken: string,
  ): Promise<{ id: number } | null> {
    const found = await this.prisma.analysis.findUnique({
      where: { claimToken },
      select: { id: true, email: true },
    });
    if (!found || found.email !== null) return null; // unknown or already claimed
    await this.prisma.analysis.update({
      where: { id: found.id },
      data: { email, claimToken: null },
    });
    return { id: found.id };
  }

  async scrubUnclaimedOlderThan(cutoff: Date): Promise<number> {
    // Keep the row (id, ip, createdAt) so IP rate-limiting is unaffected;
    // wipe the payload + token so an expired anonymous analysis holds no PII
    // and can no longer be claimed.
    // Skip publicly-shared rows (shareToken set): the user chose to make that
    // analysis public, so its live share link must outlive the 7-day TTL.
    const res = await this.prisma.analysis.updateMany({
      where: {
        email: null,
        claimToken: { not: null },
        shareToken: null,
        createdAt: { lt: cutoff },
      },
      data: {
        claimToken: null,
        jobDescription: null,
        jobLabel: null,
        company: null,
        cvText: null,
        cvTextFormatted: null,
        linkedinText: null,
        linkedinTextFormatted: null,
        githubInfo: null,
        motivationLetter: null,
        result: Prisma.DbNull,
        deepAnalysis: Prisma.DbNull,
        negotiationAnalysis: Prisma.DbNull,
        starterRepo: Prisma.DbNull,
      },
    });
    return res.count;
  }

  async upsertApplication(input: ApplicationUpsertInput): Promise<void> {
    await this.prisma.application.upsert({
      where: {
        email_jobTitle_company: {
          email: input.email,
          jobTitle: input.jobTitle,
          company: input.company,
        },
      },
      update: {
        analysisId: input.analysisId,
        updatedAt: new Date(),
        ...input.meta,
      },
      create: {
        email: input.email,
        jobTitle: input.jobTitle,
        company: input.company,
        status: 'applied',
        appliedAt: new Date(),
        analysisId: input.analysisId,
        ...input.meta,
      },
    });
  }

  async findById(id: number, email: string): Promise<StoredAnalysis | null> {
    const row = await this.prisma.analysis.findFirst({
      where: { id, email, result: { not: Prisma.DbNull } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findDetailById(
    id: number,
    email: string,
  ): Promise<AnalysisDetail | null> {
    const row = await this.prisma.analysis.findFirst({
      where: { id, email, result: { not: Prisma.DbNull } },
      select: {
        id: true,
        jobLabel: true,
        company: true,
        jobDescription: true,
        cvText: true,
        cvTextFormatted: true,
        linkedinText: true,
        linkedinTextFormatted: true,
        cvFileUrl: true,
        liFileUrl: true,
        mlFileUrl: true,
        result: true,
        deepAnalysis: true,
        motivationLetter: true,
        coverLetter: true,
        negotiationAnalysis: true,
        completedSteps: true,
        premiumUnlockedAt: true,
        rewriteCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      jobLabel: row.jobLabel,
      company: row.company,
      jobDescription: row.jobDescription,
      cvText: row.cvText,
      cvTextFormatted: row.cvTextFormatted,
      linkedinText: row.linkedinText,
      linkedinTextFormatted: row.linkedinTextFormatted,
      cvFileUrl: row.cvFileUrl,
      liFileUrl: row.liFileUrl,
      mlFileUrl: row.mlFileUrl,
      motivationLetter: row.motivationLetter,
      coverLetter: row.coverLetter,
      result: row.result as AnalyzeResponse | null,
      deepAnalysis: row.deepAnalysis as DeepAnalyzeResponse | null,
      negotiationAnalysis:
        row.negotiationAnalysis as NegotiationAnalysis | null,
      completedSteps: row.completedSteps ?? [],
      premiumUnlocked: row.premiumUnlockedAt !== null,
      rewriteCount: row.rewriteCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async saveCompletedSteps(id: number, email: string, steps: number[]): Promise<void> {
    await this.prisma.analysis.updateMany({
      where: { id, email },
      data: { completedSteps: steps },
    });
  }

  async paginateByEmail(
    email: string,
    page: number,
    limit: number,
  ): Promise<HistoryPage> {
    if (!email) return { data: [], total: 0 };
    const skip = (page - 1) * limit;
    const where = { email, result: { not: Prisma.DbNull } };
    const [rows, total] = await Promise.all([
      this.prisma.analysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        // The history list only renders id/label/company/date/score, so select
        // just those columns + `result` (for the score). This drops the heavy
        // per-row payload — deepAnalysis, negotiationAnalysis, the raw CV/JD/
        // LinkedIn/GitHub text, and the `ip` field — from a 10-row page that
        // previously shipped megabytes. The full analysis is fetched by id.
        select: {
          id: true,
          email: true,
          jobDescription: true,
          jobLabel: true,
          company: true,
          jdLanguage: true,
          result: true,
          rewriteCount: true,
          outcome: true,
          outcomeUpdatedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.analysis.count({ where }),
    ]);
    const data: StoredAnalysis[] = rows.map((r) => ({
      id: r.id,
      email: r.email,
      ip: null,
      jobDescription: r.jobDescription,
      jobLabel: r.jobLabel,
      company: r.company,
      jdLanguage: r.jdLanguage,
      cvText: null,
      cvTextFormatted: null,
      linkedinText: null,
      linkedinTextFormatted: null,
      githubInfo: null,
      motivationLetter: null,
      coverLetter: null,
      cvFileUrl: null,
      liFileUrl: null,
      mlFileUrl: null,
      result: r.result as AnalyzeResponse | null,
      deepAnalysis: null,
      negotiationAnalysis: null,
      rewriteCount: r.rewriteCount ?? 0,
      outcome: r.outcome,
      outcomeUpdatedAt: r.outcomeUpdatedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    return { data, total };
  }

  async attachRewrite(
    id: number,
    email: string,
    rewrite: { reconstructed_cv: string },
  ): Promise<void> {
    const existing = await this.prisma.analysis.findFirst({
      where: { id, email },
      select: { result: true },
    });
    if (!existing?.result) return;
    const merged = {
      ...(existing.result as Record<string, unknown>),
      rewrite,
    };
    await this.prisma.analysis.update({
      where: { id },
      data: { result: merged as unknown as Prisma.InputJsonValue },
    });
  }

  async attachFileUrls(
    id: number,
    email: string,
    urls: { cvFileUrl?: string; liFileUrl?: string; mlFileUrl?: string },
  ): Promise<void> {
    await this.prisma.analysis.updateMany({
      where: { id, email },
      data: {
        ...(urls.cvFileUrl !== undefined && { cvFileUrl: urls.cvFileUrl }),
        ...(urls.liFileUrl !== undefined && { liFileUrl: urls.liFileUrl }),
        ...(urls.mlFileUrl !== undefined && { mlFileUrl: urls.mlFileUrl }),
      },
    });
  }

  async attachCoverLetter(
    id: number,
    email: string,
    coverLetter: string,
  ): Promise<void> {
    await this.prisma.analysis.updateMany({
      where: { id, email },
      data: { coverLetter },
    });
  }

  async attachNegotiation(
    id: number,
    email: string,
    negotiation: NegotiationAnalysis,
  ): Promise<void> {
    const res = await this.prisma.analysis.updateMany({
      where: { id, email },
      data: {
        negotiationAnalysis: negotiation as unknown as Prisma.InputJsonValue,
      },
    });
    // Guard against silently discarded LLM spend: a 0-row update means the
    // (id, email) pair didn't match (deleted row, wrong owner) and we just
    // paid for a Claude call whose result is being thrown away.
    if (res.count === 0) {
      this.logger.error(
        `attachNegotiation matched 0 rows (id=${id}) — negotiation result discarded, spend wasted`,
      );
    }
  }

  async attachDeepAnalysis(
    id: number,
    email: string,
    deep: DeepAnalyzeResponse,
  ): Promise<void> {
    const res = await this.prisma.analysis.updateMany({
      where: { id, email },
      data: {
        deepAnalysis: deep as unknown as Prisma.InputJsonValue,
      },
    });
    // See attachNegotiation: a 0-row update silently drops the (expensive)
    // deep-pass result. Surface it loudly instead of losing the spend quietly.
    if (res.count === 0) {
      this.logger.error(
        `attachDeepAnalysis matched 0 rows (id=${id}) — deep result discarded, spend wasted`,
      );
    }
  }

  async findStarterRepo(id: number, email: string): Promise<unknown | null> {
    const row = await this.prisma.analysis.findFirst({
      where: { id, email },
      select: { starterRepo: true },
    });
    return row?.starterRepo ?? null;
  }

  async attachStarterRepo(
    id: number,
    email: string,
    repo: unknown,
  ): Promise<void> {
    await this.prisma.analysis.updateMany({
      where: { id, email },
      data: { starterRepo: repo as Prisma.InputJsonValue },
    });
  }

  async deleteByIdForEmail(id: number, email: string): Promise<void> {
    const exists = await this.prisma.analysis.findFirst({
      where: { id, email },
      select: { id: true },
    });
    if (!exists) throw new AnalysisNotFoundException(id);
    await this.prisma.analysis.delete({ where: { id } });
  }

  async createShareToken(id: number, email: string): Promise<string> {
    const row = await this.prisma.analysis.findFirst({
      where: { id, email, result: { not: Prisma.DbNull } },
      select: { shareToken: true },
    });
    if (!row) throw new AnalysisNotFoundException(id);
    if (row.shareToken) return row.shareToken;
    const token = randomUUID();
    await this.prisma.analysis.update({ where: { id }, data: { shareToken: token } });
    return token;
  }

  async createShareTokenForClaim(claimToken: string): Promise<string | null> {
    // The claimToken is the bearer of ownership for a logged-out analysis: only
    // the client that ran it holds the (unguessable) value, so it's safe to mint
    // a public share token from it without auth. Require email: null (not yet
    // claimed) and a non-empty result (not scrubbed by the TTL cron).
    const row = await this.prisma.analysis.findFirst({
      where: { claimToken, email: null, result: { not: Prisma.DbNull } },
      select: { id: true, shareToken: true },
    });
    if (!row) return null; // unknown, already claimed, or scrubbed
    if (row.shareToken) return row.shareToken;
    const token = randomUUID();
    await this.prisma.analysis.update({
      where: { id: row.id },
      data: { shareToken: token },
    });
    return token;
  }

  async markPremiumUnlocked(analysisId: number, email: string): Promise<boolean> {
    // Scoped to the owner's email — a webhook can only unlock an analysis that
    // belongs to the verified buyer. Idempotent: replayed webhooks just refresh
    // the timestamp.
    const res = await this.prisma.analysis.updateMany({
      where: { id: analysisId, email },
      data: { premiumUnlockedAt: new Date() },
    });
    return res.count > 0;
  }

  async isPremiumUnlocked(analysisId: number, email: string): Promise<boolean> {
    const row = await this.prisma.analysis.findFirst({
      where: { id: analysisId, email, premiumUnlockedAt: { not: null } },
      select: { id: true },
    });
    return row !== null;
  }

  async findByShareToken(token: string): Promise<(AnalysisDetail & { email: string | null }) | null> {
    const row = await this.prisma.analysis.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        email: true,
        jobLabel: true,
        company: true,
        jobDescription: true,
        cvText: true,
        cvTextFormatted: true,
        linkedinText: true,
        linkedinTextFormatted: true,
        cvFileUrl: true,
        liFileUrl: true,
        mlFileUrl: true,
        result: true,
        deepAnalysis: true,
        motivationLetter: true,
        coverLetter: true,
        negotiationAnalysis: true,
        completedSteps: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row || !row.result) return null;
    return {
      id: row.id,
      email: row.email,
      jobLabel: row.jobLabel,
      company: row.company,
      jobDescription: row.jobDescription,
      cvText: row.cvText,
      cvTextFormatted: row.cvTextFormatted,
      linkedinText: row.linkedinText,
      linkedinTextFormatted: row.linkedinTextFormatted,
      cvFileUrl: row.cvFileUrl,
      liFileUrl: row.liFileUrl,
      mlFileUrl: row.mlFileUrl,
      motivationLetter: row.motivationLetter,
      coverLetter: row.coverLetter,
      result: row.result as AnalyzeResponse | null,
      deepAnalysis: row.deepAnalysis as DeepAnalyzeResponse | null,
      negotiationAnalysis: row.negotiationAnalysis as NegotiationAnalysis | null,
      completedSteps: row.completedSteps ?? [],
      // Public shared view never exposes the per-buyer rewrite unlock.
      premiumUnlocked: false,
      rewriteCount: 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDomain(row: AnalysisRow): StoredAnalysis {
    return {
      id: row.id,
      email: row.email,
      ip: row.ip,
      jobDescription: row.jobDescription,
      jobLabel: row.jobLabel,
      company: row.company,
      jdLanguage: row.jdLanguage,
      cvText: row.cvText,
      cvTextFormatted: row.cvTextFormatted ?? null,
      linkedinText: row.linkedinText,
      linkedinTextFormatted: row.linkedinTextFormatted ?? null,
      cvFileUrl: row.cvFileUrl ?? null,
      liFileUrl: row.liFileUrl ?? null,
      mlFileUrl: row.mlFileUrl ?? null,
      githubInfo: row.githubInfo,
      motivationLetter: row.motivationLetter,
      coverLetter: row.coverLetter,
      result: row.result as AnalyzeResponse | null,
      deepAnalysis: (row.deepAnalysis as DeepAnalyzeResponse | null) ?? null,
      negotiationAnalysis:
        (row.negotiationAnalysis as NegotiationAnalysis | null) ?? null,
      rewriteCount: row.rewriteCount ?? 0,
      outcome: row.outcome,
      outcomeUpdatedAt: row.outcomeUpdatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async incrementRewriteCount(analysisId: number, email: string): Promise<void> {
    await this.prisma.analysis.updateMany({
      where: { id: analysisId, email },
      data: { rewriteCount: { increment: 1 } },
    });
  }

  async setOutcome(
    id: number,
    email: string,
    outcome: AnalysisOutcome,
  ): Promise<boolean> {
    // Scoped by (id, email) — a user can only set the outcome of their own
    // analysis. updateMany returns count so callers can 404 on a non-match.
    const { count } = await this.prisma.analysis.updateMany({
      where: { id, email },
      data: { outcome, outcomeUpdatedAt: new Date() },
    });
    return count > 0;
  }
}
