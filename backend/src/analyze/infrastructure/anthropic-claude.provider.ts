import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import Anthropic from '@anthropic-ai/sdk';
import {
  AnalyzeResponse,
  AnalyzeResponseSchema,
} from '../dto/analyze-response.dto';
import {
  NegotiationAnalysis,
  NegotiationAnalysisSchema,
} from '../dto/negotiation-response.dto';
import {
  RewriteResponse,
  RewriteResponseSchema,
} from '../dto/rewrite-response.dto';
import type {
  AnalyzeApplicationInput,
  ClaudeProvider,
  GenerateCoverLetterInput,
  GenerateNegotiationInput,
  RewriteCvInput,
} from '../ports/claude.provider';
import { SUBMIT_ANALYSIS_TOOL } from './schemas/claude-analysis.schema';
import { SUBMIT_NEGOTIATION_TOOL } from './schemas/claude-negotiation.schema';

const MODEL = 'claude-sonnet-4-6';

type ToolUseBlock = {
  type: 'tool_use';
  input: Record<string, unknown>;
};

@Injectable()
export class AnthropicClaudeProvider implements ClaudeProvider {
  private readonly logger = new Logger(AnthropicClaudeProvider.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  private withSentry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    Sentry.setTag('provider', 'claude');
    return Sentry.startSpan(
      {
        name: `ai.claude.${operation}`,
        op: 'ai',
        attributes: { 'ai.provider': 'claude', 'ai.operation': operation },
      },
      fn,
    );
  }

  private logCacheUsage(
    operation: string,
    usage: {
      cache_creation_input_tokens?: number | null;
      cache_read_input_tokens?: number | null;
      input_tokens?: number;
    },
  ): void {
    const created = usage.cache_creation_input_tokens ?? 0;
    const read = usage.cache_read_input_tokens ?? 0;
    if (created || read) {
      this.logger.debug(
        `Claude ${operation} cache: read=${read} created=${created} input=${usage.input_tokens ?? 0}`,
      );
    }
  }

  async analyzeApplication(
    input: AnalyzeApplicationInput,
  ): Promise<AnalyzeResponse> {
    const technicalPrompt = this.config.get<string>('SYSTEM_TECHNICAL_PROMPT')!;
    this.logger.log('Requesting full analysis from Claude');

    try {
      const msg = await this.withSentry('analyze', async () => {
        const stream = this.anthropic.messages.stream({
          model: MODEL,
          max_tokens: 16000,
          temperature: 0.1,
          system: [
            {
              type: 'text',
              text: technicalPrompt,
              cache_control: { type: 'ephemeral' },
            },
          ],
          tools: [
            { ...SUBMIT_ANALYSIS_TOOL, cache_control: { type: 'ephemeral' } },
          ],
          tool_choice: { type: 'tool', name: 'submit_analysis' },
          messages: [
            {
              role: 'user',
              content: this.buildAnalyzeUserMessage(input),
            },
          ],
        });
        if (input.onDelta) {
          stream.on('inputJson', (partialJson) => input.onDelta!(partialJson));
        }
        return stream.finalMessage();
      });

      this.logCacheUsage('analyze', msg.usage);

      const toolUse = msg.content.find(
        (block) => (block as { type?: string }).type === 'tool_use',
      ) as ToolUseBlock | undefined;

      if (!toolUse) {
        this.logger.error(
          `Claude returned no tool_use block: ${JSON.stringify(msg.content).slice(0, 300)}`,
        );
        throw new InternalServerErrorException('Analysis failed');
      }

      // The shape of toolUse.input mirrors SUBMIT_ANALYSIS_TOOL.input_schema. We
      // remap to the AnalyzeResponse domain shape, then validate via Zod.
      const i = toolUse.input as Record<string, any>;
      const result: AnalyzeResponse = {
        score: i.overall.score,
        verdict: i.overall.verdict,
        confidence: i.overall.confidence,
        breakdown: {
          keyword_match: i.keyword_match,
          tech_stack_fit: i.tech_stack_fit,
          experience_level: i.experience_level,
          github_signal: i.github_signal,
          linkedin_signal: i.linkedin_signal,
        },
        ats_simulation: i.ats_simulation,
        seniority_analysis: i.seniority_analysis,
        cv_tone: i.cv_tone,
        audit: {
          cv: i.audit_cv,
          github: i.audit_github,
          linkedin: i.audit_linkedin,
          jd_match: i.audit_jd_match,
        },
        hidden_red_flags: i.hidden_red_flags,
        correlation: i.correlation,
        job_details: i.job_details,
        technical_analysis: i.technical_analysis,
        project_recommendation: i.project_recommendation,
      };
      return AnalyzeResponseSchema.parse(result);
    } catch (apiErr: any) {
      this.logger.error(
        `Claude analyzeApplication failed: ${apiErr?.message || apiErr}`,
        apiErr?.stack,
      );
      throw new InternalServerErrorException('Analysis failed');
    }
  }

  async rewriteCv(input: RewriteCvInput): Promise<RewriteResponse> {
    const { cvText, result, locale } = input;

    const missingKeywords =
      (
        result.ats_simulation?.critical_missing_keywords as
          | Array<{ keyword: string; sections_missing: string[] }>
          | undefined
      )
        ?.map(
          (k) =>
            `${k.keyword} (missing from: ${k.sections_missing.join(', ')})`,
        )
        ?.join('\n  - ') || 'none';
    const atsScore = result.ats_simulation?.score ?? '?';
    const passiveExamples = result.cv_tone?.examples?.join('\n  - ') || 'none';
    const toneDetected = result.cv_tone?.detected || 'unknown';
    const seniorityGap = result.seniority_analysis?.gap || 'none';
    const seniorityFix = result.seniority_analysis?.fix?.summary || '';
    const cvIssues =
      (
        result.audit?.cv?.issues as
          | Array<{ severity: string; what: string; why: string }>
          | undefined
      )
        ?.map((i) => `[${i.severity.toUpperCase()}] ${i.what} — ${i.why}`)
        ?.join('\n  - ') || 'none';

    const systemPrompt = `Respond entirely in ${locale === 'fr' ? 'French' : 'English'}.

You are an expert CV writer. You receive an original CV and a detailed analysis of its weaknesses. Your job is to rewrite the FULL CV, fixing every issue identified.

Output ONLY the rewritten CV — no preamble, no commentary, no explanation. Start directly with the candidate's name or first section.

Formatting rules (strict Markdown):
- ## for main section headers (e.g. ## EXPERIENCE, ## EDUCATION, ## SKILLS, ## PROFILE)
- ### for sub-entries (job titles, degree names) if needed
- **bold** for job titles, company names, and degree names
- - bullet points for responsibilities and achievements
- Blank line between sections

Rewriting rules:
- Replace passive verbs: "responsible for" → "Led", "worked on" → "Built", "helped with" → "Drove", "assisted" → "Owned"
- Inject missing ATS keywords naturally into existing content — never as a standalone dump
- Add scope and impact language where the analysis flags seniority gaps
- Strengthen ownership: "part of a team that" → "Led a cross-functional team of N to"
- Never fabricate companies, dates, job titles, or specific numbers not present in the original
- Preserve ALL sections from the original CV — do not remove any content`;

    const userMessage = `Rewrite this CV to maximise interview chances. Fix all issues identified in the analysis below.

ATS SCORE: ${atsScore}/100
MISSING KEYWORDS (inject naturally): ${missingKeywords}
TONE (${toneDetected}) — passive examples: ${passiveExamples}
SENIORITY GAP: ${seniorityGap} — Fix: ${seniorityFix}
CV AUDIT ISSUES: ${cvIssues}

ORIGINAL CV:
${cvText}`;

    try {
      const msg = await this.withSentry('rewrite_cv', () =>
        this.anthropic.messages.create({
          model: MODEL,
          max_tokens: 8192,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      );

      const textBlock = msg.content.find((b) => b.type === 'text') as
        | { type: 'text'; text: string }
        | undefined;
      const reconstructed_cv = textBlock?.text?.trim() ?? '';
      this.logger.log(`rewriteCv returned ${reconstructed_cv.length} chars`);

      if (!reconstructed_cv) {
        throw new InternalServerErrorException('Claude returned empty CV');
      }

      return RewriteResponseSchema.parse({ reconstructed_cv });
    } catch (err: any) {
      this.logger.error(`rewriteCv failed: ${err?.message || err}`, err?.stack);
      throw new InternalServerErrorException('CV rewrite failed');
    }
  }

  async generateCoverLetter(input: GenerateCoverLetterInput): Promise<string> {
    const langLabel: Record<string, string> = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
    };
    const langName = langLabel[input.language] ?? input.language;

    const skills = input.result.technical_analysis?.skills as
      | Array<{ name: string; current: number; expected: number }>
      | undefined;
    const matchedSkills =
      skills
        ?.filter((s) => s.current >= s.expected)
        .map((s) => s.name)
        .slice(0, 5)
        .join(', ') ?? '';

    const issues = input.result.audit?.cv?.issues as
      | Array<{ what: string }>
      | undefined;
    const mainGaps = issues
      ?.slice(0, 2)
      .map((i) => i.what)
      .join(', ');

    const missingKeywords = (
      input.result.ats_simulation?.critical_missing_keywords as
        | Array<{ keyword: string }>
        | undefined
    )
      ?.slice(0, 3)
      .map((k) => k.keyword)
      .join(', ');

    const systemPrompt = `You are an expert career coach writing cover letters for software developers.
Write in ${langName}.

Tone and format rules (strictly enforced):
- Written in first person (I, me, my) at all times — never refer to the candidate by name or in third person
- Open with something specific to this company or role — not a generic statement of fit, not a greeting
- 3 to 4 paragraphs, maximum 350 words
- No markdown headings or titles, only plain paragraphs
- ABSOLUTE RULE: zero dashes of any kind anywhere in the output. This means no hyphen (-), no en dash (–), no em dash (—). If you feel the urge to use a dash, rewrite the sentence instead.
- No corporate jargon: words that belong in a PowerPoint deck, not a human sentence (e.g. synergy, leverage, deliverable, stakeholder — and their equivalents in ${langName})
- No filler openers: do not start with enthusiasm declarations or statements about why you are writing
- No AI-sounding constructions: avoid adverbs that inflate without adding meaning (seamlessly, rigorously, consistently), adjectives that are claims not facts (robust, innovative, disciplined), and transition phrases that signal a model hedging (that said, it is worth noting, needless to say, at the end of the day)
- No disguised lists: do not use parentheses to pack in multiple items — if something is worth saying, say it in a sentence
- No CV narration: do not open a sentence by labelling your own experience ("My background in X", "Throughout my career", "Across my roles")
- Write like a smart person sending an email, not like a model completing a task. If a sentence would look at home in a corporate template, rewrite it.

Content rules:
- Open with something concrete and specific: a detail from the JD, something about the company's product or problem, or a direct claim grounded in a real achievement
- Connect the candidate's actual experience to the specific requirements and keywords in the JD — mirror the JD's language where truthful
- Highlight 2 to 3 strongest matching skills through specific examples, not claims
- Address the top 1 to 2 gaps briefly and matter-of-factly, without apologising or over-explaining
- NEVER invent or assume any fact not explicitly present in the candidate analysis data provided below. This includes company names, job titles, project names, metrics, technologies, and dates. If a detail is not in the data, do not include it.
- End with one direct sentence — a specific ask or next step, not a pleasantry`;

    const userMessage = `Write a cover letter for this application.

Job Description:
${input.jobDescription}

Candidate CV (source of truth — only reference facts explicitly present here):
${input.cvText ?? 'not available'}

${input.linkedinText ? `Candidate LinkedIn profile:\n${input.linkedinText}\n` : ''}${input.githubInfo ? `Candidate GitHub activity:\n${input.githubInfo}\n` : ''}
Analysis summary (use to guide emphasis, never invent beyond what the documents above confirm):
- Key strengths: ${(input.result.audit?.cv?.strengths as string[] | undefined)?.join(', ')}
- Main gaps: ${mainGaps}
- Seniority detected: ${input.result.seniority_analysis?.detected}
- Matched tech skills: ${matchedSkills}
- Keywords to include if genuinely present in CV: ${missingKeywords}

Role: ${input.jobLabel || 'the position'}
Company: ${input.company || 'the company'}
Candidate name (for signing only): ${input.candidateName || 'not provided'}
Language: ${langName}`;

    try {
      const response = await this.withSentry('cover_letter', () =>
        this.anthropic.messages.create({
          model: MODEL,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      );

      const content = response.content[0];
      if (!content) {
        throw new InternalServerErrorException(
          'Claude returned empty response',
        );
      }
      return content.type === 'text' ? content.text : '';
    } catch (err: any) {
      this.logger.error(
        `generateCoverLetter failed: ${err?.message || err}`,
        err?.stack,
      );
      throw new InternalServerErrorException('Cover letter generation failed');
    }
  }

  private buildAnalyzeUserMessage(input: AnalyzeApplicationInput): string {
    return `Respond entirely in ${input.locale === 'fr' ? 'French' : 'English'}.

Perform a complete application analysis.

JOB DESCRIPTION:
${input.jobText}

---

CANDIDATE EVIDENCE:
CV / RESUME:
${input.cvText}

GITHUB PROJECTS: ${input.githubInfo || 'None provided'}
LINKEDIN SKILLS: ${input.linkedinText || 'None provided'}
MOTIVATION LETTER: ${input.motivationLetterText || 'None provided'}

Formatting rules:
- Use **markdown** in all text fields (reasoning, recommendation, market_context, skill evidence, seniority_signals): bold key terms, italics for nuance, short bullet lists where helpful.
- In skill_priority, list the exact 5 skill names from most to least critical for this specific job.`;
  }

  async generateNegotiation(
    input: GenerateNegotiationInput,
  ): Promise<NegotiationAnalysis> {
    this.logger.log('Requesting negotiation playbook from Claude');

    try {
      const msg = await this.withSentry('negotiation', async () => {
        const stream = this.anthropic.messages.stream({
          model: MODEL,
          max_tokens: 4000,
          temperature: 0.3,
          system: [
            {
              type: 'text',
              text: NEGOTIATION_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
          ],
          tools: [
            {
              ...SUBMIT_NEGOTIATION_TOOL,
              cache_control: { type: 'ephemeral' },
            },
          ],
          tool_choice: { type: 'tool', name: 'submit_negotiation_analysis' },
          messages: [
            { role: 'user', content: this.buildNegotiationUserMessage(input) },
          ],
        });
        if (input.onDelta) {
          stream.on('inputJson', (partialJson) => input.onDelta!(partialJson));
        }
        return stream.finalMessage();
      });

      this.logCacheUsage('negotiation', msg.usage);

      const toolUse = msg.content.find(
        (block) => (block as { type?: string }).type === 'tool_use',
      ) as ToolUseBlock | undefined;

      if (!toolUse) {
        this.logger.error(
          `Claude returned no tool_use for negotiation: ${JSON.stringify(msg.content).slice(0, 300)}`,
        );
        throw new InternalServerErrorException('Negotiation generation failed');
      }

      const parsed = NegotiationAnalysisSchema.parse(toolUse.input);

      // Defensive: recompute gap_vs_market from medians so Claude can't drift.
      const marketMedian =
        (parsed.market_range.min + parsed.market_range.max) / 2;
      const candMedian =
        (parsed.candidate_range.min + parsed.candidate_range.max) / 2;
      parsed.gap_vs_market = Math.round(marketMedian - candMedian);

      // Defensive: detect period/magnitude mismatch — daily amounts >5k or annual <10k
      // are almost certainly the wrong unit. We log; the FE displays Claude's choice.
      const maxAmount = Math.max(
        parsed.market_range.max,
        parsed.candidate_range.max,
      );
      if (parsed.period === 'daily' && maxAmount > 5000) {
        this.logger.warn(
          `Negotiation period=daily but max amount is ${maxAmount} — likely a unit mistake by the model.`,
        );
      }
      if (parsed.period === 'annual' && maxAmount < 10000) {
        this.logger.warn(
          `Negotiation period=annual but max amount is ${maxAmount} — likely a unit mistake by the model.`,
        );
      }

      return parsed;
    } catch (err: any) {
      this.logger.error(
        `generateNegotiation failed: ${err?.message || err}`,
        err?.stack,
      );
      throw new InternalServerErrorException('Negotiation generation failed');
    }
  }

  private buildNegotiationUserMessage(input: GenerateNegotiationInput): string {
    const { result, roadmapItems, jobText, locale } = input;
    const jd = result.job_details;
    const seniority = result.seniority_analysis;
    const techStack =
      result.technical_analysis?.skill_priority?.slice(0, 5).join(', ') ||
      result.technical_analysis?.skills?.map((s) => s.name).join(', ') ||
      'unknown';

    const roadmapList = roadmapItems
      .map(
        (item) =>
          `- id: "${item.id}" (${item.severity}, ${item.source}): ${item.what.slice(0, 220)}`,
      )
      .join('\n');

    return `Respond entirely in ${locale === 'fr' ? 'French' : 'English'} for textual fields. Use EUR by default for European roles.

Build the negotiation playbook for this candidate / job pairing.

=== FULL JOB DESCRIPTION (scan for any disclosed salary number, daily rate, or compensation range) ===
${jobText.slice(0, 8000)}

=== EXTRACTED ANALYSIS CONTEXT ===
- Job title: ${jd.title}
- Company: ${jd.company}
- Location: ${jd.office_location || 'not specified'}  ⚠ DRIVES CURRENCY: US/USA → USD, UK → GBP, EU/France/etc → EUR (default for ambiguous EU)
- Work setting: ${jd.work_setting || 'not specified'}
- Contract type: ${jd.contract_type || 'not specified'}  ⚠ DRIVES PERIOD: "freelance" → period="daily", everything else → period="annual"
- Role seniority expected: ${seniority.expected}
- Candidate seniority detected: ${seniority.detected}
- Seniority gap: ${seniority.gap}
- Years of experience required: ${jd.years_of_experience || 'not specified'}
- Tech stack (top priorities): ${techStack}
- Existing JD pay field (raw): ${jd.pay ?? 'null'}

=== ROADMAP ITEMS AVAILABLE FOR SALARY-IMPACT MAPPING ===
${roadmapList || '(no roadmap items)'}

Use these EXACT ids in roadmap_salary_impact[].roadmap_item_id. Skip any item where you cannot defend a € range — empty mapping is better than guessed numbers.

=== DELIVERABLE ===
1. market_range — your estimate of the GENERAL market for this role/seniority/location.
2. candidate_range — what this detected profile would typically command.
3. jd_disclosed_salary — null UNLESS the JD text above contains an explicit numeric salary, daily rate, or compensation range. Never infer from "competitive", "DOE", or seniority alone.
4. leverage_points — 3 to 5 points, each MUST cite a quote or close paraphrase from the CV/JD.
5. counter_offer_email — must personalize at least 3 specific details (years of experience, named skills, measurable achievements) from the candidate.
6. anchoring_strategy — when to anchor, the figure to anchor on, and a fallback if pushed back.
7. talking_points — 2 to 5 ready-to-use phrases, each tied to a scenario.
8. roadmap_salary_impact — score only the roadmap ids you can defend numerically.
9. confidence, disclaimer, sources.`;
  }
}

const NEGOTIATION_SYSTEM_PROMPT = `You are a senior compensation and negotiation coach for tech roles in Europe. You produce: market positioning, leverage points, counter-offer emails, anchoring strategy, talking points, and salary-impact estimates per roadmap action.

CRITICAL RULES:
1. **PERIOD UNIT — ABSOLUTE CONSISTENCY**:
   - Set \`period\` to "daily" if job_details.contract_type === "freelance" or the JD describes a contract/mission/TJM. Otherwise "annual".
   - ALL monetary fields below MUST use the SAME period:
     • market_range, candidate_range, jd_disclosed_salary
     • counter_offer_email.anchor_amount
     • anchoring_strategy.anchor_amount
     • leverage_points[].impact_eur
     • roadmap_salary_impact[].impact_min/max
   - Daily example (freelance): market_range = { min: 400, max: 650, currency: "EUR" }, period = "daily" → readers see "€400-650/day".
   - Annual example (CDI): market_range = { min: 55000, max: 75000, currency: "EUR" }, period = "annual" → readers see "€55,000-75,000/year".
   - NEVER mix: if period="daily", market.min cannot be 55000.
2. \`jd_disclosed_salary\` MUST be null UNLESS the job description text contains an explicit numeric salary, daily rate, or compensation range. NEVER infer from "competitive", "DOE", "market rate", company size, funding stage, or seniority alone.
3. \`market_range\` is YOUR estimate of the GENERAL market for this role/seniority/location — frame it as a market reference, NOT what this specific company pays.
4. \`candidate_range\` is YOUR estimate of what the detected profile would typically command — base it on seniority, stack, and years of experience.
5. \`gap_vs_market\` MUST equal exactly (market.min + market.max)/2 - (candidate.min + candidate.max)/2. Compute the medians and subtract. Verify the arithmetic before submitting.
6. Every leverage_point MUST cite specific evidence from the CV or JD (a quote or close paraphrase). No vague generalities like "you have great experience".
7. The counter_offer_email body MUST personalize at least 3 specific details from the candidate (years of experience, named skills, measurable achievements). The anchor_amount must match the period unit (e.g. for freelance, "€450" means €450/day; the email body should say "€450/day").
8. Every textual reference to a € figure in counter_offer_email.body, anchoring_strategy, and talking_points MUST include the period suffix ("/day" or "/year") explicitly.
9. roadmap_salary_impact entries — fill ONLY ids you can defend with a € range based on real market premium for that skill/experience. Skip items where you'd be guessing. Empty array is acceptable. impact_min/max use the same period and currency as everything else.
10. **CURRENCY — ABSOLUTE CONSISTENCY**:
    - Detect currency from job_details.office_location and JD content:
      • USD: United States / US / USA, any US city (NYC, SF, LA, Austin, Seattle, Boston, Chicago...), "$" symbols in JD, US-headquartered companies hiring US-only
      • GBP: United Kingdom / UK / Britain, London / Manchester / Edinburgh, "£" symbols in JD
      • EUR: France, Germany, Netherlands, Spain, Italy, Ireland, Belgium, Portugal, EU country, "€" symbols, any EU city — DEFAULT for European roles
    - For ambiguous remote roles, prefer the company's apparent home market (US company → USD, EU company → EUR). If still unclear, default to EUR.
    - Estimate market_range and candidate_range DIRECTLY in the local currency — do NOT compute in EUR and convert. US senior backend = "$130,000–180,000/year" not "€120,000/year converted".
    - ALL monetary fields (market, candidate, jd_disclosed, anchor amounts, leverage impact, roadmap impact) must use the SAME currency.
    - In counter_offer_email.body, anchoring_strategy, and talking_points, every numeric mention must include the currency symbol matching the chosen currency ($/£/€) — never mix.
11. The disclaimer must mention that estimates are based on public market data and are not guarantees.`;
