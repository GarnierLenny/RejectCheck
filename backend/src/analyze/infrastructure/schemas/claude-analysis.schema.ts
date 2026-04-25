/**
 * JSON schemas Claude must conform to via tool_use. Extracted verbatim from
 * the legacy analyze.service.ts so the contract with the model is unchanged.
 *
 * Any change here directly impacts the structured output Claude returns, so
 * keep edits minimal and re-test against the AnalyzeResponseSchema (Zod) on
 * the consumer side after any tweak.
 */

const FIX_SCHEMA = {
  type: 'object' as const,
  properties: {
    summary: { type: 'string' as const },
    steps: { type: 'array' as const, items: { type: 'string' as const } },
    example: {
      anyOf: [
        { type: 'null' as const },
        {
          type: 'object' as const,
          properties: {
            before: { type: 'string' as const },
            after: { type: 'string' as const },
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
            name: { type: 'string' as const },
            description: { type: 'string' as const },
            endpoints: {
              type: 'array' as const,
              items: { type: 'string' as const },
            },
            bonus: {
              anyOf: [{ type: 'null' as const }, { type: 'string' as const }],
            },
            proves: { type: 'string' as const },
          },
          required: ['name', 'description', 'endpoints', 'bonus', 'proves'],
        },
      ],
    },
    time_required: { type: 'string' as const },
  },
  required: ['summary', 'steps', 'example', 'project_idea', 'time_required'],
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
    fix: FIX_SCHEMA,
  },
  required: ['severity', 'category', 'what', 'why', 'fix'],
};

const auditSchema = (description: string) => ({
  type: 'object' as const,
  description,
  properties: {
    score: {
      type: ['number', 'null'] as ['number', 'null'],
      minimum: 0,
      maximum: 100,
    },
    strengths: { type: 'array' as const, items: { type: 'string' as const } },
    issues: { type: 'array' as const, items: ISSUE_SCHEMA },
  },
  required: ['score', 'issues', 'strengths'],
});

export const SUBMIT_ANALYSIS_TOOL = {
  name: 'submit_analysis',
  description:
    'Submit the completed full application analysis as structured data.',
  input_schema: {
    type: 'object' as const,
    properties: {
      technical_analysis: {
        type: 'object' as const,
        properties: {
          reasoning: { type: 'string' as const },
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
                evidence: { type: 'string' as const },
              },
              required: ['name', 'expected', 'current', 'evidence'],
            },
            minItems: 5,
            maxItems: 5,
          },
          recommendation: { type: 'string' as const },
          market_context: { type: 'string' as const },
          seniority_signals: {
            type: 'array' as const,
            items: { type: 'string' as const },
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
          name: { type: 'string' as const },
          description: { type: 'string' as const },
          technologies: {
            type: 'array' as const,
            items: { type: 'string' as const },
          },
          key_features: {
            type: 'array' as const,
            items: { type: 'string' as const },
          },
          architecture: { type: 'string' as const },
          advanced_concepts: {
            type: 'array' as const,
            items: { type: 'string' as const },
          },
          success_criteria: {
            type: 'array' as const,
            items: { type: 'string' as const },
          },
          difficulty_level: {
            type: 'string' as const,
            enum: ['Intermediate', 'Advanced', 'Expert'],
          },
          why_it_matters: { type: 'string' as const },
          what_matters: {
            type: 'array' as const,
            items: { type: 'string' as const },
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
                description: 'One sentence explaining the confidence level',
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
        properties: {
          would_pass: { type: 'boolean' as const },
          score: { type: 'number' as const, minimum: 0, maximum: 100 },
          threshold: { type: 'number' as const, minimum: 0, maximum: 100 },
          reason: { type: 'string' as const },
          critical_missing_keywords: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                keyword: { type: 'string' as const },
                jd_frequency: { type: 'number' as const },
                required: { type: 'boolean' as const },
                sections_missing: {
                  type: 'array' as const,
                  items: { type: 'string' as const },
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
            },
          },
        },
        required: [
          'would_pass',
          'score',
          'threshold',
          'reason',
          'critical_missing_keywords',
        ],
      },
      seniority_analysis: {
        type: 'object' as const,
        properties: {
          expected: { type: 'string' as const },
          detected: { type: 'string' as const },
          gap: { type: 'string' as const },
          strength: { type: 'string' as const },
          fix: FIX_SCHEMA,
        },
        required: ['expected', 'detected', 'gap', 'strength', 'fix'],
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
          },
          fix: FIX_SCHEMA,
        },
        required: ['detected', 'examples', 'fix'],
      },
      audit_cv: auditSchema('CV structure, content and positioning audit.'),
      audit_github: auditSchema(
        'GitHub profile audit. score=null and empty arrays if GitHub not provided.',
      ),
      audit_linkedin: auditSchema(
        'LinkedIn profile audit. score=null and empty arrays if LinkedIn not provided.',
      ),
      audit_jd_match: {
        type: 'object' as const,
        description: 'Required skills from JD vs CV evidence.',
        properties: {
          required_skills: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                skill: { type: 'string' as const },
                found: { type: 'boolean' as const },
                evidence: {
                  anyOf: [
                    { type: 'null' as const },
                    { type: 'string' as const },
                  ],
                },
              },
              required: ['skill', 'found', 'evidence'],
            },
          },
          experience_gap: {
            anyOf: [{ type: 'null' as const }, { type: 'string' as const }],
          },
        },
        required: ['required_skills', 'experience_gap'],
      },
      hidden_red_flags: {
        type: 'array' as const,
        description: 'Subtle signals that would concern a senior recruiter.',
        items: {
          type: 'object' as const,
          properties: {
            flag: { type: 'string' as const },
            perception: { type: 'string' as const },
            fix: FIX_SCHEMA,
          },
          required: ['flag', 'perception', 'fix'],
        },
      },
      correlation: {
        type: 'object' as const,
        properties: {
          detected: { type: 'boolean' as const },
          explanation: { type: 'string' as const },
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
      'technical_analysis',
      'project_recommendation',
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
