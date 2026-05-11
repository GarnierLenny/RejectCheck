import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  CLAUDE_PROVIDER,
  DIGEST_REPOSITORY,
  GITHUB_PROVIDER,
  PORTFOLIO_SCRAPER,
  PROFILE_REPOSITORY,
} from '../ports/tokens';
import type { ClaudeProvider } from '../ports/claude.provider';
import type { DigestRepository } from '../ports/digest.repository';
import type { GithubProvider } from '../ports/github.provider';
import type { PortfolioScraper } from '../ports/portfolio.scraper';
import type { ProfileRepository } from '../ports/profile.repository';
import type {
  DigestSourceHashes,
  ProfileDigest,
} from '../dto/profile-digest.dto';

/**
 * Input snapshot for digest generation. The caller assembles the raw source
 * material (typically from the user's current CV upload + profile fields)
 * and we synthesise it via Claude Haiku into a ProfileDigest.
 *
 * - cvBuffer / cvText: either-or. If both are provided, cvBuffer wins (we
 *   re-hash from the raw PDF to keep the source-of-truth deterministic).
 * - linkedinText / githubUsername / portfolioUrl: pulled from the user's
 *   Profile row by the refresh endpoint, or passed inline by the analyze
 *   flow when it has a fresh CV in hand.
 */
export type GenerateProfileDigestCommand = {
  email: string;
  cvBuffer?: Buffer;
  cvText?: string;
  linkedinText?: string | null;
  githubUsername?: string | null;
  portfolioUrl?: string | null;
  locale?: string;
};

/**
 * Generates a ProfileDigest for a registered user and persists it.
 *
 * Workflow:
 *  1. Resolve every source (CV text, LinkedIn text, GitHub snapshot, portfolio
 *     markdown). Missing or failing sources are silently dropped.
 *  2. Compute deterministic source hashes (used later by callers to decide
 *     whether to skip regeneration).
 *  3. Call Claude Haiku via the provider.
 *  4. Persist the digest + hashes on the user's Profile row.
 *
 * Anonymous users have no Profile row → this use case is registered-only.
 */
@Injectable()
export class GenerateProfileDigestUseCase {
  private readonly logger = new Logger(GenerateProfileDigestUseCase.name);

  constructor(
    @Inject(CLAUDE_PROVIDER) private readonly claude: ClaudeProvider,
    @Inject(DIGEST_REPOSITORY) private readonly digests: DigestRepository,
    @Inject(GITHUB_PROVIDER) private readonly github: GithubProvider,
    @Inject(PORTFOLIO_SCRAPER)
    private readonly portfolioScraper: PortfolioScraper,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
  ) {}

  async execute(
    cmd: GenerateProfileDigestCommand,
  ): Promise<{ digest: ProfileDigest; hashes: DigestSourceHashes }> {
    // If the caller didn't pass inline values for LinkedIn / GitHub / portfolio,
    // pull them from the stored Profile row. (Useful for the manual refresh
    // endpoint, which only has an email.)
    const stored = await this.profiles.findByEmail(cmd.email).catch(() => null);

    const githubUsername =
      cmd.githubUsername !== undefined
        ? cmd.githubUsername
        : (stored?.githubUsername ?? null);
    const portfolioUrl =
      cmd.portfolioUrl !== undefined
        ? cmd.portfolioUrl
        : (stored?.portfolioUrl ?? null);
    const linkedinText = cmd.linkedinText ?? null;

    // Resolve CV text + a stable hash. We prefer the raw buffer because text
    // extraction can vary subtly between PDF parser versions; the buffer is
    // the canonical source.
    const cvText = cmd.cvText?.trim() ?? '';
    const cvHash =
      cmd.cvBuffer != null
        ? sha256(cmd.cvBuffer)
        : cvText
          ? sha256(Buffer.from(cvText))
          : null;

    // Pull GitHub + portfolio in parallel; either may fail soft.
    const [githubSnapshot, portfolioSnapshot] = await Promise.all([
      githubUsername
        ? this.github.fetchProfile(githubUsername).catch((err) => {
            this.logger.warn(
              `GitHub fetch failed for ${githubUsername}: ${err?.message || err}`,
            );
            return null;
          })
        : Promise.resolve(null),
      portfolioUrl
        ? this.portfolioScraper.fetch(portfolioUrl).catch((err) => {
            this.logger.warn(
              `Portfolio fetch failed for ${portfolioUrl}: ${err?.message || err}`,
            );
            return null;
          })
        : Promise.resolve(null),
    ]);

    const githubInfo = githubSnapshot
      ? JSON.stringify(githubSnapshot, null, 2)
      : '';
    const portfolioMarkdown = portfolioSnapshot?.markdown ?? '';

    const digest = await this.claude.generateProfileDigest({
      cvText,
      linkedinText: linkedinText ?? '',
      githubInfo,
      portfolioMarkdown,
      portfolioUrl,
      locale: cmd.locale,
    });

    const hashes: DigestSourceHashes = {
      cv: cvHash,
      linkedin: linkedinText ? sha256(Buffer.from(linkedinText)) : null,
      githubUsername: githubUsername ? githubUsername.toLowerCase() : null,
      portfolioUrl: portfolioUrl ? portfolioUrl.trim().toLowerCase() : null,
    };

    await this.digests.save(cmd.email, digest, hashes);

    this.logger.log(
      `ProfileDigest saved for ${cmd.email} ` +
        `(work=${digest.work_history.length}, projects=${digest.projects.length}, ` +
        `inconsistencies=${digest.cross_profile_inconsistencies.length})`,
    );

    return { digest, hashes };
  }
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}
