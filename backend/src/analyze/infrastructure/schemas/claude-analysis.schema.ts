/**
 * JSON schemas Claude must conform to via tool_use.
 *
 * SUBMIT_ANALYSIS_TOOL (primary): single-pass full analysis — scores, audits
 * with inline fix blocks, seniority/tone with fixes, ATS keywords, and
 * optionally project_recommendation. Replaces the old hot+deep two-pass flow.
 *
 * Legacy tools kept for backward compat (old DB rows):
 * - SUBMIT_ANALYSIS_HOT_TOOL: fast pass without fixes
 * - SUBMIT_ANALYSIS_DEEP_TOOL: fix blocks indexed to the hot result
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
    issues: {
      type: 'array' as const,
      items: ISSUE_HOT_SCHEMA,
      maxItems: 3,
      description:
        'At most 3 issues, ordered by severity (critical → minor). Prioritise — drop low-impact items rather than listing them all.',
    },
  },
  required: ['score', 'issues'],
});

const TECHNICAL_ANALYSIS_SCHEMA = {
  type: 'object' as const,
  description:
    'Technical skill gap analysis. Drives the Skill Gap radar chart on the result view — generated in the hot pass so the user lands on a fully-populated overview tab.',
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
    seniority_signals: {
      type: 'array' as const,
      items: { type: 'string' as const },
      maxItems: 2,
      description:
        'At most 2 short signals (each ≤ 15 words) — observable proofs of seniority. Pick the two strongest.',
    },
  },
  required: [
    'reasoning',
    'skill_priority',
    'skills',
    'recommendation',
    'seniority_signals',
  ],
};

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
          'ESTIMATE of how an ATS keyword/format filter would score this CV against this JD — not a real ATS engine. The detailed critical_missing_keywords list is generated in the deep pass.',
        properties: {
          would_pass: {
            type: 'boolean' as const,
            description:
              'MUST equal (score >= threshold). Do not set independently — the backend recomputes it from score and threshold, so an inconsistent value here will be overwritten.',
          },
          score: { type: 'number' as const, minimum: 0, maximum: 100 },
          threshold: { type: 'number' as const, minimum: 0, maximum: 100 },
          reason: {
            type: 'string' as const,
            description:
              'One sentence explaining the estimate and the main driver. ≤ 30 words.',
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
          'At most 2 subtle signals that would concern a senior recruiter. Each entry only has its flag + perception here; the .fix is generated in the deep pass and indexed by position. Pick the most damaging — drop weaker ones rather than diluting.',
        maxItems: 2,
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
      technical_analysis: TECHNICAL_ANALYSIS_SCHEMA,
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
      'technical_analysis',
      'job_details',
    ],
  },
};

// Shared `highlight_terms` JSON-schema property — verbatim phrases to underline
// per source document (CV / LinkedIn / cover letter). Lives on the DEEP pass in
// the split flow (kept off the hot pass to keep the diagnostic fast); the legacy
// single-pass tool defines its own inline copy.
const HIGHLIGHT_TERMS_PROPERTY = (() => {
  const termEntry = (docHint: string) => ({
    type: 'object' as const,
    properties: {
      term: { type: 'string' as const, description: `Verbatim excerpt copy-pasted from the ${docHint}. 2-8 words. Must exist character-for-character in the document.` },
      tooltip: { type: 'string' as const, description: 'One sentence shown on hover. ≤ 20 words.' },
    },
    required: ['term', 'tooltip'],
  });
  const sourceSchema = (doc: string, flagDesc: string, issueDesc: string, skillDesc: string | null, weakDesc: string, metricsDesc: string | null) => ({
    type: 'object' as const,
    properties: {
      flags: { type: 'array' as const, description: flagDesc, maxItems: 6, items: termEntry(doc) },
      issues: { type: 'array' as const, description: issueDesc, maxItems: 10, items: termEntry(doc) },
      ...(skillDesc ? { skills: { type: 'array' as const, description: skillDesc, maxItems: 12, items: { type: 'string' as const } } } : {}),
      weak: { type: 'array' as const, description: weakDesc, maxItems: 8, items: termEntry(doc) },
      ...(metricsDesc ? { metrics: { type: 'array' as const, description: metricsDesc, maxItems: 8, items: termEntry(doc) } } : {}),
    },
    required: ['flags', 'issues', 'weak', ...(skillDesc ? ['skills'] : []), ...(metricsDesc ? ['metrics'] : [])],
  });
  return {
    type: 'object' as const,
    description: 'Verbatim phrases to underline per source document. The matching engine is a case-insensitive regex — one wrong character = no underline. Every term MUST be copy-pasteable from the source document. Omit rather than approximate. Keep excerpts 2-8 words.',
    properties: {
      cv: sourceSchema(
        'CV text',
        'Verbatim CV phrases showing ambiguous ownership or weak agency: "participated in", "helped with", "involved in", "contributed to". One excerpt per occurrence.',
        'Verbatim CV phrases that expose an audit_cv issue. One or two excerpts per issue.',
        'Exact skill/technology names as written in the CV that match required JD skills (found=true in audit_jd_match). Use exact CV casing.',
        'Passive or nominalized phrases from CV bullets that illustrate cv_tone findings.',
        'Verbatim CV phrases containing a number, percentage, or measurable result (e.g. "réduit la latence de 40%", "géré une équipe de 8"). Positive signals.',
      ),
      linkedin: sourceSchema(
        'LinkedIn text',
        'Verbatim LinkedIn phrases showing ambiguous ownership or weak agency (same logic as CV flags).',
        'Verbatim LinkedIn phrases with weak positioning — vague titles, generic descriptions, or soft phrasing that undersells the candidate.',
        'Skill/technology names as written in the LinkedIn profile that match required JD skills. Use exact LinkedIn casing.',
        'Passive or weak phrasing copied directly from the LinkedIn bio or experience descriptions.',
        'Verbatim LinkedIn phrases containing a measurable result or quantified achievement.',
      ),
      cover_letter: {
        type: 'object' as const,
        description: 'Highlights for the motivation/cover letter. Only populate if a cover letter was provided.',
        properties: {
          flags: { type: 'array' as const, description: 'Generic opening formulas or hollow clichés copied from the letter (e.g. "I am writing to apply for", "Je me permets de vous contacter", "team player").', maxItems: 6, items: termEntry('cover letter text') },
          issues: { type: 'array' as const, description: 'Verbatim repeated words/phrases or weak arguments copied from the cover letter.', maxItems: 10, items: termEntry('cover letter text') },
          weak: { type: 'array' as const, description: 'Passive or conditional phrasing copied from the cover letter (e.g. "je souhaiterais", "I would be interested in").', maxItems: 8, items: termEntry('cover letter text') },
        },
        required: ['flags', 'issues', 'weak'],
      },
    },
    required: ['cv', 'linkedin', 'cover_letter'],
  };
})();

// Bridge-the-Gap project recommendation — standalone so the legacy deep tool
// and the single-pass tool reference the same definition.
const PROJECT_RECOMMENDATION_PROPERTY = {
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
            items: {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const, description: 'Technology name, e.g. "NestJS"' },
                category: {
                  type: 'string' as const,
                  enum: ['frontend', 'backend', 'database', 'infra', 'ai/ml', 'tooling', 'cloud'],
                },
                reason: {
                  type: 'string' as const,
                  description: 'Why this tech was chosen for this project. ≤ 12 words.',
                },
              },
              required: ['name', 'category', 'reason'],
            },
            maxItems: 8,
          },
          key_features: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 3,
            description: 'At most 3 key features. Each ≤ 12 words, action-oriented.',
          },
          architecture: {
            type: 'string' as const,
            description: 'Short technical sketch of how the system is laid out. ≤ 50 words.',
          },
          architecture_diagram: {
            type: 'string' as const,
            description: 'A valid Mermaid diagram string (flowchart LR). Show the main components and data flow. Max 8 nodes. No quotes or special characters in node labels. Keep it simple.',
          },
          success_criteria: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 3,
            description: 'At most 3 criteria. Each ≤ 12 words.',
          },
          difficulty_level: {
            type: 'string' as const,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
          },
          why_it_matters: {
            type: 'string' as const,
            description: 'Why building this matters for THIS specific JD. ≤ 50 words.',
          },
          cv_bullet: {
            type: 'string' as const,
            description:
              'A ready-to-paste CV bullet TEMPLATE the candidate adds once the project is built. Start with a strong past-tense verb, include the core technologies, and leave a clearly-marked placeholder for a REAL measured metric (e.g. "[X]% faster", "[N] users") — never fabricate a number. ≤ 25 words.',
          },
          signal_boost: {
            type: 'string' as const,
            description:
              'One or two sentences the candidate can drop verbatim into their cover letter or say in the first interview round. Must reference a concrete detail from the job description. ≤ 40 words.',
          },
          sections: {
            type: 'array' as const,
            description: '3 to 6 implementation sections (e.g. Setup, Core, Backend, Frontend, Testing, Deployment). Only include sections relevant to this project. Each section contains 2 to 5 concrete checkable steps.',
            items: {
              type: 'object' as const,
              properties: {
                title: { type: 'string' as const, description: 'Section name. ≤ 5 words. e.g. "Setup", "Core pipeline", "Testing".' },
                duration: { type: 'string' as const, description: 'Estimated time for this section. e.g. "Jour 1", "Jour 2-3".' },
                steps: {
                  type: 'array' as const,
                  items: {
                    type: 'object' as const,
                    properties: {
                      title: { type: 'string' as const, description: 'Actionable step title. ≤ 8 words.' },
                      description: { type: 'string' as const, description: 'What to do. Be concrete and specific. ≤ 50 words.' },
                    },
                    required: ['title', 'description'],
                  },
                  minItems: 2,
                  maxItems: 5,
                },
              },
              required: ['title', 'duration', 'steps'],
            },
            minItems: 3,
            maxItems: 6,
          },
          edge_cases: {
            type: 'array' as const,
            description: '2 to 4 common pitfalls specific to this project and stack.',
            items: {
              type: 'object' as const,
              properties: {
                problem: { type: 'string' as const, description: '≤ 12 words' },
                solution: { type: 'string' as const, description: '≤ 30 words' },
              },
              required: ['problem', 'solution'],
            },
            minItems: 2,
            maxItems: 4,
          },
          going_further: {
            type: 'array' as const,
            description: '3 to 5 ideas to extend the project after the MVP.',
            items: { type: 'string' as const, description: '≤ 12 words each' },
            minItems: 3,
            maxItems: 5,
          },
          how_to_sell: {
            type: 'object' as const,
            properties: {
              github_readme_tip: {
                type: 'string' as const,
                description: 'How to write the GitHub README to impress recruiters. ≤ 40 words.',
              },
              interview_pitch: {
                type: 'string' as const,
                description: 'Opening sentence to pitch this project in an interview. ≤ 40 words.',
              },
              star_tactics: {
                type: 'string' as const,
                description: 'How to get GitHub stars and community visibility (HN, Reddit, etc.). ≤ 40 words.',
              },
            },
            required: ['github_readme_tip', 'interview_pitch', 'star_tactics'],
          },
          interview_questions: {
            type: 'array' as const,
            description: '3 to 5 technical interview questions a recruiter would ask about this specific project, with concise answers.',
            items: {
              type: 'object' as const,
              properties: {
                question: { type: 'string' as const },
                answer: { type: 'string' as const, description: '≤ 60 words. Reference the project architecture and the JD.' },
              },
              required: ['question', 'answer'],
            },
            minItems: 3,
            maxItems: 5,
          },
          testing_strategy: {
            type: 'string' as const,
            description: 'How to test this project: what to unit test, integration test, and which tools. Specific to the stack. ≤ 60 words.',
          },
          gap_bridges: {
            type: 'array' as const,
            description: 'For each skill gap from technical_analysis (current < expected), identify the specific section that closes it and the concrete interview claim the candidate earns by completing it.',
            items: {
              type: 'object' as const,
              properties: {
                skill_name: {
                  type: 'string' as const,
                  description: 'Exact skill name from technical_analysis.skills.',
                },
                phase_title: {
                  type: 'string' as const,
                  description: 'Title of the section that primarily closes this gap. Must match a section title exactly.',
                },
                claim: {
                  type: 'string' as const,
                  description: 'Concrete sentence the candidate can say in an interview after completing this phase. Start with "I built..." or "I implemented...". ≤ 20 words.',
                },
              },
              required: ['skill_name', 'phase_title', 'claim'],
            },
          },
        },
        required: [
          'name',
          'description',
          'technologies',
          'key_features',
          'architecture',
          'architecture_diagram',
          'success_criteria',
          'difficulty_level',
          'why_it_matters',
          'cv_bullet',
          'signal_boost',
          'sections',
          'edge_cases',
          'going_further',
          'how_to_sell',
          'interview_questions',
          'testing_strategy',
        ],
};

export const SUBMIT_ANALYSIS_DEEP_TOOL = {
  name: 'submit_analysis_deep',
  description:
    'Submit the DEEP analysis pass that runs after the hot pass. Generate the Bridge-the-Gap project_recommendation, ATS critical missing keywords, and ALL fix blocks. Each fix array MUST have the same length as the corresponding hot-pass array (one fix per issue/red flag, in order).',
  input_schema: {
    type: 'object' as const,
    properties: {
      highlight_terms: HIGHLIGHT_TERMS_PROPERTY,
      project_recommendation: PROJECT_RECOMMENDATION_PROPERTY,
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
          'All fix blocks indexed by their owner in the hot result. Array lengths MUST match the hot pass exactly (one fix per issue/red flag, in order). Generate the fix object FIRST in each array; do not skip indices. IMPORTANT — only populate `project_idea` (the nested mini-project) on `audit_cv_issues` and `hidden_red_flags` fixes (the most actionable). For `seniority_analysis`, `cv_tone`, `audit_github_issues`, and `audit_linkedin_issues` fixes, set `project_idea` to null — the summary + steps + example are enough there. `cv_tone` fix is OPTIONAL (skip if the tone diagnostic doesn\'t warrant an actionable fix).',
        properties: {
          seniority_analysis: FIX_SCHEMA,
          cv_tone: FIX_SCHEMA,
          audit_cv_issues: {
            type: 'array' as const,
            items: FIX_SCHEMA,
            maxItems: 3,
            description:
              'One fix per issue in audit_cv.issues, same order. Length MUST match the hot audit_cv.issues array.',
          },
          audit_github_issues: {
            type: 'array' as const,
            items: FIX_SCHEMA,
            maxItems: 3,
            description:
              'One fix per issue in audit_github.issues, same order. Length MUST match the hot audit_github.issues array.',
          },
          audit_linkedin_issues: {
            type: 'array' as const,
            items: FIX_SCHEMA,
            maxItems: 3,
            description:
              'One fix per issue in audit_linkedin.issues, same order. Length MUST match the hot audit_linkedin.issues array.',
          },
          hidden_red_flags: {
            type: 'array' as const,
            items: FIX_SCHEMA,
            maxItems: 2,
            description:
              'One fix per entry in hidden_red_flags, same order. Length MUST match the hot hidden_red_flags array.',
          },
        },
        required: [
          'seniority_analysis',
          'audit_cv_issues',
          'audit_github_issues',
          'audit_linkedin_issues',
          'hidden_red_flags',
        ],
      },
    },
    required: [
      'highlight_terms',
      'project_recommendation',
      'ats_critical_missing_keywords',
      'fixes',
    ],
  },
};

/**
 * Returns the deep-pass tool definition. When `generateBridgeProject` is
 * false, `project_recommendation` is removed from the schema so Claude
 * skips generating it entirely (saves ~1–2k tokens per analysis for free
 * users who cannot see §09 anyway).
 */
export function buildDeepAnalysisTool(generateBridgeProject: boolean) {
  if (generateBridgeProject) return SUBMIT_ANALYSIS_DEEP_TOOL;

  const { project_recommendation: _dropped, ...propertiesWithout } =
    SUBMIT_ANALYSIS_DEEP_TOOL.input_schema.properties;

  return {
    ...SUBMIT_ANALYSIS_DEEP_TOOL,
    description:
      'Submit the DEEP analysis pass that runs after the hot pass. Generate ATS critical missing keywords and ALL fix blocks. Each fix array MUST have the same length as the corresponding hot-pass array (one fix per issue/red flag, in order).',
    input_schema: {
      ...SUBMIT_ANALYSIS_DEEP_TOOL.input_schema,
      properties: propertiesWithout,
      required: ['highlight_terms', 'ats_critical_missing_keywords', 'fixes'],
    },
  };
}

// =============================================================================
// SUBMIT_ANALYSIS_TOOL — single-pass combined analysis (replaces hot + deep)
//
// Self-contained on purpose (no references into the legacy hot/deep tools) so
// those can be deleted without touching this section. Property order is
// deliberate: Claude generates fields in schema order and the backend streams
// each completed top-level section to the client, so the order below IS the
// progressive-render order — header first, diagnostic next, actionable last.
// =============================================================================

// Compact fix used inline on every issue: fewer/shorter steps than the legacy
// FIX_SCHEMA so a 10-issue audit stays within the token budget.
const INLINE_FIX_SCHEMA = {
  ...FIX_SCHEMA,
  properties: {
    ...FIX_SCHEMA.properties,
    summary: {
      type: 'string' as const,
      description:
        'One concise sentence stating the fix. ≤ 20 words. No preamble.',
    },
    steps: {
      type: 'array' as const,
      items: { type: 'string' as const },
      maxItems: 3,
      description:
        'At most 3 actionable steps. Each step ≤ 12 words, imperative voice.',
    },
  },
};

const ISSUE_WITH_FIX_SCHEMA = {
  type: 'object' as const,
  properties: {
    ...ISSUE_HOT_SCHEMA.properties,
    fix: {
      ...INLINE_FIX_SCHEMA,
      description:
        'Actionable fix. Set project_idea to null except on audit_cv and hidden_red_flags items.',
    },
  },
  required: [...ISSUE_HOT_SCHEMA.required, 'fix'],
};

const auditWithFixSchema = (description: string, maxIssues: number) => ({
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
      items: ISSUE_WITH_FIX_SCHEMA,
      maxItems: maxIssues,
      description: `Up to ${maxIssues} issues ordered by severity (critical → minor), each with an inline fix. Be exhaustive within the cap — list every distinct issue a senior recruiter would flag. Do not pad or repeat.`,
    },
  },
  required: ['score', 'issues'],
});

const JOB_DETAILS_PROPERTY = {
  type: 'object' as const,
  description:
    'Structured metadata extracted from the job description. Generated FIRST so the result header renders early.',
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
};

const OVERALL_PROPERTY = {
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
};

const ATS_SIMULATION_PROPERTY = {
  type: 'object' as const,
  description:
    'ESTIMATE of how an ATS keyword/format filter would score this CV against this JD — not a real ATS engine. The detailed critical_missing_keywords list is generated later in this same pass (ats_critical_missing_keywords).',
  properties: {
    would_pass: {
      type: 'boolean' as const,
      description:
        'MUST equal (score >= threshold). Do not set independently — the backend recomputes it from score and threshold, so an inconsistent value here will be overwritten.',
    },
    score: { type: 'number' as const, minimum: 0, maximum: 100 },
    threshold: { type: 'number' as const, minimum: 0, maximum: 100 },
    reason: {
      type: 'string' as const,
      description:
        'One sentence explaining the estimate and the main driver. ≤ 30 words.',
    },
  },
  required: ['would_pass', 'score', 'threshold', 'reason'],
};

const AUDIT_JD_MATCH_PROPERTY = {
  type: 'object' as const,
  description: 'Required skills from JD vs CV evidence.',
  properties: {
    required_skills: {
      type: 'array' as const,
      maxItems: 12,
      description:
        'Up to 12 required skills from the JD, ordered by criticality. Cover every hard requirement before nice-to-haves.',
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
};

const SENIORITY_ANALYSIS_PROPERTY = {
  type: 'object' as const,
  description: 'Seniority diagnostic with actionable fix.',
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
    fix: {
      ...INLINE_FIX_SCHEMA,
      description: 'Fix for the seniority gap. Set project_idea to null.',
    },
  },
  required: ['expected', 'detected', 'gap', 'strength', 'fix'],
};

const CV_TONE_PROPERTY = {
  type: 'object' as const,
  description:
    'Tone diagnostic. Include a fix only when the tone clearly needs an actionable change (skip otherwise).',
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
        'At most 6 short verbatim snippets from the CV. Each ≤ 20 words.',
    },
    fix: {
      ...INLINE_FIX_SCHEMA,
      description: 'Optional tone fix. Set project_idea to null.',
    },
  },
  required: ['detected', 'examples'],
};

const HIDDEN_RED_FLAGS_PROPERTY = {
  type: 'array' as const,
  description:
    'Up to 5 subtle signals that would concern a senior recruiter, ordered by damage. Each entry includes its flag, perception, and actionable fix (project_idea allowed). Only include real signals — never pad to 5.',
  maxItems: 5,
  items: {
    type: 'object' as const,
    properties: {
      flag: {
        type: 'string' as const,
        description: 'Short label of the red flag. ≤ 10 words.',
      },
      perception: {
        type: 'string' as const,
        description: 'How a senior recruiter reads it. ≤ 30 words.',
      },
      fix: INLINE_FIX_SCHEMA,
    },
    required: ['flag', 'perception', 'fix'],
  },
};

// Exported: also used by the standalone CV-review tool (cv-review.schema.ts).
export const BULLET_REVIEWS_PROPERTY = {
  type: 'object' as const,
  description:
    'Bullet-by-bullet review of the CV. Cover every substantive bullet from the experience and project sections (skip education, contact info, and bare skill lists). If the CV has more than 25 bullets, prioritise the most recent roles and the weakest bullets.',
  properties: {
    bullets: {
      type: 'array' as const,
      minItems: 6,
      maxItems: 25,
      items: {
        type: 'object' as const,
        properties: {
          original: {
            type: 'string' as const,
            description:
              'Verbatim bullet copy-pasted from the CV, 2-30 words. Must exist character-for-character in the CV text (same matching rule as highlight_terms). Truncate long bullets at 30 words.',
          },
          section: {
            type: 'string' as const,
            description:
              'Where the bullet lives, e.g. "Experience — Acme (2021-2023)". ≤ 10 words.',
          },
          verdict: {
            type: 'string' as const,
            enum: ['strong', 'weak', 'fatal'],
            description:
              'strong = keep as is. weak = undersells the candidate. fatal = actively hurts (vague, passive, no outcome).',
          },
          flags: {
            type: 'array' as const,
            maxItems: 3,
            items: {
              type: 'string' as const,
              enum: [
                'weak_verb',
                'no_metric',
                'passive_voice',
                'vague_scope',
                'buzzword',
                'no_outcome',
                'too_long',
              ],
            },
            description:
              'What is wrong with the bullet. Empty array when verdict is strong.',
          },
          why: {
            type: 'string' as const,
            description: 'How a recruiter reads this bullet. ≤ 20 words.',
          },
          rewrite: {
            anyOf: [{ type: 'null' as const }, { type: 'string' as const }],
            description:
              'Rewritten bullet: strong past-tense verb, concrete scope, placeholder for a REAL metric ("[X]%", "[N] users") — never fabricate numbers. ≤ 30 words. null when verdict is strong.',
          },
        },
        required: ['original', 'section', 'verdict', 'flags', 'why', 'rewrite'],
      },
    },
  },
  required: ['bullets'],
};

const CHALLENGE_ANALYSIS_PROPERTY = {
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
      description: "Set when status='cta'. Otherwise null.",
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
        "Set when status='analyzed'. 1-2 markdown sentences explaining how the project_recommendation (generated at the end of this pass) covers the blind spots the daily challenges can't. Otherwise null.",
    },
  },
  required: ['status'],
};

const ATS_CRITICAL_MISSING_KEYWORDS_PROPERTY = {
  type: 'array' as const,
  description:
    'The complete list of JD keywords absent or under-represented in the CV, up to 15, ordered by score_impact desc. Cover every impactful gap — do not stop at the obvious few, but never pad with marginal terms.',
  maxItems: 15,
  items: ATS_CRITICAL_MISSING_KEYWORD_SCHEMA,
};

/**
 * Returns the single-pass combined analysis tool.
 *
 * Property order = generation order = progressive-render order (see the
 * section banner above). When `generateBridgeProject` is false,
 * `project_recommendation` is omitted so Claude skips it entirely.
 */
export function buildAnalysisTool(generateBridgeProject: boolean) {
  const properties: Record<string, unknown> = {
    job_details: JOB_DETAILS_PROPERTY,
    overall: OVERALL_PROPERTY,
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
    ats_simulation: ATS_SIMULATION_PROPERTY,
    audit_jd_match: AUDIT_JD_MATCH_PROPERTY,
    seniority_analysis: SENIORITY_ANALYSIS_PROPERTY,
    technical_analysis: TECHNICAL_ANALYSIS_SCHEMA,
    cv_tone: CV_TONE_PROPERTY,
    audit_cv: auditWithFixSchema(
      'CV structure, content and positioning audit. Each issue includes an inline fix (project_idea allowed).',
      10,
    ),
    audit_github: auditWithFixSchema(
      'GitHub profile audit. score=null and empty arrays if GitHub not provided. Each issue includes an inline fix (set project_idea to null).',
      6,
    ),
    audit_linkedin: auditWithFixSchema(
      'LinkedIn profile audit. score=null and empty arrays if LinkedIn not provided. Each issue includes an inline fix (set project_idea to null).',
      6,
    ),
    hidden_red_flags: HIDDEN_RED_FLAGS_PROPERTY,
    bullet_reviews: BULLET_REVIEWS_PROPERTY,
    challenge_analysis: CHALLENGE_ANALYSIS_PROPERTY,
    ats_critical_missing_keywords: ATS_CRITICAL_MISSING_KEYWORDS_PROPERTY,
    highlight_terms: HIGHLIGHT_TERMS_PROPERTY,
  };

  if (generateBridgeProject) {
    properties.project_recommendation = PROJECT_RECOMMENDATION_PROPERTY;
  }

  return {
    name: 'submit_analysis',
    description:
      'Submit the complete CV-vs-JD analysis in a single pass, generating fields in schema order: job details and overall scores first (the UI renders them immediately), then the diagnostic (ATS estimate, JD match, seniority, technical analysis, tone, per-source audits with inline fixes, red flags), then the actionable content (bullet-by-bullet review, ATS critical keywords, highlight terms, and the bridge-the-gap project recommendation).',
    input_schema: {
      type: 'object' as const,
      properties,
      required: [
        'job_details',
        'overall',
        'keyword_match',
        'experience_level',
        'tech_stack_fit',
        'github_signal',
        'linkedin_signal',
        'ats_simulation',
        'audit_jd_match',
        'seniority_analysis',
        'technical_analysis',
        'cv_tone',
        'audit_cv',
        'audit_github',
        'audit_linkedin',
        'hidden_red_flags',
        'bullet_reviews',
        'ats_critical_missing_keywords',
        'highlight_terms',
        ...(generateBridgeProject ? ['project_recommendation'] : []),
      ],
    },
  };
}
