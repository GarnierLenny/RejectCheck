import { z } from 'zod';

export const ClaimUsernameSchema = z.object({
  username: z
    .string()
    .regex(/^[A-Za-z0-9_-]{3,30}$/, {
      message:
        'Username must be 3–30 chars and only contain letters, digits, _ or -',
    })
    .transform((s) => s.toLowerCase()),
});

export const UpdatePublicSettingsSchema = z.object({
  isPublic: z.boolean().optional(),
  bio: z.string().max(240).nullable().optional(),
});

export type ClaimUsernameDto = z.infer<typeof ClaimUsernameSchema>;
export type UpdatePublicSettingsDto = z.infer<
  typeof UpdatePublicSettingsSchema
>;
