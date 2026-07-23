import { z } from 'zod';

/**
 * Cross-examination DTOs — the differentiating output that compares a
 * candidate's sources (CV / LinkedIn / GitHub / portfolio) against each other:
 * the per-source timeline and the divergences a recruiter spots in 30s.
 *
 * Relocated out of the retired profile-digest module: these are now generated
 * directly by the main analysis and CV-review calls, so they live in a neutral
 * home shared by both response DTOs.
 */

export const SOURCE_LABEL = z.enum(['cv', 'linkedin', 'github', 'portfolio']);
export type SourceLabel = z.infer<typeof SOURCE_LABEL>;

export const CrossProfileInconsistencySchema = z.object({
  severity: z.enum(['critical', 'major', 'minor']),
  /** The two (or more) sources where the divergence shows up. */
  sources: z.array(SOURCE_LABEL).min(2),
  /** What field is divergent. */
  field: z.enum([
    'job_title',
    'company',
    'dates',
    'tech_stack',
    'ownership',
    'seniority',
    'project_attribution',
    'location',
    'other',
  ]),
  /** Plain-language description of the divergence, e.g. "CV says 'Senior Designer 2022-2024' but LinkedIn says 'Lead 2023-2024'". */
  description: z.string(),
  /** How a recruiter is likely to interpret this — used by the analyze flow to surface it. */
  recruiter_perception: z.string(),
  /**
   * Representative date for the divergence (yyyy-mm), used to position a
   * marker on the chronology timeline in the Consistency tab. Null when the
   * divergence isn't temporally locatable (e.g. tech_stack mismatch).
   */
  anchor_date: z.string().nullable(),
});
export type CrossProfileInconsistency = z.infer<
  typeof CrossProfileInconsistencySchema
>;

/**
 * Per-source timeline entries — the Consistency tab renders one lane per
 * source. Unlike a deduplicated work history, this preserves each source's
 * verbatim view of each job, so if CV says "09/2022 → 03/2023" and LinkedIn
 * says "10/2022 → 02/2023", that's TWO entries; the frontend stacks them on
 * parallel rows to make the divergence visible.
 */
export const TimelineEntrySchema = z.object({
  title: z.string(),
  company: z.string(),
  source: SOURCE_LABEL,
  /** ISO yyyy-mm. */
  start: z.string(),
  /** ISO yyyy-mm or 'present'. */
  end: z.string(),
});
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
