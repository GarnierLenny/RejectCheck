/**
 * JSON schemas Claude must conform to via tool_use.
 *
 * The analysis is split into two passes for latency optimization:
 *
 * - SUBMIT_ANALYSIS_HOT_TOOL: scores, audits without fixes, red flag titles,
 *   seniority/tone without their .fix. Output ~2k tokens. Streams in ~25-40s.
 *
 * - SUBMIT_ANALYSIS_DEEP_TOOL: technical_analysis, project_recommendation,
 *   ATS critical missing keywords, and all fix blocks indexed by their owner
 *   in the hot result. Output ~6-8k tokens. Streams in ~80-110s after
 *   analysis_done.
 *
 * Any change here directly impacts the structured output Claude returns, so
 * keep edits minimal and re-test against the Zod schemas on the consumer side.
 */

const FIX_SCHEMA = {
  type: 'object' as const,
  properties: {
    summary: {
      type: 'string' as const,
      description:
        'One concise sentence stating the fix. ≤ 25 words. No preamble.',
    },
    steps: {
      type: 'array' as const,
      items: { type: 'string' as const },
      maxItems: 4,
      description:
        'At most 4 actionable steps. Each step ≤ 15 words, imperative voice.',
    },
    example: {
      anyOf: [
        { type: 'null' as const },
        {
          type: 'object' as const,
          properties: {
            before: {
              type: 'string' as const,
              description: 'Verbatim snippet from the CV. ≤ 25 words.',
            },
            after: {
              type: 'string' as const,
              description: 'The rewritten version. ≤ 25 words.',
            },
          },
          required: ['before', 'after'],
        },
      ],
    },
    project_idea: {
      anyOf: [
        { type: 'null' as const },
        {
          type: 'object' as const,
          properties: {
            name: {
              type: 'string' as const,
              description: 'Short project title in UPPERCASE. ≤ 6 words.',
            },
            description: {
              type: 'string' as const,
              description:
                'What the project does, in one or two sentences. ≤ 35 words.',
            },
            endpoints: {
              type: 'array' as const,
              items: { type: 'string' as const },
              maxItems: 5,
              description:
                'At most 5 short endpoint identifiers (e.g. "GET /users", "POST /auth/login").',
            },
            bonus: {
              anyOf: [{ type: 'null' as const }, { type: 'string' as const }],
              description:
                'Optional stretch goal. ≤ 20 words. null if not applicable.',
            },
            proves: {
              type: 'string' as const,
              description:
                'What skill this project demonstrates. ≤ 15 words.',
            },
          },
          required: ['name', 'description', 'endpoints', 'bonus', 'proves'],
        },
      ],
    },
    time_required: {
      type: 'string' as const,
      description:
        'Short time estimate (e.g. "30 min", "2-3 hours", "1 weekend").',
    },
  },
  required: ['summary', 'steps', 'example', 'project_idea', 'time_required'],
};

// Issue without `fix` — fix is generated in the deep pass and indexed by issue
// position in the corresponding audit array.
const ISSUE_HOT_SCHEMA = {
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

const auditHotSchema = (description: string) => ({
  type: 'object' as const,
  description,
  properties: {
    score: {
      type: ['number', 'null'] as ['number', 'null'],
      minimum: 0,
      maximum: 100,
    },
    strengths: {
      type: 'array' as const,
      items: { type: 'string' as const },
      maxItems: 4,
      description: 'At most 4 strengths. Pick the most impactful, drop the rest.',
    },
    issues: {
      type: 'array' as const,
      items: ISSUE_HOT_SCHEMA,
      maxItems: 4,
      description:
        'At most 4 issues, ordered by severity (critical → minor). Prioritise — drop low-impact items rather than listing them all.',
    },
  },
  required: ['score', 'issues', 'strengths'],
});

const ATS_CRITICAL_MISSING_KEYWORD_SCHEMA = {
  type: 'object' as const,
  properties: {
    keyword: {
      type: 'string' as const,
      description: 'The missing keyword. Single term or short phrase.',
    },
    jd_frequency: { type: 'number' as const },
    required: { type: 'boolean' as const },
    sections_missing: {
      type: 'array' as const,
      items: { type: 'string' as const },
      maxItems: 4,
      description:
        'At most 4 CV sections where the keyword should appear (e.g. "skills", "experience").',
    },
    score_impact: { type: 'number' as const },
  },
  required: [
    'keyword',
    'jd_frequency',
    'required',
    'sections_missing',
    'score_impact',
  ],
};

export const SUBMIT_ANALYSIS_HOT_TOOL = {
  name: 'submit_analysis_hot',
  description:
    'Submit the FAST analysis pass: scores, audits without fixes, red flag titles, seniority/tone diagnostics. Fix blocks, project recommendation, technical analysis, and ATS critical keywords are produced in a separate deep pass that runs immediately after.',
  input_schema: {
    type: 'object' as const,
    properties: {
      challenge_analysis: {
        type: 'object' as const,
        description:
          "OPTIONAL — Analysis of the candidate's daily code-review challenge track record, surfaced at the top of the 'Bridge the Gap' tab. OMIT this field entirely (do not include it in the tool input) when the JD is for a non-engineering role (PM, designer, marketing, sales, ops, etc.) OR when the JD's primary stack is outside {typescript, python, java} and the candidate has no track record on a closely related language. Otherwise, populate with status='cta' (no usable data) or status='analyzed' (data exists).",
        properties: {
          status: {
            type: 'string' as const,
            enum: ['cta', 'analyzed'],
            description:
              "'cta' when the user has no usable challenge data (anonymous or zero attempts in the JD's primary language). 'analyzed' when there is enough data to celebrate strengths.",
          },
          matched_language: {
            type: ['string', 'null'] as const,
            enum: ['typescript', 'python', 'java', null],
            description:
              "The challenge language identified as matching the JD's primary stack, or null if no match.",
          },
          cta: {
            type: ['object', 'null'] as const,
            description:
              "Set when status='cta'. Otherwise null.",
            properties: {
              language: {
                type: 'string' as const,
                description:
                  "Human label of the language to recommend (e.g. 'TypeScript', 'Python', 'Java'). Pick whichever maps to the JD's primary stack; if the JD's stack isn't covered by our challenges (typescript/python/java), pick the closest one.",
              },
              message: {
                type: 'string' as const,
                description:
                  "1-2 markdown sentences inviting the candidate to start daily challenges, e.g. 'Do daily TypeScript challenges for a month — perfect-scoring 5+ in a row would close the seniority gap your CV doesn't fully prove.'",
              },
            },
            required: ['language', 'message'],
          },
          summary: {
            type: ['string', 'null'] as const,
            description:
              "Set when status='analyzed'. 2-4 markdown sentences that celebrate what the user does well in their attempts. Otherwise null.",
          },
          strengths: {
            type: ['array', 'null'] as const,
            items: { type: 'string' as const },
            description:
              "Set when status='analyzed'. 2-4 short markdown bullet strings. Otherwise null.",
          },
          bridge_to_project: {
            type: ['string', 'null'] as const,
            description:
              "Set when status='analyzed'. 1-2 markdown sentences explaining how the project_recommendation (deep pass) covers the blind spots the daily challenges can't. Otherwise null.",
          },
        },
        required: ['status'],
      },
      overall: {
        type: 'object' as const,
        description:
          'Holistic overall rejection risk assessment combining all signals',
        properties: {
          score: {
            type: 'number' as const,
            minimum: 0,
            maximum: 100,
            description:
              'Overall rejection risk: 0=strong match (low risk), 100=very weak match (high risk)',
          },
          verdict: {
            type: 'string' as const,
            enum: ['Low', 'Medium', 'High'],
            description:
              'Low=strong candidate, Medium=partial match, High=weak match',
          },
          confidence: {
            type: 'object' as const,
            properties: {
              score: { type: 'number' as const, minimum: 0, maximum: 100 },
              reason: {
                type: 'string' as const,
                description:
                  'One sentence explaining the confidence level. ≤ 25 words.',
              },
            },
            required: ['score', 'reason'],
          },
        },
        required: ['score', 'verdict', 'confidence'],
      },
      keyword_match: {
        type: 'number' as const,
        description:
          '0-100: presence and density of key JD keywords in the CV.',
      },
      experience_level: {
        type: 'number' as const,
        description: '0-100: candidate seniority vs JD requirements.',
      },
      tech_stack_fit: {
        type: 'number' as const,
        description:
          "0-100: how well the candidate's tech stack matches the JD.",
      },
      github_signal: {
        type: ['number', 'null'] as ['number', 'null'],
        description: 'GitHub profile strength 0-100, null if not provided.',
      },
      linkedin_signal: {
        type: ['number', 'null'] as ['number', 'null'],
        description: 'LinkedIn profile strength 0-100, null if not provided.',
      },
      ats_simulation: {
        type: 'object' as const,
        description:
          'ATS pass/fail signal. The detailed list of critical_missing_keywords is generated in the deep pass.',
        properties: {
          would_pass: { type: 'boolean' as const },
          score: { type: 'number' as const, minimum: 0, maximum: 100 },
          threshold: { type: 'number' as const, minimum: 0, maximum: 100 },
          reason: {
            type: 'string' as const,
            description:
              'One sentence explaining the pass/fail and the main driver. ≤ 30 words.',
          },
        },
        required: ['would_pass', 'score', 'threshold', 'reason'],
      },
      seniority_analysis: {
        type: 'object' as const,
        description:
          'Seniority diagnostic. The .fix is generated in the deep pass.',
        properties: {
          expected: {
            type: 'string' as const,
            description: 'Seniority the JD targets, e.g. "Senior". ≤ 8 words.',
          },
          detected: {
            type: 'string' as const,
            description:
              'Seniority the CV signals, e.g. "Mid-level". ≤ 8 words.',
          },
          gap: {
            type: 'string' as const,
            description:
              'One sentence describing the mismatch. ≤ 25 words.',
          },
          strength: {
            type: 'string' as const,
            description:
              'One sentence describing what the candidate has going for them. ≤ 25 words.',
          },
        },
        required: ['expected', 'detected', 'gap', 'strength'],
      },
      cv_tone: {
        type: 'object' as const,
        description: 'Tone diagnostic. The .fix is generated in the deep pass.',
        properties: {
          detected: {
            type: 'string' as const,
            enum: ['passive', 'active', 'mixed'],
          },
          examples: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 4,
            description:
              'At most 4 short verbatim snippets from the CV. Each ≤ 20 words.',
          },
        },
        required: ['detected', 'examples'],
      },
      audit_cv: auditHotSchema(
        'CV structure, content and positioning audit. Issue fixes generated in deep pass.',
      ),
      audit_github: auditHotSchema(
        'GitHub profile audit. score=null and empty arrays if GitHub not provided. Issue fixes generated in deep pass.',
      ),
      audit_linkedin: auditHotSchema(
        'LinkedIn profile audit. score=null and empty arrays if LinkedIn not provided. Issue fixes generated in deep pass.',
      ),
      audit_jd_match: {
        type: 'object' as const,
        description: 'Required skills from JD vs CV evidence.',
        properties: {
          required_skills: {
            type: 'array' as const,
            maxItems: 8,
            description:
              'At most 8 required skills from the JD, ordered by criticality. Drop nice-to-haves rather than listing every keyword.',
            items: {
              type: 'object' as const,
              properties: {
                skill: { type: 'string' as const },
                found: { type: 'boolean' as const },
                evidence: {
                  anyOf: [
                    { type: 'null' as const },
                    {
                      type: 'string' as const,
                      description:
                        'Short quote or paraphrase from the CV proving the skill. ≤ 20 words. null if not found.',
                    },
                  ],
                },
              },
              required: ['skill', 'found', 'evidence'],
            },
          },
          experience_gap: {
            anyOf: [
              { type: 'null' as const },
              {
                type: 'string' as const,
                description:
                  'One sentence on years-of-experience mismatch. ≤ 30 words. null if no gap.',
              },
            ],
          },
        },
        required: ['required_skills', 'experience_gap'],
      },
      hidden_red_flags: {
        type: 'array' as const,
        description:
          'At most 3 subtle signals that would concern a senior recruiter. Each entry only has its flag + perception here; the .fix is generated in the deep pass and indexed by position. Pick the most damaging — drop weaker ones rather than diluting.',
        maxItems: 3,
        items: {
          type: 'object' as const,
          properties: {
            flag: {
              type: 'string' as const,
              description: 'Short label of the red flag. ≤ 10 words.',
            },
            perception: {
              type: 'string' as const,
              description:
                'How a senior recruiter reads it. ≤ 30 words.',
            },
          },
          required: ['flag', 'perception'],
        },
      },
      correlation: {
        type: 'object' as const,
        properties: {
          detected: { type: 'boolean' as const },
          explanation: {
            type: 'string' as const,
            description:
              'One sentence on the tone × seniority interaction. ≤ 30 words.',
          },
        },
        required: ['detected', 'explanation'],
      },
      job_details: {
        type: 'object' as const,
        description: 'Structured metadata extracted from the job description.',
        properties: {
          title: {
            type: 'string' as const,
            description:
              'Role type only, no seniority. E.g. "Front-End Developer", "Back-End Developer", "Full-Stack Developer", "DevOps Engineer", "Mobile Developer", "ML Engineer", "Data Engineer", "Security Engineer", "Software Engineer". Never return "Developer" alone or "N/A".',
          },
          company: {
            type: 'string' as const,
            description:
              'Company name from the job description. Use "Unknown Company" if not found. Never return an empty string or "N/A".',
          },
          seniority: {
            type: 'string' as const,
            enum: [
              'junior',
              'junior-mid',
              'mid',
              'mid-senior',
              'senior',
              'not-mentioned',
            ],
            description:
              'Seniority level targeted by the JD. Use "not-mentioned" if absent.',
          },
          pay: {
            anyOf: [{ type: 'string' as const }, { type: 'null' as const }],
            description:
              'Salary or daily rate as a free string (e.g. "45-55k€", "TJM 600€"). null if not mentioned.',
          },
          office_location: {
            anyOf: [{ type: 'string' as const }, { type: 'null' as const }],
            description:
              'City or address (e.g. "Paris 8e", "Lyon"). null if fully remote or not mentioned.',
          },
          work_setting: {
            type: 'string' as const,
            enum: ['full-remote', 'on-site', 'hybrid', 'not-mentioned'],
            description: 'Remote/office policy.',
          },
          contract_type: {
            type: 'string' as const,
            enum: [
              'CDI',
              'CDD',
              'freelance',
              'internship',
              'apprenticeship',
              'not-mentioned',
            ],
            description: 'Type of contract.',
          },
          languages_required: {
            type: 'string' as const,
            enum: ['french-only', 'english-only', 'bilingual', 'not-mentioned'],
            description:
              '"bilingual" = both French and English explicitly required.',
          },
          years_of_experience: {
            anyOf: [{ type: 'string' as const }, { type: 'null' as const }],
            description:
              'Years of experience explicitly required (e.g. "3-5 ans", "2+ years"). null if not mentioned.',
          },
          company_stage: {
            type: 'string' as const,
            enum: ['startup', 'scale-up', 'sme', 'enterprise', 'not-mentioned'],
            description:
              'Company stage inferred from headcount, funding, or brand recognition.',
          },
          jd_language: {
            type: 'string' as const,
            description:
              'ISO 639-1 language code of the job description text (e.g. "en", "fr", "de", "es"). Detect from the JD content.',
          },
        },
        required: [
          'title',
          'company',
          'seniority',
          'pay',
          'office_location',
          'work_setting',
          'contract_type',
          'languages_required',
          'years_of_experience',
          'company_stage',
          'jd_language',
        ],
      },
    },
    required: [
      'overall',
      'keyword_match',
      'experience_level',
      'tech_stack_fit',
      'github_signal',
      'linkedin_signal',
      'ats_simulation',
      'seniority_analysis',
      'cv_tone',
      'audit_cv',
      'audit_github',
      'audit_linkedin',
      'audit_jd_match',
      'hidden_red_flags',
      'correlation',
      'job_details',
    ],
  },
};

export const SUBMIT_ANALYSIS_DEEP_TOOL = {
  name: 'submit_analysis_deep',
  description:
    'Submit the DEEP analysis pass that runs after the hot pass. Generate technical_analysis, the Bridge-the-Gap project_recommendation, ATS critical missing keywords, and ALL fix blocks. Each fix array MUST have the same length as the corresponding hot-pass array (one fix per issue/red flag, in order).',
  input_schema: {
    type: 'object' as const,
    properties: {
      technical_analysis: {
        type: 'object' as const,
        properties: {
          reasoning: {
            type: 'string' as const,
            description:
              'High-level synthesis of the technical match. ≤ 60 words.',
          },
          skill_priority: {
            type: 'array' as const,
            description:
              'The 5 skill names ordered from most to least critical for THIS specific job',
            items: { type: 'string' as const },
            minItems: 5,
            maxItems: 5,
          },
          skills: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const },
                expected: { type: 'number' as const },
                current: { type: 'number' as const },
                evidence: {
                  type: 'string' as const,
                  description:
                    'Short concrete justification of the current/expected score. ≤ 25 words.',
                },
              },
              required: ['name', 'expected', 'current', 'evidence'],
            },
            minItems: 5,
            maxItems: 5,
          },
          recommendation: {
            type: 'string' as const,
            description:
              'Actionable strategic advice for the candidate. ≤ 50 words.',
          },
          market_context: {
            type: 'string' as const,
            description:
              'Market positioning insight (demand, salary signal, hiring difficulty). ≤ 50 words.',
          },
          seniority_signals: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 4,
            description:
              'At most 4 short signals (each ≤ 15 words) — observable proofs of seniority.',
          },
        },
        required: [
          'reasoning',
          'skill_priority',
          'skills',
          'recommendation',
          'market_context',
          'seniority_signals',
        ],
      },
      project_recommendation: {
        type: 'object' as const,
        properties: {
          name: {
            type: 'string' as const,
            description: 'Project title. ≤ 6 words.',
          },
          description: {
            type: 'string' as const,
            description:
              'What the project does and why it bridges the gap. ≤ 50 words.',
          },
          technologies: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 8,
          },
          key_features: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 4,
            description:
              'At most 4 key features. Each ≤ 12 words, action-oriented.',
          },
          architecture: {
            type: 'string' as const,
            description:
              'Short technical sketch of how the system is laid out. ≤ 50 words.',
          },
          advanced_concepts: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 3,
            description: 'At most 3 concepts. Each ≤ 10 words.',
          },
          success_criteria: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 4,
            description: 'At most 4 criteria. Each ≤ 12 words.',
          },
          difficulty_level: {
            type: 'string' as const,
            enum: ['Intermediate', 'Advanced', 'Expert'],
          },
          why_it_matters: {
            type: 'string' as const,
            description:
              'Why building this matters for THIS specific JD. ≤ 50 words.',
          },
          what_matters: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 4,
            description: 'At most 4 priority items. Each ≤ 12 words.',
          },
        },
        required: [
          'name',
          'description',
          'technologies',
          'key_features',
          'architecture',
          'advanced_concepts',
          'success_criteria',
          'difficulty_level',
          'why_it_matters',
          'what_matters',
        ],
      },
      ats_critical_missing_keywords: {
        type: 'array' as const,
        description:
          'At most 5 keywords from the JD that are absent or under-represented in the CV. Order by score_impact desc — drop low-impact entries rather than padding.',
        maxItems: 5,
        items: ATS_CRITICAL_MISSING_KEYWORD_SCHEMA,
      },
      fixes: {
        type: 'object' as const,
        description:
          'All fix blocks indexed by their owner in the hot result. Array lengths MUST match the hot pass exactly (one fix per issue/red flag, in order). Generate the fix object FIRST in each array; do not skip indices.',
        properties: {
          seniority_analysis: FIX_SCHEMA,
          cv_tone: FIX_SCHEMA,
          audit_cv_issues: {
            type: 'array' as const,
            items: FIX_SCHEMA,
            maxItems: 4,
            description:
              'One fix per issue in audit_cv.issues, same order. Length MUST match the hot audit_cv.issues array.',
          },
          audit_github_issues: {
            type: 'array' as const,
            items: FIX_SCHEMA,
            maxItems: 4,
            description:
              'One fix per issue in audit_github.issues, same order. Length MUST match the hot audit_github.issues array.',
          },
          audit_linkedin_issues: {
            type: 'array' as const,
            items: FIX_SCHEMA,
            maxItems: 4,
            description:
              'One fix per issue in audit_linkedin.issues, same order. Length MUST match the hot audit_linkedin.issues array.',
          },
          hidden_red_flags: {
            type: 'array' as const,
            items: FIX_SCHEMA,
            maxItems: 3,
            description:
              'One fix per entry in hidden_red_flags, same order. Length MUST match the hot hidden_red_flags array.',
          },
        },
        required: [
          'seniority_analysis',
          'cv_tone',
          'audit_cv_issues',
          'audit_github_issues',
          'audit_linkedin_issues',
          'hidden_red_flags',
        ],
      },
    },
    required: [
      'technical_analysis',
      'project_recommendation',
      'ats_critical_missing_keywords',
      'fixes',
    ],
  },
};
