/**
 * Cross-examination tool-schema fragments — the item shapes for
 * timeline_entries and cross_profile_inconsistencies. Shared by the main
 * analysis tool and the CV-review tool, both of which now generate these
 * fields directly (the retired Haiku profile-digest used to produce them).
 */

const SOURCE_ENUM = ['cv', 'linkedin', 'github', 'portfolio'] as const;

export const CROSS_PROFILE_INCONSISTENCY = {
  type: 'object' as const,
  properties: {
    severity: {
      type: 'string' as const,
      enum: ['critical', 'major', 'minor'],
      description:
        'critical = recruiter will reject on sight. major = recruiter will flag and ask. minor = small drift, mostly cosmetic.',
    },
    sources: {
      type: 'array' as const,
      items: { type: 'string' as const, enum: SOURCE_ENUM },
      minItems: 2,
      description: 'The 2+ sources where the divergence shows up.',
    },
    field: {
      type: 'string' as const,
      enum: [
        'job_title',
        'company',
        'dates',
        'tech_stack',
        'ownership',
        'seniority',
        'project_attribution',
        'location',
        'other',
      ],
    },
    description: {
      type: 'string' as const,
      description:
        'Plain-language description of the divergence, citing the actual values. ≤ 35 words.',
    },
    recruiter_perception: {
      type: 'string' as const,
      description: 'How a senior recruiter is likely to read this. ≤ 25 words.',
    },
    anchor_date: {
      type: ['string', 'null'] as ['string', 'null'],
      description:
        "Representative yyyy-mm date for the divergence (used to position a marker on the chronology timeline). For a title mismatch: midpoint of the job. For a date discrepancy: the divergent month. For an ownership conflict: the project's start. NULL when the divergence isn't temporally locatable (e.g. tech_stack mismatch). Only use dates explicitly present in the sources — never invent.",
    },
  },
  required: [
    'severity',
    'sources',
    'field',
    'description',
    'recruiter_perception',
    'anchor_date',
  ],
};

export const TIMELINE_ENTRY = {
  type: 'object' as const,
  properties: {
    title: {
      type: 'string' as const,
      description: 'Job title verbatim from this source.',
    },
    company: { type: 'string' as const, description: 'Company name verbatim.' },
    source: { type: 'string' as const, enum: SOURCE_ENUM },
    start: {
      type: 'string' as const,
      description: 'ISO yyyy-mm. Use month 01 if only year is given.',
    },
    end: {
      type: 'string' as const,
      description:
        "ISO yyyy-mm or 'present'. Use month 12 if only year is given.",
    },
  },
  required: ['title', 'company', 'source', 'start', 'end'],
};
