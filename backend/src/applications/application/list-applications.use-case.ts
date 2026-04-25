import { Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '../ports/tokens';
import type { ApplicationRepository } from '../ports/application.repository';
import type { ApplicationView } from '../domain/application.types';

@Injectable()
export class ListApplicationsUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  execute(email: string): Promise<ApplicationView[]> {
    return this.applications.listByEmail(email);
  }
}
