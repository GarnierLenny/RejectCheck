import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import type { NegotiationAnalysis } from '../dto/negotiation-response.dto';
import type { RewriteResponse } from '../dto/rewrite-response.dto';
import type { RoadmapItem } from '../domain/roadmap-items';

export type AnalyzeApplicationInput = {
  jobText: string;
  cvText: string;
  githubInfo: string;
  linkedinText: string;
  motivationLetterText: string;
  locale?: string;
  /**
   * Optional callback invoked for each partial JSON chunk Claude emits while
   * building the tool_use response. Used by the SSE pipeline to forward
   * "live thoughts" to the frontend.
   */
  onDelta?: (chunk: string) => void;
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

export interface ClaudeProvider {
  analyzeApplication(input: AnalyzeApplicationInput): Promise<AnalyzeResponse>;
  rewriteCv(input: RewriteCvInput): Promise<RewriteResponse>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<string>;
  generateNegotiation(
    input: GenerateNegotiationInput,
  ): Promise<NegotiationAnalysis>;
}
