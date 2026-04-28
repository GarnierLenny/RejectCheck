import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SalaryRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  currency: z.enum(['EUR', 'USD', 'GBP']),
});

export const LeveragePointSchema = z.object({
  label: z.string(),
  level: z.enum(['high', 'medium', 'watch']),
  evidence: z.string(),
  impact_eur: z.number().nullable().optional(),
});

export const CounterOfferEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  anchor_amount: z.number().nonnegative(),
});

export const AnchoringStrategySchema = z.object({
  when_to_anchor: z.string(),
  anchor_amount: z.number().nonnegative(),
  fallback: z.string(),
});

export const TalkingPointSchema = z.object({
  scenario: z.string(),
  phrase: z.string(),
});

export const RoadmapSalaryImpactSchema = z.object({
  roadmap_item_id: z.string(),
  impact_min: z.number().nonnegative(),
  impact_max: z.number().nonnegative(),
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
  reasoning: z.string().optional(),
});

export const NegotiationAnalysisSchema = z.object({
  period: z.enum(['annual', 'daily']).default('annual'),
  market_range: SalaryRangeSchema,
  candidate_range: SalaryRangeSchema,
  jd_disclosed_salary: SalaryRangeSchema.nullable(),
  gap_vs_market: z.number(),
  gap_reason: z.string().optional().default(''),
  how_to_close: z.string().optional().default(''),
  leverage_points: z.array(LeveragePointSchema).min(1).max(5),
  counter_offer_email: CounterOfferEmailSchema,
  anchoring_strategy: AnchoringStrategySchema,
  talking_points: z.array(TalkingPointSchema).min(1).max(5),
  roadmap_salary_impact: z.array(RoadmapSalaryImpactSchema).default([]),
  confidence: z.enum(['low', 'medium', 'high']),
  disclaimer: z.string(),
  sources: z.array(z.string()).default([]),
});

export class NegotiationAnalysisDto extends createZodDto(
  NegotiationAnalysisSchema,
) {}

export type NegotiationAnalysis = z.infer<typeof NegotiationAnalysisSchema>;
export type SalaryRange = z.infer<typeof SalaryRangeSchema>;
export type LeveragePoint = z.infer<typeof LeveragePointSchema>;
export type RoadmapSalaryImpact = z.infer<typeof RoadmapSalaryImpactSchema>;
