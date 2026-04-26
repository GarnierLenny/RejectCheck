import type { SavedCv } from '../domain/analysis.types';

export interface SavedCvRepository {
  listByEmail(email: string): Promise<SavedCv[]>;
  add(email: string, name: string, url: string): Promise<SavedCv>;
  /** Throws if the row does not belong to `email`. */
  removeOwned(email: string, id: number): Promise<void>;
}
