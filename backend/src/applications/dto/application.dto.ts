import { z } from 'zod';

export const CreateApplicationSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  status: z.enum(['interested', 'applied', 'interviewing', 'offer', 'rejected']).default('applied'),
  appliedAt: z.string().optional(),
  notes: z.string().optional(),
  analysisId: z.number().int().optional(),
  seniority: z.string().optional().nullable(),
  pay: z.string().optional().nullable(),
  officeLocation: z.string().optional().nullable(),
  workSetting: z.string().optional().nullable(),
  contractType: z.string().optional().nullable(),
  languagesRequired: z.string().optional().nullable(),
  yearsOfExperience: z.string().optional().nullable(),
  companyStage: z.string().optional().nullable(),
});

export const UpdateApplicationSchema = z.object({
  jobTitle: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  status: z.enum(['interested', 'applied', 'interviewing', 'offer', 'rejected']).optional(),
  appliedAt: z.string().optional(),
  notes: z.string().optional().nullable(),
  analysisId: z.number().int().optional().nullable(),
  seniority: z.string().optional().nullable(),
  pay: z.string().optional().nullable(),
  officeLocation: z.string().optional().nullable(),
  workSetting: z.string().optional().nullable(),
  contractType: z.string().optional().nullable(),
  languagesRequired: z.string().optional().nullable(),
  yearsOfExperience: z.string().optional().nullable(),
  companyStage: z.string().optional().nullable(),
});

export type CreateApplicationDto = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationDto = z.infer<typeof UpdateApplicationSchema>;
