import type { ApplicationStatus } from '@prisma/client';

/**
 * Domain view of an Application — decouples consumers from Prisma's generated
 * types and the optional `analysis` join. Repository adapters perform the
 * mapping.
 */
export type ApplicationView = {
  id: number;
  email: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedAt: Date;
  notes: string | null;
  analysisId: number | null;
  seniority: string | null;
  pay: string | null;
  officeLocation: string | null;
  workSetting: string | null;
  contractType: string | null;
  languagesRequired: string | null;
  yearsOfExperience: string | null;
  companyStage: string | null;
  createdAt: Date;
  updatedAt: Date;
  analysis: ApplicationAnalysisSummary | null;
};

export type ApplicationAnalysisSummary = {
  id: number;
  jobLabel: string | null;
  company: string | null;
  createdAt: Date;
  // The full result blob is exposed on purpose: the dashboard renders the
  // overall score from it. If we ever need to trim it, do it in the use case.
  result: unknown;
};

export type CreateApplicationInput = {
  email: string;
  jobTitle: string;
  company: string;
  status?: ApplicationStatus;
  appliedAt?: Date;
  notes?: string | null;
  analysisId?: number | null;
} & ApplicationMeta;

export type UpdateApplicationInput = {
  jobTitle?: string;
  company?: string;
  status?: ApplicationStatus;
  appliedAt?: Date;
  notes?: string | null;
  analysisId?: number | null;
} & Partial<ApplicationMeta>;

export type ApplicationMeta = {
  seniority?: string | null;
  pay?: string | null;
  officeLocation?: string | null;
  workSetting?: string | null;
  contractType?: string | null;
  languagesRequired?: string | null;
  yearsOfExperience?: string | null;
  companyStage?: string | null;
};
