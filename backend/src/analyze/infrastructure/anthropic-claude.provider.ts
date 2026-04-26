import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AnalyzeResponse,
  AnalyzeResponseSchema,
} from '../dto/analyze-response.dto';
import {
  RewriteResponse,
  RewriteResponseSchema,
} from '../dto/rewrite-response.dto';
import type {
  AnalyzeApplicationInput,
  ClaudeProvider,
  GenerateCoverLetterInput,
  RewriteCvInput,
} from '../ports/claude.provider';
import { SUBMIT_ANALYSIS_TOOL } from './schemas/claude-analysis.schema';

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

  async analyzeApplication(
    input: AnalyzeApplicationInput,
  ): Promise<AnalyzeResponse> {
    const technicalPrompt = this.config.get<string>('SYSTEM_TECHNICAL_PROMPT')!;
    this.logger.log('Requesting full analysis from Claude');

    try {
      const msg = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 16000,
        temperature: 0.1,
        system: technicalPrompt,
        tools: [SUBMIT_ANALYSIS_TOOL],
        tool_choice: { type: 'tool', name: 'submit_analysis' },
        messages: [
          {
            role: 'user',
            content: this.buildAnalyzeUserMessage(input),
          },
        ],
      });

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
      const msg = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 8192,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

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
      const response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

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
}
