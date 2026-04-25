import { Injectable, Logger } from '@nestjs/common';
import type { GithubProvider } from '../ports/github.provider';
import type { GithubSnapshot } from '../domain/analysis.types';

type GithubProfile = {
  bio: string | null;
  public_repos: number;
  followers: number;
};

type GithubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
};

@Injectable()
export class GithubHttpProvider implements GithubProvider {
  private readonly logger = new Logger(GithubHttpProvider.name);

  async fetchProfile(username: string): Promise<GithubSnapshot | null> {
    try {
      const headers = { 'User-Agent': 'RejectCheck-App' };
      const encoded = encodeURIComponent(username);

      const profileRes = await fetch(
        `https://api.github.com/users/${encoded}`,
        { headers },
      );
      if (!profileRes.ok) return null;
      const profile = (await profileRes.json()) as GithubProfile;

      const reposRes = await fetch(
        `https://api.github.com/users/${encoded}/repos?sort=updated&per_page=10`,
        { headers },
      );
      const repos: GithubRepo[] = reposRes.ok
        ? ((await reposRes.json()) as GithubRepo[])
        : [];

      return {
        bio: profile.bio,
        public_repos: profile.public_repos,
        followers: profile.followers,
        top_repos: repos.map((r) => ({
          name: r.name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
        })),
      };
    } catch (e) {
      this.logger.error(
        'GitHub API error',
        e instanceof Error ? e.stack : String(e),
      );
      return null;
    }
  }
}
