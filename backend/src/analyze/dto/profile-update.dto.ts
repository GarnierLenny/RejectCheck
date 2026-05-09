import { z } from 'zod';

/**
 * Strictly whitelisted fields. `username`, `isPublic`, `bio` are written
 * through the public-profile module — keep them out of here so the
 * uniqueness/validation paths stay single-sourced.
 */
export const ProfileUpdateSchema = z
  .object({
    avatarUrl: z.string().optional(),
    displayName: z.string().optional(),
    githubUsername: z.string().optional(),
    linkedinUrl: z.string().optional(),
    portfolioUrl: z.string().optional(),
    socialLinks: z.array(z.string().max(500)).max(8).optional(),
    coverLetterName: z.string().optional(),
    roleType: z
      .enum(['software', 'product', 'design', 'data', 'marketing', 'ops', 'sales', 'other'])
      .nullable()
      .optional(),
    roleTypeOther: z.string().max(60).nullable().optional(),
    experienceLevel: z
      .enum(['student', 'junior', 'mid', 'senior', 'lead', 'switcher'])
      .nullable()
      .optional(),
    techStack: z.array(z.string().max(40)).max(3).optional(),
    languages: z.array(z.string().max(40)).max(20).optional(),
    onboardedAt: z.coerce.date().nullable().optional(),
    onboardingSkipped: z.boolean().optional(),
  })
  .strict();

export type ProfileUpdateDto = z.infer<typeof ProfileUpdateSchema>;
