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

export type TechItem = string | { name: string; category: string; reason: string };

export function techName(item: TechItem): string {
  return typeof item === 'string' ? item : item.name;
}

export type ProjectStep = { title: string; description: string; duration: string };
export type ProjectSectionStep = { title: string; description: string };
export type ProjectSection = { title: string; duration: string; steps: ProjectSectionStep[] };
export type ProjectEdgeCase = { problem: string; solution: string };
export type GapBridge = { skill_name: string; phase_title: string; claim: string };
export type ProjectInterviewQuestion = { question: string; answer: string };
export type ProjectHowToSell = {
  github_readme_tip: string;
  interview_pitch: string;
  star_tactics: string;
};

export type ProjectRecommendation = {
  name: string;
  description: string;
  technologies: TechItem[];
  key_features: string[];
  architecture: string;
  advanced_concepts: string[];
  success_criteria: string[];
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  why_it_matters: string;
  what_matters: string[];
  cv_bullet?: string;
  signal_boost?: string;
  // README fields (new analyses only)
  architecture_diagram?: string;
  sections?: ProjectSection[];
  /** Backward compat — flat steps before sections were introduced */
  steps?: ProjectStep[];
  edge_cases?: ProjectEdgeCase[];
  going_further?: string[];
  how_to_sell?: ProjectHowToSell;
  interview_questions?: ProjectInterviewQuestion[];
  testing_strategy?: string;
  gap_bridges?: GapBridge[];
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
  rewrites?: string[];
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
  /** Absent on CV-review analyses (no job description to match against). */
  jd_match?: {
    required_skills: Array<{
      skill: string;
      found: boolean;
      evidence: string | null;
    }>;
    experience_gap: string | null;
  };
};

export type CrossProfileInconsistency = {
  severity: 'critical' | 'major' | 'minor';
  sources: Array<'cv' | 'linkedin' | 'github' | 'portfolio'>;
  field:
    | 'job_title'
    | 'company'
    | 'dates'
    | 'tech_stack'
    | 'ownership'
    | 'seniority'
    | 'project_attribution'
    | 'location'
    | 'other';
  description: string;
  recruiter_perception: string;
  /** ISO yyyy-mm date used to position a marker on the timeline. Null when the divergence isn't temporally locatable. */
  anchor_date: string | null;
};

export type TimelineEntry = {
  title: string;
  company: string;
  source: 'cv' | 'linkedin' | 'github' | 'portfolio';
  /** ISO yyyy-mm */
  start: string;
  /** ISO yyyy-mm or 'present' */
  end: string;
};

export type CvQuality = {
  overall: number;
  clarity: number;
  impact: number;
  hard_skills: number;
  soft_skills: number;
  consistency: number;
  ats_format: number;
};

export type CvQualityNotes = {
  clarity?: string;
  impact?: string;
  hard_skills?: string;
  soft_skills?: string;
  consistency?: string;
  ats_format?: string;
};

export type PositioningGaps = {
  target_role: string;
  gaps: { what: string; fix: string }[];
};

export type SkillRadarAxis = {
  label: string;
  score: number;
  evidence: string;
};

export type SkillRadar = {
  axes: SkillRadarAxis[];
};

export type ProjectedProfile = {
  seniority: string;
  target_roles: string[];
  domains: string[];
  narrative: string;
  profile_type: 'specialist' | 'generalist' | 'transitioning';
};

export type CvReviewAtsIssue = {
  what: string;
  why: string;
  fix?: string;
};

export type CvReviewAts = {
  score: number;
  issues: CvReviewAtsIssue[];
};

export type AnalysisResult = {
  score: number;
  /** Absent on CV-review analyses (no job description to match against). */
  verdict?: 'Low' | 'Medium' | 'High';
  /** Absent on CV-review analyses. */
  confidence?: { score: number; reason: string };
  /** Absent on CV-review analyses. */
  breakdown?: {
    keyword_match: number;
    tech_stack_fit: number;
    experience_level: number;
    github_signal: number | null;
    linkedin_signal: number | null;
  };
  /** Absent on CV-review analyses. */
  ats_simulation?: AtsSimulation;
  seniority_analysis: SeniorityAnalysis;
  cv_tone: CvTone;
  audit: Audit;
  hidden_red_flags: HiddenRedFlag[];
  /** Absent on CV-review analyses. */
  correlation?: { detected: boolean; explanation: string };
  /** Absent on CV-review analyses. */
  job_details?: JobDetails;
  /** CV-review quality scores. Present only on CV-review analyses. */
  cv_quality?: CvQuality;
  /** CV-review skill radar. Present only on CV-review analyses. */
  skill_radar?: SkillRadar;
  /** Per-dimension explanation for scores below 70. Present only on CV-review analyses. */
  cv_quality_notes?: CvQualityNotes;
  /** Gaps to close to project the most aspirational role. Present only on CV-review analyses. */
  positioning_gaps?: PositioningGaps;
  /** CV-review projected profile. Present only on CV-review analyses. */
  projected_profile?: ProjectedProfile;
  /** CV-review ATS structural audit. Present only on CV-review analyses. */
  ats_audit?: CvReviewAts;
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
  /**
   * Pre-computed cross-profile inconsistencies surfaced from the user's
   * ProfileDigest. Drives the "Consistency check" banner / section. Empty
   * or undefined for anonymous users.
   */
  cross_profile_inconsistencies?: CrossProfileInconsistency[];
  /**
   * Per-source job chronology from the ProfileDigest. Powers the timeline
   * visualization in the Consistency tab — one entry per source-occurrence
   * of each job, so the same role on CV and LinkedIn becomes two entries
   * with their own dates (which the UI renders as parallel bars).
   */
  timeline_entries?: TimelineEntry[];
};

/**
 * Shape of the `deep` payload pushed to the frontend on the `deep_done` SSE
 * event. The frontend re-merges this into the local `AnalysisResult` by index.
 *
 * `technical_analysis` is generated in the HOT pass (it powers the Skill Gap
 * radar that lands as the default tab), so it's not part of the deep payload.
 * The field stays optional on mid-format analyses that pre-date the move —
 * see `mergeDeepIntoResult` for the backward-compat fallback.
 */
export type DeepAnalysisPayload = {
  /** Backward-compat only: present on mid-format DB rows. New analyses don't have this. */
  technical_analysis?: {
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
    ats_simulation: result.ats_simulation ? {
      ...result.ats_simulation,
      critical_missing_keywords: deep.ats_critical_missing_keywords,
    } : undefined,
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
    // technical_analysis lives in the hot result for new analyses, so it's
    // already on `result`. For mid-format analyses replayed via getAnalysis,
    // the deep payload may still carry it — keep it as a fallback.
    technical_analysis: result.technical_analysis ?? deep.technical_analysis,
    project_recommendation: deep.project_recommendation,
  };
}
