/**
 * JSON schema Claude must conform to for the negotiation playbook.
 * Anti-hallucination rules are encoded in field descriptions and enforced
 * by the system prompt — `jd_disclosed_salary` is the most sensitive field
 * and MUST be null unless the JD explicitly states a number.
 *
 * Roadmap impact mapping uses the same deterministic IDs the frontend
 * computes in `RoadmapTab.tsx` (cv-{i}, gh-{i}, li-{i}, flag-{i},
 * "seniority", "tone"). The backend builds the candidate list before
 * calling Claude so the model just scores known IDs.
 */

const SALARY_RANGE_SCHEMA = {
  type: 'object' as const,
  required: ['min', 'max', 'currency'],
  properties: {
    min: { type: 'number' as const, minimum: 0 },
    max: { type: 'number' as const, minimum: 0 },
    currency: {
      type: 'string' as const,
      enum: ['EUR', 'USD', 'GBP'] as const,
    },
  },
};

export const SUBMIT_NEGOTIATION_TOOL = {
  name: 'submit_negotiation_analysis',
  description:
    'Submit the full negotiation playbook: market positioning, leverage points, counter-offer email, anchoring strategy, talking points, and per-roadmap-action salary impact. Never invent a JD-specific salary if the job description does not disclose one.',
  input_schema: {
    type: 'object' as const,
    required: [
      'period',
      'market_range',
      'candidate_range',
      'jd_disclosed_salary',
      'gap_vs_market',
      'leverage_points',
      'counter_offer_email',
      'anchoring_strategy',
      'talking_points',
      'roadmap_salary_impact',
      'confidence',
      'disclaimer',
      'sources',
    ],
    properties: {
      period: {
        type: 'string' as const,
        enum: ['annual', 'daily'] as const,
        description:
          'Compensation unit. "daily" for freelance / contract / TJM roles (job_details.contract_type === "freelance"). "annual" for permanent employment (CDI/CDD/full-time). ALL monetary fields below MUST use the SAME period — never mix annual and daily within one response.',
      },
      market_range: {
        ...SALARY_RANGE_SCHEMA,
        description:
          'Estimated GENERAL market range for this role/seniority/location. Always populate. Frame as a market reference, NOT what this specific company pays.',
      },
      candidate_range: {
        ...SALARY_RANGE_SCHEMA,
        description:
          "Estimated salary range the candidate's detected profile (seniority, stack, years of experience) would typically command in this market.",
      },
      jd_disclosed_salary: {
        anyOf: [
          { type: 'null' as const },
          {
            ...SALARY_RANGE_SCHEMA,
            description:
              'EXACT salary explicitly disclosed in the job description text (numeric range, daily rate, or single number).',
          },
        ],
        description:
          'MUST be null UNLESS the JD text contains an explicit numeric salary, daily rate, or compensation range. NEVER infer from "competitive", "DOE", "market rate", company size, funding stage, or seniority alone.',
      },
      gap_vs_market: {
        type: 'number' as const,
        description:
          'EXACTLY (market.min + market.max)/2 - (candidate.min + candidate.max)/2. Compute the medians yourself and subtract. Negative = candidate below market median. Same period unit as the ranges.',
      },
      gap_reason: {
        type: 'string' as const,
        maxLength: 220,
        description:
          'One sentence explaining the gap, citing concrete signals from the analysis (seniority, missing keywords, stack mismatch).',
      },
      how_to_close: {
        type: 'string' as const,
        maxLength: 250,
        description:
          'One actionable sentence on what would move the candidate into the upper market band.',
      },
      leverage_points: {
        type: 'array' as const,
        minItems: 3,
        maxItems: 5,
        description:
          'Concrete leverage points from CV vs JD. Each point MUST cite specific evidence (a quote or close paraphrase). No vague generalities.',
        items: {
          type: 'object' as const,
          required: ['label', 'level', 'evidence'],
          properties: {
            label: { type: 'string' as const, maxLength: 120 },
            level: {
              type: 'string' as const,
              enum: ['high', 'medium', 'watch'] as const,
              description:
                'high = strong upward leverage, medium = supporting, watch = potential downside / reason for cap.',
            },
            evidence: {
              type: 'string' as const,
              maxLength: 220,
              description:
                'Quote or close paraphrase from the CV or JD that backs this point.',
            },
            impact_eur: {
              type: ['number', 'null'] as ['number', 'null'],
              description:
                'Optional € impact estimate for this leverage. Skip (null) if you cannot defend a number.',
            },
          },
        },
      },
      counter_offer_email: {
        type: 'object' as const,
        required: ['subject', 'body', 'anchor_amount'],
        properties: {
          subject: { type: 'string' as const, maxLength: 120 },
          body: {
            type: 'string' as const,
            maxLength: 1800,
            description:
              'Markdown body. MUST personalize at least 3 specific details from the candidate (years of experience, named skills, measurable achievements). No generic templates.',
          },
          anchor_amount: {
            type: 'number' as const,
            description:
              'The € figure to anchor on, in EUR for European roles.',
          },
        },
      },
      anchoring_strategy: {
        type: 'object' as const,
        required: ['when_to_anchor', 'anchor_amount', 'fallback'],
        properties: {
          when_to_anchor: {
            type: 'string' as const,
            maxLength: 180,
            description:
              'When (in the interview process) to introduce the salary anchor.',
          },
          anchor_amount: { type: 'number' as const },
          fallback: {
            type: 'string' as const,
            maxLength: 220,
            description:
              'What to pivot to if the recruiter pushes back on base salary.',
          },
        },
      },
      talking_points: {
        type: 'array' as const,
        minItems: 2,
        maxItems: 5,
        items: {
          type: 'object' as const,
          required: ['scenario', 'phrase'],
          properties: {
            scenario: {
              type: 'string' as const,
              maxLength: 120,
              description:
                'Short label describing when to use this phrase (e.g. "When asked about salary expectations early").',
            },
            phrase: {
              type: 'string' as const,
              maxLength: 480,
              description: 'The actual phrase the candidate can use verbatim.',
            },
          },
        },
      },
      roadmap_salary_impact: {
        type: 'array' as const,
        description:
          'Map roadmap action IDs (provided in the user message) to their estimated € impact. ONLY include entries where you can defend a € range from market premium for that skill/experience. Skip items where the impact is unclear — do not guess.',
        items: {
          type: 'object' as const,
          required: ['roadmap_item_id', 'impact_min', 'impact_max'],
          properties: {
            roadmap_item_id: {
              type: 'string' as const,
              description:
                'Match exactly one of the roadmap_item ids provided in the user message.',
            },
            impact_min: { type: 'number' as const, minimum: 0 },
            impact_max: { type: 'number' as const, minimum: 0 },
            currency: {
              type: 'string' as const,
              enum: ['EUR', 'USD', 'GBP'] as const,
            },
            reasoning: {
              type: 'string' as const,
              maxLength: 200,
              description:
                'Why this roadmap action moves the candidate into a higher market band.',
            },
          },
        },
      },
      confidence: {
        type: 'string' as const,
        enum: ['low', 'medium', 'high'] as const,
        description:
          'Confidence in your estimates given available signals (lower if niche role, sparse CV, or unusual stack).',
      },
      disclaimer: {
        type: 'string' as const,
        maxLength: 220,
        description:
          'Short disclaimer about estimation accuracy and the absence of real-time salary APIs.',
      },
      sources: {
        type: 'array' as const,
        maxItems: 6,
        items: { type: 'string' as const },
        description:
          'Public sources informing the estimate (e.g. Glassdoor, Levels.fyi, LinkedIn Salary, APEC).',
      },
    },
  },
};
