import { Injectable, NotFoundException } from '@nestjs/common';
import type { Application, ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ApplicationRepository } from '../ports/application.repository';
import type {
  ApplicationView,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '../domain/application.types';

type ApplicationRow = Application & {
  analysis: {
    id: number;
    jobLabel: string | null;
    company: string | null;
    createdAt: Date;
    result: unknown;
  } | null;
};

const APPLICATION_INCLUDE = {
  analysis: {
    select: {
      id: true,
      jobLabel: true,
      company: true,
      createdAt: true,
      result: true,
    },
  },
} as const;

@Injectable()
export class PrismaApplicationRepository implements ApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByEmail(email: string): Promise<ApplicationView[]> {
    const rows = await this.prisma.application.findMany({
      where: { email },
      include: APPLICATION_INCLUDE,
      orderBy: { appliedAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(input: CreateApplicationInput): Promise<ApplicationView> {
    const row = await this.prisma.application.create({
      data: {
        email: input.email,
        jobTitle: input.jobTitle,
        company: input.company,
        status: input.status ?? 'applied',
        appliedAt: input.appliedAt ?? new Date(),
        notes: input.notes ?? null,
        analysisId: input.analysisId ?? null,
        seniority: input.seniority ?? null,
        pay: input.pay ?? null,
        officeLocation: input.officeLocation ?? null,
        workSetting: input.workSetting ?? null,
        contractType: input.contractType ?? null,
        languagesRequired: input.languagesRequired ?? null,
        yearsOfExperience: input.yearsOfExperience ?? null,
        companyStage: input.companyStage ?? null,
      },
      include: APPLICATION_INCLUDE,
    });
    return this.toDomain(row);
  }

  async updateOwned(
    email: string,
    id: number,
    input: UpdateApplicationInput,
  ): Promise<ApplicationView> {
    await this.assertOwned(email, id);

    const row = await this.prisma.application.update({
      where: { id },
      data: {
        ...(input.jobTitle !== undefined && { jobTitle: input.jobTitle }),
        ...(input.company !== undefined && { company: input.company }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.appliedAt !== undefined && { appliedAt: input.appliedAt }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.analysisId !== undefined && { analysisId: input.analysisId }),
        ...(input.seniority !== undefined && { seniority: input.seniority }),
        ...(input.pay !== undefined && { pay: input.pay }),
        ...(input.officeLocation !== undefined && {
          officeLocation: input.officeLocation,
        }),
        ...(input.workSetting !== undefined && {
          workSetting: input.workSetting,
        }),
        ...(input.contractType !== undefined && {
          contractType: input.contractType,
        }),
        ...(input.languagesRequired !== undefined && {
          languagesRequired: input.languagesRequired,
        }),
        ...(input.yearsOfExperience !== undefined && {
          yearsOfExperience: input.yearsOfExperience,
        }),
        ...(input.companyStage !== undefined && {
          companyStage: input.companyStage,
        }),
      },
      include: APPLICATION_INCLUDE,
    });
    return this.toDomain(row);
  }

  async removeOwned(email: string, id: number): Promise<void> {
    await this.assertOwned(email, id);
    await this.prisma.application.delete({ where: { id } });
  }

  private async assertOwned(email: string, id: number): Promise<void> {
    const exists = await this.prisma.application.findFirst({
      where: { id, email },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Application not found');
  }

  private toDomain(row: ApplicationRow): ApplicationView {
    return {
      id: row.id,
      email: row.email,
      jobTitle: row.jobTitle,
      company: row.company,
      status: row.status,
      appliedAt: row.appliedAt,
      notes: row.notes,
      analysisId: row.analysisId,
      seniority: row.seniority,
      pay: row.pay,
      officeLocation: row.officeLocation,
      workSetting: row.workSetting,
      contractType: row.contractType,
      languagesRequired: row.languagesRequired,
      yearsOfExperience: row.yearsOfExperience,
      companyStage: row.companyStage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      analysis: row.analysis,
    };
  }
}
