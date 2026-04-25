import { Inject, Injectable } from '@nestjs/common';
import { SAVED_CV_REPOSITORY } from '../ports/tokens';
import type { SavedCvRepository } from '../ports/saved-cv.repository';
import type { SavedCv } from '../domain/analysis.types';

/**
 * Premium gating is enforced at the route level via @RequiresPremium() — see
 * AnalyzeController. These use cases only own the data access concern.
 */

@Injectable()
export class ListSavedCvsUseCase {
  constructor(
    @Inject(SAVED_CV_REPOSITORY) private readonly cvs: SavedCvRepository,
  ) {}

  execute(email: string): Promise<SavedCv[]> {
    return this.cvs.listByEmail(email);
  }
}

@Injectable()
export class AddSavedCvUseCase {
  constructor(
    @Inject(SAVED_CV_REPOSITORY) private readonly cvs: SavedCvRepository,
  ) {}

  execute(email: string, name: string, url: string): Promise<SavedCv> {
    return this.cvs.add(email, name, url);
  }
}

@Injectable()
export class RemoveSavedCvUseCase {
  constructor(
    @Inject(SAVED_CV_REPOSITORY) private readonly cvs: SavedCvRepository,
  ) {}

  execute(email: string, id: number): Promise<void> {
    return this.cvs.removeOwned(email, id);
  }
}
