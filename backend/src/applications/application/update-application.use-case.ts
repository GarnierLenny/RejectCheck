import { Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '../ports/tokens';
import type { ApplicationRepository } from '../ports/application.repository';
import type {
  ApplicationView,
  UpdateApplicationInput,
} from '../domain/application.types';
import type { UpdateApplicationDto } from '../dto/application.dto';

@Injectable()
export class UpdateApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  execute(
    email: string,
    id: number,
    dto: UpdateApplicationDto,
  ): Promise<ApplicationView> {
    const input: UpdateApplicationInput = {
      ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
      ...(dto.company !== undefined && { company: dto.company }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.appliedAt !== undefined && {
        appliedAt: new Date(dto.appliedAt),
      }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.analysisId !== undefined && { analysisId: dto.analysisId }),
      ...(dto.seniority !== undefined && { seniority: dto.seniority }),
      ...(dto.pay !== undefined && { pay: dto.pay }),
      ...(dto.officeLocation !== undefined && {
        officeLocation: dto.officeLocation,
      }),
      ...(dto.workSetting !== undefined && { workSetting: dto.workSetting }),
      ...(dto.contractType !== undefined && { contractType: dto.contractType }),
      ...(dto.languagesRequired !== undefined && {
        languagesRequired: dto.languagesRequired,
      }),
      ...(dto.yearsOfExperience !== undefined && {
        yearsOfExperience: dto.yearsOfExperience,
      }),
      ...(dto.companyStage !== undefined && { companyStage: dto.companyStage }),
    };
    return this.applications.updateOwned(email, id, input);
  }
}
