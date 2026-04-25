import type { AnalysisDetail, StoredAnalysis } from '../domain/analysis.types';
import type { AnalyzeResponse } from '../dto/analyze-response.dto';

export type SaveAnalysisInput = {
  email: string;
  ip?: string;
  jobDescription: string;
  jobLabel: string | null;
  company: string;
  jdLanguage: string;
  cvText: string | null;
  linkedinText: string | null;
  githubInfo: string | null;
  motivationLetter: string | null;
  result: AnalyzeResponse;
};

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

  /** Persists a registered-user analysis with full payload. */
  saveRegistered(input: SaveAnalysisInput): Promise<{ id: number }>;
  /** Persists an anonymous analysis: only IP and createdAt are kept (GDPR). */
  saveAnonymous(ip?: string): Promise<void>;

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

  /** Throws AnalysisNotFoundException if the row doesn't belong to the email. */
  deleteByIdForEmail(id: number, email: string): Promise<void>;
}
