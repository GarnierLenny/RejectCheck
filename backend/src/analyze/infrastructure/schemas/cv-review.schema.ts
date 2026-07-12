/**
 * JSON schema for the standalone CV-review analysis (no job description).
 *
 * Unlike the hot/deep split used for application analysis, CV review uses a
 * single combined pass — the output is smaller (~3-4k tokens) and the latency
 * of a split isn't worth the complexity.
 */

import {
  CROSS_PROFILE_INCONSISTENCY,
  TIMELINE_ENTRY,
} from './claude-profile-digest.schema';
import { BULLET_REVIEWS_PROPERTY } from './claude-analysis.schema';

const ISSUE_SCHEMA = {
  type: 'object' as const,
  properties: {
    severity: {
      type: 'string' as const,
      enum: ['critical', 'major', 'minor'],
    },
    category: {
      type: 'string' as const,
      enum: [
        'keywords',
        'impact',
        'seniority',
        'stack',
        'format',
        'tone',
        'consistency',
      ],
    },
    what: { type: 'string' as const },
    why: { type: 'string' as const },
  },
  required: ['severity', 'category', 'what', 'why'],
};

const auditSchema = (description: string, maxIssues: number) => ({
  type: 'object' as const,
  description,
  properties: {
    score: {
      type: ['number', 'null'] as ['number', 'null'],
      minimum: 0,
      maximum: 100,
    },
    issues: {
      type: 'array' as const,
      items: ISSUE_SCHEMA,
      maxItems: maxIssues,
      description: `Up to ${maxIssues} issues ordered by severity (critical → minor). Be exhaustive within the cap — list every recruiter-relevant finding. Do not pad or repeat.`,
    },
  },
  required: ['score', 'issues'],
});

export const SUBMIT_CV_REVIEW_TOOL = {
  name: 'submit_cv_review',
  description:
    'Submit a standalone CV audit — quality assessment and career positioning without any job description context.',
  input_schema: {
    type: 'object' as const,
    properties: {
      cv_quality: {
        type: 'object' as const,
        description: 'CV quality scores across 6 dimensions (0-100 each). overall = weighted average of the 6 sub-scores.',
        properties: {
          overall: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description: 'Weighted average of the 6 sub-scores.',
          },
          clarity: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description:
              'Readability, narrative flow, section ordering, prose quality.',
          },
          impact: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description:
              'Strength of bullet points: quantification, action verbs, ownership language, scope. Passive verbs and vague descriptions drag this down.',
          },
          hard_skills: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description:
              'Technical skills density and relevance: tools, languages, frameworks, certifications. Are the skills current and clearly evidenced in experience?',
          },
          soft_skills: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description:
              'Signals of leadership, collaboration, communication, and ownership detected in phrasing — not from a listed "Skills" section but from how accomplishments are described.',
          },
          consistency: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description:
              'Internal CV consistency: timeline without gaps or overlaps, titles matching described responsibilities, claimed skills reflected in actual experience, no contradictions across sections.',
          },
          ats_format: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description:
              'Machine-readability: no tables/columns, parseable headers, standard section names, clean date formats.',
          },
        },
        required: ['overall', 'clarity', 'impact', 'hard_skills', 'soft_skills', 'consistency', 'ats_format'],
      },

      cv_quality_notes: {
        type: 'object' as const,
        description:
          'One-sentence explanation for each cv_quality sub-score strictly below 70. Omit a key entirely when the corresponding score is ≥ 70. ≤ 20 words per note — name the PRIMARY drag factor, be specific (e.g. "Most bullets use passive voice and lack measurable outcomes" not "Impact could be improved").',
        properties: {
          clarity: { type: 'string' as const },
          impact: { type: 'string' as const },
          hard_skills: { type: 'string' as const },
          soft_skills: { type: 'string' as const },
          consistency: { type: 'string' as const },
          ats_format: { type: 'string' as const },
        },
      },

      projected_profile: {
        type: 'object' as const,
        description:
          'Profile positioning as a recruiter would read this CV cold, before seeing any job offer.',
        properties: {
          seniority: {
            type: 'string' as const,
            description:
              'Seniority the CV projects: "junior", "mid", "senior", "lead", "staff", "principal". Strictly from observable CV evidence (scope of impact, team size, autonomy described) — not from claimed titles.',
          },
          target_roles: {
            type: 'array' as const,
            items: { type: 'string' as const },
            minItems: 1,
            maxItems: 5,
            description:
              'Job titles this CV is naturally positioned for. Most likely match first. ≤ 5 items.',
          },
          domains: {
            type: 'array' as const,
            items: { type: 'string' as const },
            minItems: 1,
            maxItems: 3,
            description:
              'Industry or functional domains where this profile fits. Examples: "B2B SaaS", "fintech", "developer tools", "e-commerce". ≤ 3 items.',
          },
          narrative: {
            type: 'string' as const,
            description:
              'One sentence summarising the career story this CV tells from a recruiter\'s perspective. ≤ 40 words.',
          },
          profile_type: {
            type: 'string' as const,
            enum: ['specialist', 'generalist', 'transitioning'],
            description:
              '"specialist" = deep expertise in one domain; "generalist" = breadth across multiple; "transitioning" = clear career change trajectory.',
          },
        },
        required: [
          'seniority',
          'target_roles',
          'domains',
          'narrative',
          'profile_type',
        ],
      },

      skill_radar: {
        type: 'object' as const,
        description:
          'Skill profile radar — 5 dimensions that best characterise this specific profile. Pick dimensions relevant to the actual role (e.g. Backend/Frontend/DevOps/Architecture/Leadership for a dev; Strategy/Analytics/Content/Brand/Ops for a marketer). Score each 0-100 strictly from observable CV/GitHub/LinkedIn evidence — no embellishment. Spread scores realistically: a senior specialist should score 80+ in their domain and 20-40 in adjacent areas they rarely touched.',
        properties: {
          axes: {
            type: 'array' as const,
            minItems: 4,
            maxItems: 6,
            items: {
              type: 'object' as const,
              properties: {
                label: {
                  type: 'string' as const,
                  description: 'Skill dimension. ≤ 14 chars. Capitalised.',
                },
                score: {
                  type: 'number' as const,
                  minimum: 0,
                  maximum: 100,
                },
                evidence: {
                  type: 'string' as const,
                  description:
                    'One concrete CV/GitHub fact supporting this score. ≤ 20 words. E.g. "4 years Node.js across 3 companies, 2 public APIs" or "React mentioned once, 2022 side project only".',
                },
              },
              required: ['label', 'score', 'evidence'],
            },
          },
        },
        required: ['axes'],
      },

      positioning_gaps: {
        type: 'object' as const,
        description:
          'What this CV is missing to convincingly project the most ambitious role in target_roles. Anchor every gap in specific CV evidence — reference actual sections, phrases, or absences. Bad: "Add more metrics." Good: "Your last 3 roles list no impact numbers — add at least one quantified result per role."',
        properties: {
          target_role: {
            type: 'string' as const,
            description:
              'The most aspirational role this CV could realistically reach with targeted improvements. Usually the last item of target_roles, one level above the current projected seniority.',
          },
          gaps: {
            type: 'array' as const,
            minItems: 1,
            maxItems: 5,
            description: 'Specific gaps ordered by impact. Each must name a concrete CV evidence.',
            items: {
              type: 'object' as const,
              properties: {
                what: {
                  type: 'string' as const,
                  description: 'The missing signal, anchored in CV evidence. ≤ 20 words.',
                },
                fix: {
                  type: 'string' as const,
                  description: 'Concrete rewrite or addition. ≤ 25 words.',
                },
              },
              required: ['what', 'fix'],
            },
          },
        },
        required: ['target_role', 'gaps'],
      },

      ats_audit: {
        type: 'object' as const,
        description:
          'ATS structural format audit — not keyword matching, but machine-readability.',
        properties: {
          score: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description: 'Overall ATS format score.',
          },
          issues: {
            type: 'array' as const,
            maxItems: 5,
            description:
              'Structural ATS problems. Examples: multi-column layout, non-standard section headers (e.g. "My Journey" instead of "Experience"), tables, missing Contact/Education/Experience sections, unreadable date formats.',
            items: {
              type: 'object' as const,
              properties: {
                what: {
                  type: 'string' as const,
                  description: 'The structural problem. ≤ 20 words.',
                },
                why: {
                  type: 'string' as const,
                  description: 'Why this hurts ATS parsing. ≤ 20 words.',
                },
                fix: {
                  type: 'string' as const,
                  description: 'Concrete fix. ≤ 20 words.',
                },
              },
              required: ['what', 'why'],
            },
          },
        },
        required: ['score', 'issues'],
      },

      seniority_analysis: {
        type: 'object' as const,
        properties: {
          expected: {
            type: 'string' as const,
            description: 'Seniority level the CV projects to a recruiter.',
          },
          detected: {
            type: 'string' as const,
            description:
              'Seniority level the CV claims (from titles, years of experience stated).',
          },
          gap: {
            type: 'string' as const,
            description:
              'Description of the gap between projected and claimed, or "none" if aligned.',
          },
          strength: {
            type: 'string' as const,
            description:
              'The single strongest seniority signal in the CV. ≤ 20 words.',
          },
        },
        required: ['expected', 'detected', 'gap', 'strength'],
      },

      cv_tone: {
        type: 'object' as const,
        properties: {
          detected: {
            type: 'string' as const,
            enum: ['passive', 'active', 'mixed'],
          },
          examples: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 6,
            description:
              'Up to 6 verbatim passive phrases from the CV. Empty array when tone is active.',
          },
          rewrites: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 6,
            description:
              'Rewritten version of each phrase in examples — same index, same length. Use a strong action verb + add a concrete quantification placeholder like "[X%]" or "[N users]" where relevant. Empty array when tone is active.',
          },
        },
        required: ['detected', 'examples', 'rewrites'],
      },

      bullet_reviews: BULLET_REVIEWS_PROPERTY,

      audit_cv: auditSchema(
        'CV audit: structure, clarity, impact, completeness. Score always present (not null).',
        10,
      ),
      audit_github: auditSchema(
        'GitHub profile audit: public repos, tech stack coherence with CV, contribution signals. Set score=null and issues=[] if no GitHub was provided.',
        6,
      ),
      audit_linkedin: auditSchema(
        'LinkedIn audit: consistency with CV, completeness of profile. Set score=null and issues=[] if no LinkedIn was provided.',
        6,
      ),

      timeline_entries: {
        type: 'array' as const,
        items: TIMELINE_ENTRY,
        maxItems: 40,
        description:
          'Per-source chronology — ONE entry per source-occurrence of a job. Only populate when at least 2 sources are available (CV + LinkedIn and/or GitHub). Empty array if only CV is present. Use dates verbatim from each source — do NOT reconcile.',
      },

      cross_profile_inconsistencies: {
        type: 'array' as const,
        items: CROSS_PROFILE_INCONSISTENCY,
        maxItems: 8,
        description:
          'Concrete divergences between CV, LinkedIn, and GitHub. Only populate when at least 2 sources are available. Empty array if only CV is present, or if sources are fully consistent. Cite exact divergent values — skip vague entries.',
      },

      hidden_red_flags: {
        type: 'array' as const,
        maxItems: 5,
        description:
          'Generic CV red flags a recruiter notices before reading any JD, up to 5, ordered by damage. Examples: unexplained employment gaps > 6 months, excessive job-hopping (< 1 yr average tenure), CV > 2 pages for < 10yr career, no quantifiable achievements anywhere, credential inflation. OMIT entirely if there are no meaningful red flags — never pad.',
        items: {
          type: 'object' as const,
          properties: {
            flag: {
              type: 'string' as const,
              description: 'Short description of the red flag. ≤ 15 words.',
            },
            perception: {
              type: 'string' as const,
              description:
                'How a recruiter perceives this. ≤ 25 words.',
            },
          },
          required: ['flag', 'perception'],
        },
      },
    },
    required: [
      'cv_quality',
      'cv_quality_notes',
      'skill_radar',
      'projected_profile',
      'positioning_gaps',
      'ats_audit',
      'seniority_analysis',
      'cv_tone',
      'bullet_reviews',
      'audit_cv',
      'audit_github',
      'audit_linkedin',
      'timeline_entries',
      'cross_profile_inconsistencies',
      'hidden_red_flags',
    ],
  },
};

/**
 * CV-review tool for the owner "audit mode": drops `bullet_reviews` (the
 * biggest actionable block, and the only premium content on a review) so a
 * teaser audit of a stranger's CV — shared read-only, never unlocked — doesn't
 * burn tokens generating rewrites nobody will see.
 */
export function buildCvReviewTool(lean = false) {
  if (!lean) return SUBMIT_CV_REVIEW_TOOL;
  const { bullet_reviews: _dropped, ...properties } =
    SUBMIT_CV_REVIEW_TOOL.input_schema.properties;
  return {
    ...SUBMIT_CV_REVIEW_TOOL,
    input_schema: {
      ...SUBMIT_CV_REVIEW_TOOL.input_schema,
      properties,
      required: SUBMIT_CV_REVIEW_TOOL.input_schema.required.filter(
        (k) => k !== 'bullet_reviews',
      ),
    },
  };
}
