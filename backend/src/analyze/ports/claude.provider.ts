import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';
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

export interface ClaudeProvider {
  reviewCv(input: ReviewCvInput): Promise<CvReviewResponse>;
  /**
   * OCR fallback: extract the raw text of a document Claude can see but
   * `pdf-parse` cannot read (image-based / scanned PDF, or a direct image
   * upload). Returns the transcribed text (capped), or '' on failure.
   */
  transcribeDocument(input: TranscribeDocumentInput): Promise<string>;
  analyzeApplication(
    input: AnalyzeApplicationSingleInput,
  ): Promise<AnalyzeResponse>;
  rewriteCv(input: RewriteCvInput): Promise<RewriteResponse>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<string>;
  generateNegotiation(
    input: GenerateNegotiationInput,
  ): Promise<NegotiationAnalysis>;
}
