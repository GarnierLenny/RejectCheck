import { z } from 'zod';

/**
 * ProfileDigest — single compact synthesis of a user's CV + LinkedIn + GitHub +
 * portfolio, generated once by a Haiku vision call and refreshed when any
 * source changes (detected via `digestSourceHashes` on the Profile row).
 *
 * Mixes verbatim sections (raw facts: work history, tech stack, projects)
 * with synthesized sections (qualitative signals: positioning, tone, signals)
 * and a differentiating output (`cross_profile_inconsistencies`) — the
 * mismatches between sources that recruiters spot in 30s.
 *
 * Consumed by every analyze call for registered users: the digest replaces
 * raw CV/LinkedIn/GitHub in the prompt input, saving ~5-7k tokens per
 * analysis and unlocking the cross-profile consistency feature.
 *
 * Anonymous users have no digest — they continue to ship raw sources.
 */

// =============================================================================
// Verbatim sections — raw facts, not editorialized.
// =============================================================================

const SOURCE_LABEL = z.enum(['cv', 'linkedin', 'github', 'portfolio']);

export const WorkHistoryEntrySchema = z.object({
  company: z.string(),
  title: z.string(),
  /** ISO yyyy-mm or 'present'. May be approximate. */
  start: z.string(),
  end: z.string(),
  location: z.string().nullable(),
  /** Which source(s) confirmed this entry. */
  sources: z.array(SOURCE_LABEL).min(1),
});

export const ProjectEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  /** Role the user claims to have played. "Lead", "Solo dev", "Contributor", etc. */
  role_claimed: z.string(),
  dates: z.string().nullable(),
  tech: z.array(z.string()),
  /** Outcomes / metrics, if the source mentions them. */
  outcomes: z.array(z.string()),
  link: z.string().nullable(),
  sources: z.array(SOURCE_LABEL).min(1),
});

// =============================================================================
// Synthesized sections — qualitative signals.
// =============================================================================

export const PositioningSchema = z.object({
  /** One-sentence summary of how the user positions themselves. */
  headline: z.string(),
  /** Tone categories the prose leans on. */
  tone: z.array(
    z.enum([
      'confident',
      'reserved',
      'technical',
      'outcome-driven',
      'narrative',
      'minimal',
      'jargon-heavy',
    ]),
  ),
  /** Niveau de polish global perçu (orthographe, structure, design des supports). */
  polish_level: z.enum(['low', 'medium', 'high']),
});

// =============================================================================
// Cross-profile mismatches — the differentiating output.
// =============================================================================

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
});

// =============================================================================
// Full digest schema.
// =============================================================================

export const ProfileDigestSchema = z.object({
  /** Schema version — bump when shape changes so we can migrate stored digests. */
  version: z.literal(1),

  // Verbatim
  work_history: z.array(WorkHistoryEntrySchema),
  tech_stack: z.array(z.string()),
  languages: z.array(z.string()),
  projects: z.array(ProjectEntrySchema),

  // Synthesized
  positioning: PositioningSchema,
  /** Short observed signals — "ships polished work", "writes detailed case studies", "consistent 5+ year stints". */
  signals: z.array(z.string()),

  // Mismatches
  cross_profile_inconsistencies: z.array(CrossProfileInconsistencySchema),

  // Provenance — which sources were available when the digest was generated.
  sources_available: z.object({
    cv: z.boolean(),
    linkedin: z.boolean(),
    github: z.boolean(),
    portfolio: z.boolean(),
  }),
});

export type ProfileDigest = z.infer<typeof ProfileDigestSchema>;
export type WorkHistoryEntry = z.infer<typeof WorkHistoryEntrySchema>;
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;
export type Positioning = z.infer<typeof PositioningSchema>;
export type CrossProfileInconsistency = z.infer<
  typeof CrossProfileInconsistencySchema
>;
export type SourceLabel = z.infer<typeof SOURCE_LABEL>;

// =============================================================================
// Source hashing — used to detect staleness without re-fetching.
// =============================================================================

export type DigestSourceHashes = {
  /** SHA-256 of the CV PDF buffer (or null if no CV uploaded yet). */
  cv: string | null;
  /** SHA-256 of the LinkedIn text content (or null). */
  linkedin: string | null;
  /** GitHub username string (no hash needed, lowercased). null if not set. */
  githubUsername: string | null;
  /** Portfolio URL string (lowercased, trimmed). null if not set. */
  portfolioUrl: string | null;
};

export const DigestSourceHashesSchema = z.object({
  cv: z.string().nullable(),
  linkedin: z.string().nullable(),
  githubUsername: z.string().nullable(),
  portfolioUrl: z.string().nullable(),
});
