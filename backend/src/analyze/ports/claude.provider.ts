import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';
import type { ProfileDigest } from '../dto/profile-digest.dto';
import type { RewriteResponse } from '../dto/rewrite-response.dto';
import type { RoadmapItem } from '../domain/roadmap-items';
import type { ChallengeStatsSummary } from '../domain/challenge-stats.types';

export type AnalyzeApplicationInput = {
  jobText: string;
  cvText: string;
  githubInfo: string;
  linkedinText: string;
  motivationLetterText: string;
  challengeStats: ChallengeStatsSummary | null;
  locale?: string;
  // Profile-derived context for role-aware analysis. All optional — analysis
  // works without them (falls back to default software-engineer prompt).
  userRoleType?: string | null;
  userRoleTypeOther?: string | null;
  userExperienceLevel?: string | null;
  userTechStack?: string[];
  userLanguages?: string[];
  /**
   * Pre-computed ProfileDigest for registered users with a fresh digest. When
   * present, the provider emits the digest into the user message instead of
   * the raw cvText / linkedinText / githubInfo (saves ~5-7k input tokens, cuts
   * TTFT, and surfaces cross-profile inconsistencies the analyzer can react
   * to). Anonymous users and analyses run before a digest exists pass null —
   * the provider falls back to the raw sources transparently.
   */
  digest?: ProfileDigest | null;
  /**
   * Optional callback invoked for each partial JSON chunk Claude emits while
   * building the tool_use response. Used by the SSE pipeline to forward
   * "live thoughts" to the frontend.
   */
  onDelta?: (chunk: string) => void;
};

export type AnalyzeApplicationSingleInput = AnalyzeApplicationInput & {
  /**
   * When false, Claude skips generating project_recommendation. Defaults to
   * true. Set to false for free-tier users who cannot see the Bridge Project.
   */
  generateBridgeProject?: boolean;
  /**
   * Diagnostic-only generation, retained for internal callers that need a
   * cheaper response. Owner audit mode deliberately uses the full analysis.
   */
  lean?: boolean;
};

export type RewriteCvInput = {
  cvText: string;
  result: AnalyzeResponse;
  locale: string;
};

export type GenerateCoverLetterInput = {
  jobDescription: string;
  cvText: string | null;
  linkedinText: string | null;
  githubInfo: string | null;
  result: AnalyzeResponse;
  jobLabel: string | null;
  company: string | null;
  candidateName: string | null;
  language: string;
};

export type GenerateNegotiationInput = {
  jobText: string;
  result: AnalyzeResponse;
  roadmapItems: RoadmapItem[];
  locale: string;
  /** Optional callback for streaming negotiation tool_use chunks. */
  onDelta?: (chunk: string) => void;
};

export type ReviewCvInput = {
  cvText: string;
  githubInfo: string;
  linkedinText: string;
  portfolioMarkdown?: string;
  portfolioUrl?: string | null;
  locale?: string;
  userRoleType?: string | null;
  digest?: ProfileDigest | null;
  /** Diagnostic-only generation: omit token-heavy blocks when requested. */
  lean?: boolean;
  onDelta?: (chunk: string) => void;
};

export type TranscribeDocumentInput = {
  /** Raw bytes of the uploaded document (image-based PDF, or a JPEG/PNG/WebP). */
  buffer: Buffer;
  /** MIME type: 'application/pdf' or an 'image/*' type. Drives the block kind. */
  mediaType: string;
};

export type GenerateProfileDigestInput = {
  /**
   * Raw parsed text of the CV, or empty string if not available.
   * Max ~15k chars after truncation.
   */
  cvText: string;
  /** Raw parsed LinkedIn export text, or empty string. */
  linkedinText: string;
  /**
   * JSON-stringified GitHub snapshot (top repos, bio, contributions), or empty.
   */
  githubInfo: string;
  /** Markdown output from the portfolio scraper, or empty. */
  portfolioMarkdown: string;
  /** The user's portfolio URL (for citation in the prompt), or null. */
  portfolioUrl: string | null;
  /** Locale for the digest output (mostly affects prose tone). */
  locale?: string;
};

export interface ClaudeProvider {
  reviewCv(input: ReviewCvInput): Promise<CvReviewResponse>;
  /**
   * OCR fallback: extract the raw text of a document Claude can see but
   * `pdf-parse` cannot read (image-based / scanned PDF, or a direct image
   * upload). Returns the transcribed text (capped), or '' on failure.
   */
  transcribeDocument(input: TranscribeDocumentInput): Promise<string>;
  analyzeApplication(input: AnalyzeApplicationSingleInput): Promise<AnalyzeResponse>;
  generateProfileDigest(
    input: GenerateProfileDigestInput,
  ): Promise<ProfileDigest>;
  rewriteCv(input: RewriteCvInput): Promise<RewriteResponse>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<string>;
  generateNegotiation(
    input: GenerateNegotiationInput,
  ): Promise<NegotiationAnalysis>;
}
