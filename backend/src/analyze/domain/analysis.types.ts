import type { AnalysisOutcome } from '@prisma/client';
import type {
  AnalyzeResponse,
  DeepAnalyzeResponse,
} from '../dto/analyze-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';
import type { KeywordMatchResult } from './keyword-match/keyword-match';

export type { AnalysisOutcome };
/** Outcomes the user can set (all enum values are user-selectable). */
export const ANALYSIS_OUTCOMES: readonly AnalysisOutcome[] = [
  'not_applied',
  'applied',
  'no_response',
  'interview',
  'offer',
  'rejected',
] as const;

/**
 * Domain-level snapshot of a stored analysis. Mirrors the persistence row
 * but is decoupled from Prisma — repositories return this shape, not the
 * generated Prisma model. Adapters do the mapping.
 *
 * `result` may contain either:
 *  - the full legacy response (for analyses created before the hot/deep split), or
 *  - the hot-pass-only response (for new analyses; deep fields live in `deepAnalysis`).
 *
 * Consumers that need the merged shape should use `mergeHotAndDeep` from the DTO
 * module — `getAnalysis.use-case.ts` performs this merge at retrieval time.
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
  cvTextFormatted: string | null;
  linkedinText: string | null;
  linkedinTextFormatted: string | null;
  githubInfo: string | null;
  motivationLetter: string | null;
  coverLetter: string | null;
  cvFileUrl: string | null;
  liFileUrl: string | null;
  mlFileUrl: string | null;
  result: AnalyzeResponse | null;
  deepAnalysis: DeepAnalyzeResponse | null;
  negotiationAnalysis: NegotiationAnalysis | null;
  rewriteCount: number;
  outcome: AnalysisOutcome;
  outcomeUpdatedAt: Date | null;
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
  | 'cvText'
  | 'cvTextFormatted'
  | 'linkedinText'
  | 'linkedinTextFormatted'
  | 'cvFileUrl'
  | 'liFileUrl'
  | 'mlFileUrl'
  | 'result'
  | 'deepAnalysis'
  | 'motivationLetter'
  | 'coverLetter'
  | 'negotiationAnalysis'
  | 'createdAt'
  | 'updatedAt'
> & {
  completedSteps: number[];
  premiumUnlocked: boolean;
  rewriteCount: number;
  /**
   * Deterministic keyword-match baseline for this analysis (null for legacy
   * rows — the re-scan flow recomputes it from jobDescription + cvText on
   * demand and backfills it).
   */
  keywordMatch: KeywordMatchResult | null;
};

/**
 * One free keyword-only re-scan attempt (the retention loop). Ordered oldest →
 * newest by the repository so the UI can plot coverage climbing over time.
 */
export type RescanRecord = {
  id: number;
  coverageScore: number;
  matchedCount: number;
  totalCount: number;
  keywordMatch: KeywordMatchResult;
  createdAt: Date;
};

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
  roleType: string | null;
  roleTypeOther: string | null;
  experienceLevel: string | null;
  techStack: string[];
  languages: string[];
  country: string | null;
  remotePreference: string | null;
  needsSponsorship: boolean | null;
  onboardedAt: Date | null;
  onboardingSkipped: boolean;
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
  roleType?: string | null;
  roleTypeOther?: string | null;
  experienceLevel?: string | null;
  techStack?: string[];
  languages?: string[];
  country?: string | null;
  remotePreference?: string | null;
  needsSponsorship?: boolean | null;
  onboardedAt?: Date | null;
  onboardingSkipped?: boolean;
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
