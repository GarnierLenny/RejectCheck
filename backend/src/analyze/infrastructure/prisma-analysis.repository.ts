import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalysisNotFoundException } from '../../common/exceptions';
import type {
  AnalysisRepository,
  ApplicationUpsertInput,
  HistoryPage,
  SaveAnalysisInput,
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
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaAnalysisRepository implements AnalysisRepository {
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

  async saveAnonymous(ip?: string): Promise<void> {
    await this.prisma.analysis.create({
      data: {
        ip: ip ?? null,
        email: null,
        jobDescription: null,
      },
    });
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
      }),
      this.prisma.analysis.count({ where }),
    ]);
    return { data: rows.map((r) => this.toDomain(r)), total };
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
    await this.prisma.analysis.updateMany({
      where: { id, email },
      data: {
        negotiationAnalysis: negotiation as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async attachDeepAnalysis(
    id: number,
    email: string,
    deep: DeepAnalyzeResponse,
  ): Promise<void> {
    await this.prisma.analysis.updateMany({
      where: { id, email },
      data: {
        deepAnalysis: deep as unknown as Prisma.InputJsonValue,
      },
    });
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
