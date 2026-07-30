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
      // Unauthenticated GitHub API = 60 req/h per IP; each audit spends 2, so
      // ~30 audits/h before 403s silently drop the GitHub section. A token
      // (no scopes needed for public data) lifts this to 5,000 req/h.
      const token = process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        'User-Agent': 'RejectCheck-App',
        Accept: 'application/vnd.github+json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const encoded = encodeURIComponent(username);
      const init = { headers, signal: AbortSignal.timeout(2500) };

      const [profileRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${encoded}`, init),
        fetch(
          `https://api.github.com/users/${encoded}/repos?sort=updated&per_page=10`,
          init,
        ),
      ]);

      if (!profileRes.ok) return null;
      const profile = (await profileRes.json()) as GithubProfile;
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
