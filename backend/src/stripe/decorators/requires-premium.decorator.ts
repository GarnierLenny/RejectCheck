import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../../auth/supabase.guard';
import {
  PremiumGuard,
  REQUIRED_PLAN_KEY,
  type RequiredPlan,
} from '../guards/premium.guard';

/**
 * Composite decorator that:
 *  1. requires the user to be authenticated (SupabaseGuard)
 *  2. enforces the chosen subscription tier (PremiumGuard reads metadata)
 *
 * Default tier is `shortlisted` (any active paid plan). Use 'hired' for
 * features reserved to the top tier (e.g. cover letter generation).
 */
export function RequiresPremium(plan: RequiredPlan = 'shortlisted') {
  return applyDecorators(
    SetMetadata(REQUIRED_PLAN_KEY, plan),
    UseGuards(SupabaseGuard, PremiumGuard),
  );
}
