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
// Fix-related shapes — `fix` is always present on new analyses (single-pass).
// Kept optional for backward compat with old DB rows (pre-single-pass).
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
  /** Evidence behind `detected` (titles/years/scope claimed). Absent on old rows. */
  detected_signals?: string[];
  /** Evidence behind `expected` (what the writing actually reads as). Absent on old rows. */
  expected_signals?: string[];
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
  /**
   * P1: paste-ready truthful insertion. `before` is the existing CV line to
   * amend (verbatim) or null for a net-new line; `after` weaves the keyword in.
   * Absent on rows stored before P1.
   */
  insertion?: {
    before: string | null;
    after: string;
  };
};

export type AtsSimulation = {
  would_pass: boolean;
  score: number;
  threshold: number;
  reason: string;
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
      /** P1: exact = present with evidence; partial = adjacent/implied; missing = none. Absent on pre-P1 rows. */
      match_strength?: 'exact' | 'partial' | 'missing';
      evidence: string | null;
    }>;
    experience_gap: string | null;
  };
  /**
   * P1: cover / motivation letter audit (vs-JD flow only). Present only when
   * a letter was provided; score is null when there is no letter. Absent on
   * CV-review analyses and on rows stored before P1.
   */
  cover_letter?: {
    score: number | null;
    strengths: string[];
    issues: Issue[];
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
  /** Expected level (0-100) at the CLAIMED seniority. Absent on old rows. */
  expected?: number;
};

export type SkillRadar = {
  axes: SkillRadarAxis[];
};

// =============================================================================
// Per-experience deep-dive (CV-audit redesign). Present only on CV-review
// analyses produced after the experience_analysis rollout; absent on old rows.
// =============================================================================

export type SkillStatus = 'proven' | 'claimed'

export interface ExperienceSkill { name: string; status: SkillStatus; evidence: string | null }

/**
 * 5-level severity is LOCAL to per-experience findings ('info' is a positive
 * lever, never a problem). Global issues and scoring keep the 3-level scale.
 */
export type ExperienceFindingSeverity = 'critical' | 'major' | 'medium' | 'minor' | 'info'

export interface ExperienceFinding { severity: ExperienceFindingSeverity; what: string; why: string }

export interface ExperienceAnalysis {
  company: string; title: string;
  start: string | null; end: string | null; // 'yyyy-mm' | 'present' | null
  sources: Array<'cv' | 'linkedin' | 'github' | 'portfolio'>;
  seniority_read: 'junior' | 'mid' | 'senior' | 'lead' | 'staff' | 'principal';
  seniority_alignment: 'above_title' | 'matches_title' | 'below_title';
  ratings: { scope: number; ownership: number; impact: number }; // int 1-5
  hard_skills: ExperienceSkill[]; soft_skills: ExperienceSkill[];
  findings: ExperienceFinding[];
  margin_note: string;
}

export type ProjectedProfile = {
  seniority: string;
  target_roles: string[];
  domains: string[];
  narrative: string;
  profile_type: 'specialist' | 'generalist' | 'transitioning';
};

/** One reviewed CV bullet (item of `bullet_reviews.bullets`). */
export type BulletReviewItem = {
  original: string;
  section: string;
  verdict: "strong" | "weak" | "fatal";
  flags: string[];
  why: string;
  rewrite: string | null;
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

/** A concise, evidence-led brief for a six-slide social carousel. */
export type CarouselInsights = {
  hook: string;
  aha_moment: {
    headline: string;
    evidence: string;
    recruiter_consequence: string;
  };
  scorecard: Array<{
    label: string;
    score: number;
    evidence: string;
  }>;
  priority_fixes: Array<{
    priority: number;
    change: string;
    why_it_matters: string;
  }>;
  slides: Array<{
    number: number;
    purpose: 'hook' | 'scorecard' | 'aha' | 'evidence' | 'fixes' | 'cta';
    headline: string;
    body: string;
  }>;
};

export type AnalysisResult = {
  score: number;
  /** Absent on CV-review analyses (no job description to match against). */
  verdict?: 'Low' | 'Medium' | 'High';
  /** Absent on CV-review analyses. */
  confidence?: { score: number; reason: string };
  /** Present on new reports, absent on analyses created before carousel briefs. */
  carousel_insights?: CarouselInsights;
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
  /**
   * Per-role deep-dive (most recent first). Present only on CV-review
   * analyses produced after the experience_analysis rollout; absent on old
   * rows and on lean payloads.
   */
  experience_analysis?: ExperienceAnalysis[];
  technical_analysis?: {
    skills: TechnicalSkill[];
    skill_priority: string[];
    recommendation: string;
    reasoning: string;
    market_context: string;
    seniority_signals: string[];
  };
  project_recommendation?: ProjectRecommendation;
  challenge_analysis?: ChallengeAnalysis | null;
  negotiation_analysis?: NegotiationAnalysis | null;
  /**
   * Cross-profile inconsistencies detected inline by the main analysis call
   * (cross-examination — the moat). Drives the "Consistency check" banner /
   * section. Empty or undefined when there's nothing to cross-check (e.g. a
   * single source).
   */
  cross_profile_inconsistencies?: CrossProfileInconsistency[];
  /**
   * Per-source job chronology emitted inline by the main analysis call. Powers
   * the timeline visualization in the Consistency tab — one entry per
   * source-occurrence of each job, so the same role on CV and LinkedIn becomes
   * two entries with their own dates (which the UI renders as parallel bars).
   */
  timeline_entries?: TimelineEntry[];
  highlight_terms?: {
    // New per-source format (new analyses)
    cv?: {
      flags: Array<{ term: string; tooltip: string }>;
      issues: Array<{ term: string; tooltip: string }>;
      skills: string[];
      weak: Array<{ term: string; tooltip: string }>;
      metrics: Array<{ term: string; tooltip: string }>;
    };
    linkedin?: {
      flags: Array<{ term: string; tooltip: string }>;
      issues: Array<{ term: string; tooltip: string }>;
      skills: string[];
      weak: Array<{ term: string; tooltip: string }>;
      metrics: Array<{ term: string; tooltip: string }>;
    };
    cover_letter?: {
      flags: Array<{ term: string; tooltip: string }>;
      issues: Array<{ term: string; tooltip: string }>;
      weak: Array<{ term: string; tooltip: string }>;
    };
    // Flat format — backward compat with old DB rows
    flags?: Array<{ term: string; tooltip: string }>;
    issues?: Array<{ term: string; tooltip: string }>;
    skills?: string[];
    weak?: Array<{ term: string; tooltip: string }>;
  };
  /**
   * Bullet-by-bullet CV review. `rewrite` is null on free payloads (redacted
   * server-side) and on bullets the model judged already strong.
   */
  bullet_reviews?: {
    bullets: BulletReviewItem[];
  };
  /**
   * Present only on redacted (free) payloads: counts of premium content
   * hidden server-side, so the UI can size its upsell CTAs without the
   * content itself.
   */
  premium_locked?: {
    fixes: number;
    bullet_rewrites: number;
    ats_keywords: number;
    project: boolean;
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
