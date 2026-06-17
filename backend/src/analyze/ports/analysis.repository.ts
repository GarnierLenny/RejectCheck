import type { AnalysisDetail, StoredAnalysis } from '../domain/analysis.types';
import type {
  AnalyzeResponse,
  DeepAnalyzeResponse,
  HotAnalyzeResponse,
} from '../dto/analyze-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';

export type SaveAnalysisInput = {
  email: string;
  ip?: string;
  jobDescription: string;
  jobLabel: string | null;
  company: string;
  jdLanguage: string;
  cvText: string | null;
  cvTextFormatted?: string | null;
  linkedinText: string | null;
  linkedinTextFormatted?: string | null;
  githubInfo: string | null;
  motivationLetter: string | null;
  /** Credits to deduct from the monthly allowance. See CREDIT_COSTS. */
  creditCost: number;
  /** Hot-pass result, or full merged result for backward compat. */
  result: AnalyzeResponse | HotAnalyzeResponse;
  deepAnalysis?: DeepAnalyzeResponse | null;
  negotiationAnalysis?: NegotiationAnalysis | null;
};

/** Same payload as a registered save, minus the account-specific fields. */
export type SaveAnonymousInput = Omit<SaveAnalysisInput, 'email' | 'creditCost'>;

export type ApplicationUpsertInput = {
  email: string;
  jobTitle: string;
  company: string;
  analysisId: number;
  meta: {
    seniority: string | null;
    pay: string | null;
    officeLocation: string | null;
    workSetting: string | null;
    contractType: string | null;
    languagesRequired: string | null;
    yearsOfExperience: string | null;
    companyStage: string | null;
  };
};

export type HistoryPage = {
  data: StoredAnalysis[];
  total: number;
};

export interface AnalysisRepository {
  countByEmail(email: string): Promise<number>;
  countByIp(ip: string): Promise<number>;
  /**
   * Count of analyses created at or after the given date for this email.
   * Used to compute monthly quota usage (caller passes startOfMonthUTC()).
   */
  countByEmailSince(email: string, since: Date): Promise<number>;
  /**
   * Sum of creditCost for all analyses created at or after the given date.
   * Used to compute credit-based monthly quota usage.
   */
  creditsSince(email: string, since: Date): Promise<number>;

  /** Persists a registered-user analysis with full payload. */
  saveRegistered(input: SaveAnalysisInput): Promise<{ id: number }>;
  /**
   * Persists an anonymous analysis with its full payload + a one-time
   * claimToken so the user can attach it to their account at signup. The row
   * keeps ip/createdAt for rate-limiting; its PII is scrubbed by the TTL job if
   * never claimed.
   */
  saveAnonymous(
    input: SaveAnonymousInput,
  ): Promise<{ id: number; claimToken: string }>;
  /**
   * Attaches an unclaimed anonymous analysis to a user (sets email, clears the
   * token). Returns null if the token is unknown or already claimed.
   */
  claimByToken(
    email: string,
    claimToken: string,
  ): Promise<{ id: number } | null>;
  /**
   * GDPR TTL: scrub PII from unclaimed anonymous analyses older than `cutoff`,
   * keeping the row (ip + createdAt) so IP rate-limiting is unaffected. Returns
   * how many rows were scrubbed.
   */
  scrubUnclaimedOlderThan(cutoff: Date): Promise<number>;

  /** Upserts the matching Application row so the analyses surface in the user's tracker. */
  upsertApplication(input: ApplicationUpsertInput): Promise<void>;

  findById(id: number, email: string): Promise<StoredAnalysis | null>;
  findDetailById(id: number, email: string): Promise<AnalysisDetail | null>;

  paginateByEmail(
    email: string,
    page: number,
    limit: number,
  ): Promise<HistoryPage>;

  /** Merges `rewrite` into the stored result JSON. No-op if not found. */
  attachRewrite(
    id: number,
    email: string,
    rewrite: { reconstructed_cv: string },
  ): Promise<void>;

  /** Persists the cover letter text on the analysis row. */
  attachCoverLetter(
    id: number,
    email: string,
    coverLetter: string,
  ): Promise<void>;

  /** Persists uploaded file URLs on the analysis row (authenticated users only). */
  attachFileUrls(
    id: number,
    email: string,
    urls: { cvFileUrl?: string; liFileUrl?: string; mlFileUrl?: string },
  ): Promise<void>;

  /** Persists the HIRED-only negotiation playbook on the analysis row. */
  attachNegotiation(
    id: number,
    email: string,
    negotiation: NegotiationAnalysis,
  ): Promise<void>;

  /** Persists the deep-pass result on the analysis row. */
  attachDeepAnalysis(
    id: number,
    email: string,
    deep: DeepAnalyzeResponse,
  ): Promise<void>;

  /** Returns cached starter repo files, or null if not generated yet. */
  findStarterRepo(id: number, email: string): Promise<unknown | null>;

  /** Persists the Gemini-generated starter repo file tree. */
  attachStarterRepo(id: number, email: string, repo: unknown): Promise<void>;

  /** Persists the bridge project step indices checked off by the user. */
  saveCompletedSteps(id: number, email: string, steps: number[]): Promise<void>;

  /** Throws AnalysisNotFoundException if the row doesn't belong to the email. */
  deleteByIdForEmail(id: number, email: string): Promise<void>;

  /**
   * Generates (or returns existing) share token for an analysis.
   * Throws AnalysisNotFoundException if the analysis doesn't belong to the email.
   */
  createShareToken(id: number, email: string): Promise<string>;

  /**
   * Generates (or returns existing) share token for an *anonymous* analysis,
   * identified by its claimToken (proof of ownership for a logged-out run).
   * Returns null if the token is unknown, already claimed, or has no result.
   */
  createShareTokenForClaim(claimToken: string): Promise<string | null>;

  /** Finds a shared analysis by its public token. Returns null if not found or has no result. */
  findByShareToken(token: string): Promise<(AnalysisDetail & { email: string | null }) | null>;

  /**
   * One-time "unlock this CV" purchase: marks premium features (CV rewrite,
   * cover letter) unlocked for a single analysis owned by `email`. Idempotent
   * (re-marking just refreshes the timestamp). No-op if the analysis isn't
   * owned by that email. Returns true if a row was updated.
   */
  markPremiumUnlocked(analysisId: number, email: string): Promise<boolean>;

  /** True if this analysis (owned by `email`) has a one-time premium unlock. */
  isPremiumUnlocked(analysisId: number, email: string): Promise<boolean>;

  /** Increments the CV-rewrite generation counter for this analysis (cost cap). */
  incrementRewriteCount(analysisId: number, email: string): Promise<void>;
}
