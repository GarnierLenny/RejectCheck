import type { components } from "../types/api";

export type TechnicalSkill = {
  name: string;
  expected: number;
  current: number;
  evidence: string;
};

export type ProjectRecommendation = {
  name: string;
  description: string;
  technologies: string[];
  key_features: string[];
  architecture: string;
  advanced_concepts: string[];
  success_criteria: string[];
  difficulty_level: 'Intermediate' | 'Advanced' | 'Expert';
  why_it_matters: string;
  what_matters: string[];
};

export type SalaryRange = {
  min: number;
  max: number;
  currency: 'EUR' | 'USD' | 'GBP';
};

export type LeveragePoint = {
  label: string;
  level: 'high' | 'medium' | 'watch';
  evidence: string;
  impact_eur?: number | null;
};

export type CounterOfferEmail = {
  subject: string;
  body: string;
  anchor_amount: number;
};

export type AnchoringStrategy = {
  when_to_anchor: string;
  anchor_amount: number;
  fallback: string;
};

export type TalkingPoint = {
  scenario: string;
  phrase: string;
};

export type RoadmapSalaryImpact = {
  roadmap_item_id: string;
  impact_min: number;
  impact_max: number;
  currency: 'EUR' | 'USD' | 'GBP';
  reasoning?: string;
};

export type SalaryPeriod = 'annual' | 'daily';

export type NegotiationAnalysis = {
  period: SalaryPeriod;
  market_range: SalaryRange;
  candidate_range: SalaryRange;
  jd_disclosed_salary: SalaryRange | null;
  gap_vs_market: number;
  gap_reason?: string;
  how_to_close?: string;
  leverage_points: LeveragePoint[];
  counter_offer_email: CounterOfferEmail;
  anchoring_strategy: AnchoringStrategy;
  talking_points: TalkingPoint[];
  roadmap_salary_impact: RoadmapSalaryImpact[];
  confidence: 'low' | 'medium' | 'high';
  disclaimer: string;
  sources: string[];
};

export type JobDetails = {
  title: string;
  company: string;
  seniority?: string | null;
  pay?: string | null;
  office_location?: string | null;
  work_setting?: string | null;
  contract_type?: string | null;
  languages_required?: string | null;
  years_of_experience?: string | null;
  company_stage?: string | null;
  jd_language?: string;
};

export type AnalysisResult = components["schemas"]["AnalyzeResponseDto"] & {
  technical_analysis: {
    skills: TechnicalSkill[];
    skill_priority: string[];
    recommendation: string;
    reasoning: string;
    market_context: string;
    seniority_signals: string[];
  };
  project_recommendation: ProjectRecommendation;
  job_details: JobDetails;
  negotiation_analysis?: NegotiationAnalysis | null;
};
export type Issue = AnalysisResult["audit"]["cv"]["issues"][number];
export type Fix = AnalysisResult["seniority_analysis"]["fix"];

export const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "critical": return "text-rc-red bg-rc-red/10 border-rc-red/20";
    case "major":    return "text-rc-amber bg-rc-amber/10 border-rc-amber/20";
    case "minor":    return "text-rc-muted bg-rc-muted/10 border-rc-muted/20";
    default:         return "text-rc-muted bg-rc-muted/5 border-rc-border";
  }
};
