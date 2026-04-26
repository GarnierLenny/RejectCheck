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
import type { AnalyzeResponse } from '../dto/analyze-response.dto';

type AnalysisRow = {
  id: number;
  email: string | null;
  ip: string | null;
  jobDescription: string | null;
  jobLabel: string | null;
  company: string | null;
  jdLanguage: string | null;
  cvText: string | null;
  linkedinText: string | null;
  githubInfo: string | null;
  motivationLetter: string | null;
  coverLetter: string | null;
  result: Prisma.JsonValue | null;
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
        linkedinText: input.linkedinText,
        githubInfo: input.githubInfo,
        motivationLetter: input.motivationLetter,
        result: input.result as unknown as Prisma.InputJsonValue,
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
        result: true,
        coverLetter: true,
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
      coverLetter: row.coverLetter,
      result: row.result as AnalyzeResponse | null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
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

  async deleteByIdForEmail(id: number, email: string): Promise<void> {
    const exists = await this.prisma.analysis.findFirst({
      where: { id, email },
      select: { id: true },
    });
    if (!exists) throw new AnalysisNotFoundException(id);
    await this.prisma.analysis.delete({ where: { id } });
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
      linkedinText: row.linkedinText,
      githubInfo: row.githubInfo,
      motivationLetter: row.motivationLetter,
      coverLetter: row.coverLetter,
      result: row.result as AnalyzeResponse | null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
