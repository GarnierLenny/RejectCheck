import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(email: string) {
    const rows = await this.prisma.application.findMany({
      where: { email },
      include: {
        Analysis: {
          select: { id: true, jobLabel: true, company: true, createdAt: true, result: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
    return rows.map(({ Analysis, ...rest }) => ({ ...rest, analysis: Analysis }));
  }

  async create(email: string, data: {
    jobTitle: string;
    company: string;
    status?: string;
    appliedAt?: string;
    notes?: string;
    analysisId?: number;
  }) {
    return this.prisma.application.create({
      data: {
        email,
        jobTitle: data.jobTitle,
        company: data.company,
        status: data.status ?? 'applied',
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
        notes: data.notes,
        analysisId: data.analysisId,
        updatedAt: new Date(),
      },
    });
  }

  async update(email: string, id: number, data: {
    jobTitle?: string;
    company?: string;
    status?: string;
    appliedAt?: string;
    notes?: string;
    analysisId?: number;
  }) {
    await this.prisma.application.findFirstOrThrow({ where: { id, email } });
    return this.prisma.application.update({
      where: { id },
      data: {
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.appliedAt !== undefined && { appliedAt: new Date(data.appliedAt) }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.analysisId !== undefined && { analysisId: data.analysisId }),
        updatedAt: new Date(),
      },
    });
  }

  async remove(email: string, id: number) {
    await this.prisma.application.findFirstOrThrow({ where: { id, email } });
    return this.prisma.application.delete({ where: { id } });
  }
}
