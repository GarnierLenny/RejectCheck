import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(email: string) {
    return (this.prisma as any).application.findMany({
      where: { email },
      include: {
        analysis: {
          select: { id: true, jobLabel: true, company: true, createdAt: true, result: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async create(email: string, dto: CreateApplicationDto) {
    return (this.prisma as any).application.create({
      data: {
        email,
        jobTitle: dto.jobTitle,
        company: dto.company,
        status: dto.status ?? 'applied',
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : new Date(),
        notes: dto.notes ?? null,
        analysisId: dto.analysisId ?? null,
        seniority: dto.seniority ?? null,
        pay: dto.pay ?? null,
        officeLocation: dto.officeLocation ?? null,
        workSetting: dto.workSetting ?? null,
        contractType: dto.contractType ?? null,
        languagesRequired: dto.languagesRequired ?? null,
        yearsOfExperience: dto.yearsOfExperience ?? null,
        companyStage: dto.companyStage ?? null,
      },
    });
  }

  async update(email: string, id: number, dto: UpdateApplicationDto) {
    const existing = await (this.prisma as any).application.findFirst({ where: { id, email } });
    if (!existing) throw new NotFoundException('Application not found');

    const metaFields = ['seniority', 'pay', 'officeLocation', 'workSetting', 'contractType', 'languagesRequired', 'yearsOfExperience', 'companyStage'] as const;
    const metaUpdates = Object.fromEntries(metaFields.filter(k => k in dto).map(k => [k, (dto as any)[k]]));

    return (this.prisma as any).application.update({
      where: { id },
      data: {
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.appliedAt !== undefined && { appliedAt: new Date(dto.appliedAt) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.analysisId !== undefined && { analysisId: dto.analysisId }),
        ...metaUpdates,
      },
    });
  }

  async remove(email: string, id: number) {
    const existing = await (this.prisma as any).application.findFirst({ where: { id, email } });
    if (!existing) throw new NotFoundException('Application not found');
    await (this.prisma as any).application.delete({ where: { id } });
  }
}
