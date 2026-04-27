import { z } from 'zod';

export const ListPaginationSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListPaginationDto = z.infer<typeof ListPaginationSchema>;
