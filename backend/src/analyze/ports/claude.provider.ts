import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import type { RewriteResponse } from '../dto/rewrite-response.dto';

export type AnalyzeApplicationInput = {
  jobText: string;
  cvText: string;
  githubInfo: string;
  linkedinText: string;
  motivationLetterText: string;
  locale?: string;
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

export interface ClaudeProvider {
  analyzeApplication(input: AnalyzeApplicationInput): Promise<AnalyzeResponse>;
  rewriteCv(input: RewriteCvInput): Promise<RewriteResponse>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<string>;
}
