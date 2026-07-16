/**
 * Plan-based redaction of analysis payloads.
 *
 * The full result is always generated and stored; every surface that sends an
 * analysis to a client (SSE sections, analysis_done, GET /analyze/:id, share
 * view, history, cv-review) shapes it here according to the requester's plan.
 * This is the real gate — the frontend only decides how to render locked
 * sections, never what to hide.
 *
 * One redaction tier inside the analysis payload: free (guests + signed-in
 * without subscription/unlock) vs paid. Hired-only exclusives are separate
 * guarded endpoints; the only hired-gated field carried by the payload is
 * `negotiation_analysis` (merged in at read time).
 */
import type { AnalyzeResponse } from '../dto/analyze-response.dto';
import type { CvReviewResponse } from '../dto/cv-review-response.dto';

export type ShapeContext = {
  /**
   * Requester sees paid content: active shortlisted/hired subscription, or
   * one-time unlock (premiumUnlockedAt) on this specific analysis.
   */
  premium: boolean;
  /** Requester is on the hired tier — keeps negotiation_analysis. */
  hired: boolean;
};

/** Keywords shown to free users; the rest is counted in premium_locked. */
const FREE_ATS_KEYWORDS = 3;

/** Fields of project_recommendation kept as the free teaser. */
const PROJECT_TEASER_FIELDS = [
  'name',
  'description',
  'difficulty_level',
  'technologies',
  'why_it_matters',
] as const;

type AnyRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is AnyRecord =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function stripFix<T>(entry: T): T {
  if (!isRecord(entry)) return entry;
  const { fix: _fix, ...rest } = entry;
  return rest as T;
}

function stripIssueFixes<T>(audit: T): T {
  if (!isRecord(audit) || !Array.isArray(audit.issues)) return audit;
  return { ...audit, issues: audit.issues.map(stripFix) } as T;
}

function countIssueFixes(audit: unknown): number {
  if (!isRecord(audit) || !Array.isArray(audit.issues)) return 0;
  return audit.issues.filter((i) => isRecord(i) && i.fix != null).length;
}

function redactBulletReviews<T>(bulletReviews: T): T {
  if (!isRecord(bulletReviews) || !Array.isArray(bulletReviews.bullets)) {
    return bulletReviews;
  }
  return {
    ...bulletReviews,
    bullets: bulletReviews.bullets.map((b) =>
      isRecord(b) ? { ...b, rewrite: null } : b,
    ),
  } as T;
}

function countBulletRewrites(bulletReviews: unknown): number {
  if (!isRecord(bulletReviews) || !Array.isArray(bulletReviews.bullets)) {
    return 0;
  }
  return bulletReviews.bullets.filter((b) => isRecord(b) && b.rewrite != null)
    .length;
}

function projectTeaser<T>(project: T): T {
  if (!isRecord(project)) return project;
  const teaser: AnyRecord = {};
  for (const field of PROJECT_TEASER_FIELDS) {
    if (field in project) teaser[field] = project[field];
  }
  return teaser as T;
}

/**
 * Shape a full merged analysis for the requester's plan.
 * Never mutates the input.
 */
export function shapeAnalysisForPlan(
  result: AnalyzeResponse,
  ctx: ShapeContext,
): AnalyzeResponse {
  // Paid payload is complete; negotiation stays hired-only even there.
  if (ctx.premium) {
    if (ctx.hired) return result;
    const { negotiation_analysis: _n, ...rest } = result;
    return rest as AnalyzeResponse;
  }

  // Defensive on old / partial rows: audit, ats_simulation or red flags may
  // be absent — never let shaping throw on a stored analysis.
  const redFlags = result.hidden_red_flags ?? [];
  const shaped: AnalyzeResponse = {
    ...result,
    seniority_analysis: stripFix(result.seniority_analysis),
    cv_tone: stripFix(result.cv_tone),
    hidden_red_flags: redFlags.map(stripFix),
  };
  delete (shaped as AnyRecord).negotiation_analysis;

  if (result.audit) {
    shaped.audit = {
      ...result.audit,
      cv: stripIssueFixes(result.audit.cv),
      github: stripIssueFixes(result.audit.github),
      linkedin: stripIssueFixes(result.audit.linkedin),
      cover_letter: stripIssueFixes(result.audit.cover_letter),
    };
  }

  const allKeywords = result.ats_simulation?.critical_missing_keywords ?? [];
  if (result.ats_simulation) {
    shaped.ats_simulation = {
      ...result.ats_simulation,
      critical_missing_keywords: allKeywords.slice(0, FREE_ATS_KEYWORDS),
    };
  }

  if (result.bullet_reviews) {
    shaped.bullet_reviews = redactBulletReviews(result.bullet_reviews);
  }
  if (result.project_recommendation) {
    shaped.project_recommendation = projectTeaser(
      result.project_recommendation,
    );
  }

  shaped.premium_locked = {
    fixes:
      countIssueFixes(result.audit?.cv) +
      countIssueFixes(result.audit?.github) +
      countIssueFixes(result.audit?.linkedin) +
      countIssueFixes(result.audit?.cover_letter) +
      redFlags.filter((f) => (f as AnyRecord).fix != null).length +
      ((result.seniority_analysis as AnyRecord | undefined)?.fix != null
        ? 1
        : 0) +
      ((result.cv_tone as AnyRecord | undefined)?.fix != null ? 1 : 0),
    bullet_rewrites: countBulletRewrites(result.bullet_reviews),
    ats_keywords: Math.max(0, allKeywords.length - FREE_ATS_KEYWORDS),
    project: result.project_recommendation != null,
  };

  return shaped;
}

/**
 * Dispatch for stored rows: the Analysis table holds both vs-JD analyses and
 * standalone CV reviews (distinguished by `cv_quality`). Read surfaces call
 * this so either shape is redacted correctly.
 */
export function shapeStoredResultForPlan<T>(result: T, ctx: ShapeContext): T {
  if (!isRecord(result)) return result;
  return 'cv_quality' in result
    ? (shapeCvReviewForPlan(result as unknown as CvReviewResponse, ctx) as T)
    : (shapeAnalysisForPlan(result as unknown as AnalyzeResponse, ctx) as T);
}

/**
 * Shape one streamed section (tool-schema key) before SSE emission.
 * Same rules as shapeAnalysisForPlan so stream and final payload agree.
 */
export function shapeSectionForPlan(
  key: string,
  value: unknown,
  ctx: ShapeContext,
): unknown {
  if (ctx.premium) return value;

  switch (key) {
    case 'seniority_analysis':
    case 'cv_tone':
      return stripFix(value);
    case 'audit_cv':
    case 'audit_github':
    case 'audit_linkedin':
    case 'audit_cover_letter':
      return stripIssueFixes(value);
    case 'hidden_red_flags':
      return Array.isArray(value) ? value.map(stripFix) : value;
    case 'bullet_reviews':
      return redactBulletReviews(value);
    case 'ats_critical_missing_keywords':
      return Array.isArray(value) ? value.slice(0, FREE_ATS_KEYWORDS) : value;
    case 'project_recommendation':
      return projectTeaser(value);
    default:
      return value;
  }
}

/**
 * Shape a standalone CV review for the requester's plan. The review payload
 * carries less inline premium content than the vs-JD analysis — only the
 * bullet rewrites are redacted.
 */
export function shapeCvReviewForPlan(
  review: CvReviewResponse,
  ctx: ShapeContext,
): CvReviewResponse {
  if (ctx.premium || !review.bullet_reviews) return review;
  return {
    ...review,
    bullet_reviews: redactBulletReviews(review.bullet_reviews),
  };
}
