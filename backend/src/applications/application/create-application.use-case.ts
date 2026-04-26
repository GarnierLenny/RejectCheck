import { Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '../ports/tokens';
import type { ApplicationRepository } from '../ports/application.repository';
import type {
  ApplicationView,
  CreateApplicationInput,
} from '../domain/application.types';
import type { CreateApplicationDto } from '../dto/application.dto';

@Injectable()
export class CreateApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  execute(email: string, dto: CreateApplicationDto): Promise<ApplicationView> {
    const input: CreateApplicationInput = {
      email,
      jobTitle: dto.jobTitle,
      company: dto.company,
      status: dto.status,
      appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
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
    };
    return this.applications.create(input);
  }
}
