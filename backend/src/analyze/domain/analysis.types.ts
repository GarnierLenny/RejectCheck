import type { AnalyzeResponse } from '../dto/analyze-response.dto';

/**
 * Domain-level snapshot of a stored analysis. Mirrors the persistence row
 * but is decoupled from Prisma — repositories return this shape, not the
 * generated Prisma model. Adapters do the mapping.
 */
export type StoredAnalysis = {
  id: number;
  email: string | null;
  ip: string | null;
  jobDescription: string | null;
  jobLabel: string | null;
  company: string | null;
  jdLanguage: string | null;
  cvText: string | null;
  linkedinText: string | null;
  githubInfo: string | null;
  motivationLetter: string | null;
  coverLetter: string | null;
  result: AnalyzeResponse | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Subset returned by GET /analyze/:id — DB select trims the heavy raw text
 * fields that the client never needs to display.
 */
export type AnalysisDetail = Pick<
  StoredAnalysis,
  | 'id'
  | 'jobLabel'
  | 'company'
  | 'jobDescription'
  | 'result'
  | 'coverLetter'
  | 'createdAt'
  | 'updatedAt'
>;

export type Profile = {
  id: number;
  email: string;
  username: string | null;
  usernameUpdatedAt: Date | null;
  isPublic: boolean;
  bio: string | null;
  avatarUrl: string | null;
  displayName: string | null;
  githubUsername: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  socialLinks: string[];
  coverLetterName: string | null;
  followersCount: number;
  followingCount: number;
  followersLastSeenAt: Date | null;
  /** Filled by the analyze controller, not the repository. */
  unreadFollowersCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Fields the analyze profile endpoint accepts. `username` and `isPublic`/`bio`
 * are written through the dedicated public-profile module — never accept them
 * here.
 */
export type ProfileUpdate = {
  avatarUrl?: string;
  displayName?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  socialLinks?: string[];
  coverLetterName?: string;
};

export type SavedCv = {
  id: number;
  email: string;
  name: string;
  url: string;
  createdAt: Date;
};

export type GithubSnapshot = {
  bio: string | null;
  public_repos: number;
  followers: number;
  top_repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
  }>;
};
