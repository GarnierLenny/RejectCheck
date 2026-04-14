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
