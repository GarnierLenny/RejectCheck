export type TechnicalSkill = {
  name: string;
  expected: number;
  current: number;
  evidence: string;
};

export type ChallengeAnalysisLanguage = 'typescript' | 'python' | 'java';

export type ChallengeAnalysisCta = {
  language: string;
  message: string;
};

export type ChallengeAnalysis = {
  status: 'cta' | 'analyzed';
  matched_language?: ChallengeAnalysisLanguage | null;
  cta?: ChallengeAnalysisCta | null;
  summary?: string | null;
  strengths?: string[] | null;
  bridge_to_project?: string | null;
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

// =============================================================================
// Fix-related shapes — `fix` is optional everywhere because the backend now
// generates fixes in a 2nd async pass (`deep_done` SSE event). Tabs render
// skeleton placeholders when fix is undefined; the real content streams in
// once the deep pass finishes.
// =============================================================================

export type Fix = {
  summary: string;
  steps: string[];
  example: { before: string; after: string } | null;
  project_idea: {
    name: string;
    description: string;
    endpoints: string[];
    bonus: string | null;
    proves: string;
  } | null;
  time_required: string;
};

export type Issue = {
  severity: 'critical' | 'major' | 'minor';
  category:
    | 'keywords'
    | 'impact'
    | 'seniority'
    | 'stack'
    | 'format'
    | 'tone'
    | 'consistency';
  what: string;
  why: string;
  fix?: Fix;
};

export type HiddenRedFlag = {
  flag: string;
  perception: string;
  fix?: Fix;
};

export type SeniorityAnalysis = {
  expected: string;
  detected: string;
  gap: string;
  strength: string;
  fix?: Fix;
};

export type CvTone = {
  detected: 'passive' | 'active' | 'mixed';
  examples: string[];
  fix?: Fix;
};

export type AtsCriticalMissingKeyword = {
  keyword: string;
  jd_frequency: number;
  required: boolean;
  sections_missing: string[];
  score_impact: number;
};

export type AtsSimulation = {
  would_pass: boolean;
  score: number;
  threshold: number;
  reason: string;
  /**
   * Filled by the deep pass. May be empty (or absent) until `deep_done` arrives.
   */
  critical_missing_keywords?: AtsCriticalMissingKeyword[];
};

export type Audit = {
  cv: {
    score: number;
    strengths: string[];
    issues: Issue[];
  };
  github: {
    score: number | null;
    strengths: string[];
    issues: Issue[];
  };
  linkedin: {
    score: number | null;
    strengths: string[];
    issues: Issue[];
  };
  jd_match: {
    required_skills: Array<{
      skill: string;
      found: boolean;
      evidence: string | null;
    }>;
    experience_gap: string | null;
  };
};

export type AnalysisResult = {
  score: number;
  verdict: 'Low' | 'Medium' | 'High';
  confidence: { score: number; reason: string };
  breakdown: {
    keyword_match: number;
    tech_stack_fit: number;
    experience_level: number;
    github_signal: number | null;
    linkedin_signal: number | null;
  };
  ats_simulation: AtsSimulation;
  seniority_analysis: SeniorityAnalysis;
  cv_tone: CvTone;
  audit: Audit;
  hidden_red_flags: HiddenRedFlag[];
  correlation: { detected: boolean; explanation: string };
  job_details: JobDetails;
  /** Filled by the deep pass. May be undefined until `deep_done` arrives. */
  technical_analysis?: {
    skills: TechnicalSkill[];
    skill_priority: string[];
    recommendation: string;
    reasoning: string;
    market_context: string;
    seniority_signals: string[];
  };
  /** Filled by the deep pass. May be undefined until `deep_done` arrives. */
  project_recommendation?: ProjectRecommendation;
  challenge_analysis?: ChallengeAnalysis | null;
  negotiation_analysis?: NegotiationAnalysis | null;
};

/**
 * Shape of the `deep` payload pushed to the frontend on the `deep_done` SSE
 * event. The frontend re-merges this into the local `AnalysisResult` by index.
 */
export type DeepAnalysisPayload = {
  technical_analysis: {
    skills: TechnicalSkill[];
    skill_priority: string[];
    recommendation: string;
    reasoning: string;
    market_context: string;
    seniority_signals: string[];
  };
  project_recommendation: ProjectRecommendation;
  ats_critical_missing_keywords: AtsCriticalMissingKeyword[];
  fixes: {
    seniority_analysis: Fix;
    cv_tone: Fix;
    audit_cv_issues: Fix[];
    audit_github_issues: Fix[];
    audit_linkedin_issues: Fix[];
    hidden_red_flags: Fix[];
  };
};

export const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "critical": return "text-rc-red bg-rc-red/10 border-rc-red/20";
    case "major":    return "text-rc-amber bg-rc-amber/10 border-rc-amber/20";
    case "minor":    return "text-rc-muted bg-rc-muted/10 border-rc-muted/20";
    default:         return "text-rc-muted bg-rc-muted/5 border-rc-border";
  }
};

/**
 * Re-merges a deep payload into a hot-only AnalysisResult. Used when the
 * frontend receives the `deep_done` event and needs to inject the deep content
 * into its local state (which currently has skeleton placeholders).
 *
 * Mirrors the backend `mergeHotAndDeep` helper.
 */
export function mergeDeepIntoResult(
  result: AnalysisResult,
  deep: DeepAnalysisPayload,
): AnalysisResult {
  return {
    ...result,
    ats_simulation: {
      ...result.ats_simulation,
      critical_missing_keywords: deep.ats_critical_missing_keywords,
    },
    seniority_analysis: {
      ...result.seniority_analysis,
      fix: deep.fixes.seniority_analysis,
    },
    cv_tone: {
      ...result.cv_tone,
      fix: deep.fixes.cv_tone,
    },
    audit: {
      ...result.audit,
      cv: {
        ...result.audit.cv,
        issues: result.audit.cv.issues.map((issue, i) => ({
          ...issue,
          fix: deep.fixes.audit_cv_issues[i] ?? issue.fix,
        })),
      },
      github: {
        ...result.audit.github,
        issues: result.audit.github.issues.map((issue, i) => ({
          ...issue,
          fix: deep.fixes.audit_github_issues[i] ?? issue.fix,
        })),
      },
      linkedin: {
        ...result.audit.linkedin,
        issues: result.audit.linkedin.issues.map((issue, i) => ({
          ...issue,
          fix: deep.fixes.audit_linkedin_issues[i] ?? issue.fix,
        })),
      },
    },
    hidden_red_flags: result.hidden_red_flags.map((flag, i) => ({
      ...flag,
      fix: deep.fixes.hidden_red_flags[i] ?? flag.fix,
    })),
    technical_analysis: deep.technical_analysis,
    project_recommendation: deep.project_recommendation,
  };
}
