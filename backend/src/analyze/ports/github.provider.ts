import type { GithubSnapshot } from '../domain/analysis.types';

export interface GithubProvider {
  /** Fetches a public profile snapshot. Returns null if the user is not found
   * or the GitHub API is unreachable — never throws. */
  fetchProfile(username: string): Promise<GithubSnapshot | null>;
}
