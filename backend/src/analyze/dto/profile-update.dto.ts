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
  })
  .strict();

export type ProfileUpdateDto = z.infer<typeof ProfileUpdateSchema>;
