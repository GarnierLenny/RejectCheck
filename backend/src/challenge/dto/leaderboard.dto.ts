import { z } from 'zod';

export const LeaderboardScopeSchema = z.enum(['global', 'following']).default('global');
export const LeaderboardPeriodSchema = z.enum(['alltime', 'week']).default('alltime');

export const ChallengeLeaderboardQuerySchema = z.object({
  scope: LeaderboardScopeSchema,
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const GlobalLeaderboardQuerySchema = z.object({
  scope: LeaderboardScopeSchema,
  period: LeaderboardPeriodSchema,
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const StreakLeaderboardQuerySchema = z.object({
  scope: LeaderboardScopeSchema,
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
