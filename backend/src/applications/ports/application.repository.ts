import type {
  ApplicationView,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '../domain/application.types';

export interface ApplicationRepository {
  listByEmail(email: string): Promise<ApplicationView[]>;
  create(input: CreateApplicationInput): Promise<ApplicationView>;
  /** Throws NotFoundException if the row doesn't belong to `email`. */
  updateOwned(
    email: string,
    id: number,
    input: UpdateApplicationInput,
  ): Promise<ApplicationView>;
  /** Throws NotFoundException if the row doesn't belong to `email`. */
  removeOwned(email: string, id: number): Promise<void>;
}
