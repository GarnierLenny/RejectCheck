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
} from './cross-examination.schema';
import {
  BULLET_REVIEWS_PROPERTY,
  CAROUSEL_INSIGHTS_PROPERTY,
} from './claude-analysis.schema';

// Mirrors the private SOURCE_ENUM of cross-examination.schema.ts (not exported
// there). Keep in sync if a new source type is ever added.
const SOURCE_ENUM = ['cv', 'linkedin', 'github', 'portfolio'] as const;

/**
 * Per-role deep-dive: one entry per role on the CV, judged ONLY on that role's
 * own bullets. Powers the Experience deep-dive section and (aggregated in the
 * frontend) the "Reads strong" card of the Recruiter radar. The 5-level
 * severity enum is LOCAL to these findings: global issue lists and the scoring
 * penalty keep their 3 levels and never read it.
 */
const EXPERIENCE_ANALYSIS_PROPERTY = {
  type: 'array' as const,
  maxItems: 8,
  description:
    'Per-role recruiter deep-dive. ONE entry per role on the CV, most recent first, up to 8. Judge each entry ONLY on the bullets of that role: never import evidence or doubts from another role. Caps are ceilings, never quotas.',
  items: {
    type: 'object' as const,
    properties: {
      company: {
        type: 'string' as const,
        description: 'Company name, verbatim from the CV.',
      },
      title: {
        type: 'string' as const,
        description: 'Job title, verbatim from the CV.',
      },
      start: {
        type: ['string', 'null'] as ['string', 'null'],
        description:
          'ISO yyyy-mm as written in the CV (month 01 if only a year is given), or null when the CV states no start date. Never guess.',
      },
      end: {
        type: ['string', 'null'] as ['string', 'null'],
        description:
          "ISO yyyy-mm, or 'present' for a current role (month 12 if only a year is given), or null when the CV states no end date. Never guess.",
      },
      sources: {
        type: 'array' as const,
        items: { type: 'string' as const, enum: SOURCE_ENUM },
        minItems: 1,
        description:
          'Which provided source(s) mention this role. If only the CV does, list only "cv".',
      },
      seniority_read: {
        type: 'string' as const,
        enum: ['junior', 'mid', 'senior', 'lead', 'staff', 'principal'],
        description:
          "The seniority this role's bullets actually project: judge from scope, autonomy and decision depth described, never from the title.",
      },
      seniority_alignment: {
        type: 'string' as const,
        enum: ['above_title', 'matches_title', 'below_title'],
        description:
          'How seniority_read compares to the stated title: above_title = the work reads more senior than the title; below_title = the title claims more than the bullets show.',
      },
      ratings: {
        type: 'object' as const,
        description:
          "Recruiter ratings for this role, integers 1-5, judged only on this role's bullets (see the rubric in the system rules).",
        properties: {
          scope: {
            type: 'integer' as const,
            minimum: 1,
            maximum: 5,
            description:
              'Size of the problem handled: 1 = isolated tasks, 5 = an org-level or company-level surface.',
          },
          ownership: {
            type: 'integer' as const,
            minimum: 1,
            maximum: 5,
            description:
              'Held vs assisted: 1 = helped or supported with no owned outcome, 5 = accountable for the outcome and made the calls.',
          },
          impact: {
            type: 'integer' as const,
            minimum: 1,
            maximum: 5,
            description:
              'Proof it mattered: 1 = no outcome stated, 5 = quantified outcomes with durable effect.',
          },
        },
        required: ['scope', 'ownership', 'impact'],
      },
      hard_skills: {
        type: 'array' as const,
        maxItems: 8,
        description:
          "Hard skills exercised in THIS role, up to 8. proven needs an artifact, deliverable or number in this role's own bullets; a mention in a skills list is always claimed.",
        items: {
          type: 'object' as const,
          properties: {
            name: {
              type: 'string' as const,
              description: 'Skill name. ≤ 20 chars.',
            },
            status: {
              type: 'string' as const,
              enum: ['proven', 'claimed'],
            },
            evidence: {
              type: ['string', 'null'] as ['string', 'null'],
              description:
                'The exact bullet fact that proves it, ≤ 15 words. MUST be null when status is claimed.',
            },
          },
          required: ['name', 'status', 'evidence'],
        },
      },
      soft_skills: {
        type: 'array' as const,
        maxItems: 4,
        description:
          "Soft skills evidenced in THIS role's bullets, up to 4. Same proven vs claimed bar as hard_skills.",
        items: {
          type: 'object' as const,
          properties: {
            name: {
              type: 'string' as const,
              description: 'Skill name. ≤ 20 chars.',
            },
            status: {
              type: 'string' as const,
              enum: ['proven', 'claimed'],
            },
            evidence: {
              type: ['string', 'null'] as ['string', 'null'],
              description:
                'The exact bullet fact that proves it, ≤ 15 words. MUST be null when status is claimed.',
            },
          },
          required: ['name', 'status', 'evidence'],
        },
      },
      findings: {
        type: 'array' as const,
        maxItems: 6,
        description:
          'Role-level findings, up to 6, ordered by severity (critical first). Ceilings, never quotas: a clean role gets zero findings. info = a genuine POSITIVE leverage point only, never a problem.',
        items: {
          type: 'object' as const,
          properties: {
            severity: {
              type: 'string' as const,
              enum: ['critical', 'major', 'medium', 'minor', 'info'],
            },
            what: {
              type: 'string' as const,
              description:
                'The finding, anchored in a specific bullet or absence of this role. ≤ 25 words.',
            },
            why: {
              type: 'string' as const,
              description:
                'How a recruiter reads it, or (for info) how to leverage it. ≤ 25 words.',
            },
          },
          required: ['severity', 'what', 'why'],
        },
      },
      margin_note: {
        type: 'string' as const,
        description:
          "The one-line note a recruiter would scribble in the margin next to this role: examiner's voice, specific to this role, ≤ 45 words.",
      },
    },
    required: [
      'company',
      'title',
      'start',
      'end',
      'sources',
      'seniority_read',
      'seniority_alignment',
      'ratings',
      'hard_skills',
      'soft_skills',
      'findings',
      'margin_note',
    ],
  },
};

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
    fix: {
      type: 'string' as const,
      description:
        'One concrete, actionable correction for THIS issue. Imperative voice, ≤ 25 words. Reference the exact section or phrasing to change. Use a [placeholder] such as "[X]%" for any metric you cannot verify, never fabricate a number.',
    },
  },
  required: ['severity', 'category', 'what', 'why', 'fix'],
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
      description: `Up to ${maxIssues} issues, ordered by severity (critical first). Only genuine, recruiter-relevant findings. The cap is a ceiling, never a quota: fewer is better, return zero on a clean CV, and never pad, split, or reword a weakness to fill a slot.`,
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
      carousel_insights: CAROUSEL_INSIGHTS_PROPERTY,
      cv_quality: {
        type: 'object' as const,
        description:
          'CV quality scores across 6 dimensions (0-100 each). overall = weighted average of the 6 sub-scores.',
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
              'Internal CV consistency: titles matching described responsibilities, claimed skills reflected in actual experience, no contradictions across sections. A CV that lists only recent roles is normal length management, NOT a timeline gap: judge only contradictions among the roles actually present, never legitimately omitted older ones.',
          },
          ats_format: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description:
              'Machine-readability: no tables/columns, parseable headers, standard section names, clean date formats.',
          },
        },
        required: [
          'overall',
          'clarity',
          'impact',
          'hard_skills',
          'soft_skills',
          'consistency',
          'ats_format',
        ],
      },

      cv_quality_notes: {
        type: 'object' as const,
        description:
          'One specific sentence for EACH of the 6 cv_quality sub-scores, ≤ 20 words. For a score ≥ 70, name the single thing that makes it strong so the candidate knows what to preserve. For a score < 70, name the PRIMARY drag factor. Always concrete, e.g. "Most bullets use passive voice and lack measurable outcomes", never "Impact could be improved".',
        properties: {
          clarity: { type: 'string' as const },
          impact: { type: 'string' as const },
          hard_skills: { type: 'string' as const },
          soft_skills: { type: 'string' as const },
          consistency: { type: 'string' as const },
          ats_format: { type: 'string' as const },
        },
        required: [
          'clarity',
          'impact',
          'hard_skills',
          'soft_skills',
          'consistency',
          'ats_format',
        ],
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
              "One sentence summarising the career story this CV tells from a recruiter's perspective. ≤ 40 words.",
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
                expected: {
                  type: 'number' as const,
                  minimum: 0,
                  maximum: 100,
                  description:
                    'The level a typical candidate at the CLAIMED seniority (seniority_analysis.detected) shows on this axis. Calibrate from that seniority band alone, independently of the actual score: expected must never drift toward score, and gaps in either direction are normal and informative.',
                },
                evidence: {
                  type: 'string' as const,
                  description:
                    'One concrete CV/GitHub fact supporting this score. ≤ 20 words. E.g. "4 years Node.js across 3 companies, 2 public APIs" or "React mentioned once, 2022 side project only".',
                },
              },
              required: ['label', 'score', 'expected', 'evidence'],
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
            description:
              'Specific gaps ordered by impact. Each must name a concrete CV evidence.',
            items: {
              type: 'object' as const,
              properties: {
                what: {
                  type: 'string' as const,
                  description:
                    'The missing signal, anchored in CV evidence. ≤ 20 words.',
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
              required: ['what', 'why', 'fix'],
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
          detected_signals: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 4,
            description:
              'The concrete evidence behind `detected`: titles held, years stated, scope claimed. 2 to 4 short phrases, each anchored in real CV content.',
          },
          expected_signals: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 4,
            description:
              'What the WRITING actually conveys behind `expected`: the scope, autonomy, team size and impact a recruiter reads off the bullets. 2 to 4 short phrases, each anchored in real CV content.',
          },
          gap: {
            type: 'string' as const,
            description:
              'One sentence explaining WHY the levels align or differ, grounded in the signals. Explain the consistency even when aligned. Never the literal word "none".',
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

      experience_analysis: EXPERIENCE_ANALYSIS_PROPERTY,

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
          'Per-source chronology: ONE entry per role per source. ALWAYS populate. With CV only, one entry per CV role. Use dates verbatim from each source, do NOT reconcile. Omit undated roles.',
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
              description: 'How a recruiter perceives this. ≤ 25 words.',
            },
          },
          required: ['flag', 'perception'],
        },
      },
    },
    required: [
      'carousel_insights',
      'cv_quality',
      'cv_quality_notes',
      'skill_radar',
      'projected_profile',
      'positioning_gaps',
      'ats_audit',
      'seniority_analysis',
      'cv_tone',
      'bullet_reviews',
      'experience_analysis',
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
 * biggest actionable block, and the only premium content on a review) and
 * `experience_analysis` (the per-role deep-dive, the other token-heavy block)
 * so a teaser audit of a stranger's CV, shared read-only and never unlocked,
 * doesn't burn tokens generating depth nobody will see.
 */
export function buildCvReviewTool(lean = false) {
  if (!lean) return SUBMIT_CV_REVIEW_TOOL;
  const LEAN_DROPPED = ['bullet_reviews', 'experience_analysis'];
  const {
    bullet_reviews: _droppedBullets,
    experience_analysis: _droppedExperience,
    ...properties
  } = SUBMIT_CV_REVIEW_TOOL.input_schema.properties;
  return {
    ...SUBMIT_CV_REVIEW_TOOL,
    input_schema: {
      ...SUBMIT_CV_REVIEW_TOOL.input_schema,
      properties,
      required: SUBMIT_CV_REVIEW_TOOL.input_schema.required.filter(
        (k) => !LEAN_DROPPED.includes(k),
      ),
    },
  };
}
