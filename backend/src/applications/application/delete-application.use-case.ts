import { Inject, Injectable } from '@nestjs/common';
import { APPLICATION_REPOSITORY } from '../ports/tokens';
import type { ApplicationRepository } from '../ports/application.repository';

@Injectable()
export class DeleteApplicationUseCase {
  constructor(
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  execute(email: string, id: number): Promise<void> {
    return this.applications.removeOwned(email, id);
  }
}
