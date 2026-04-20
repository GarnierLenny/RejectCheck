import {
  Injectable,
  UnprocessableEntityException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFParse } from 'pdf-parse';
import {
  AnalyzeResponseSchema,
  AnalyzeResponse,
} from './dto/analyze-response.dto';
import {
  RewriteResponse,
  RewriteResponseSchema,
} from './dto/rewrite-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { Prisma } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const MAX_TEXT_CHARS = 12000;

@Injectable()
export class AnalyzeService {
  private anthropic: Anthropic;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const parser = new PDFParse({ data: buffer });
      try {
        const parsed = await parser.getText();
        const text = parsed.text
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, MAX_TEXT_CHARS);
        if (!text) throw new Error('Empty PDF');
        return text;
      } finally {
        await parser.destroy();
      }
    } catch (err) {
      throw new UnprocessableEntityException(
        'Failed to parse PDF. Make sure it is a valid, text-based PDF.',
      );
    }
  }

  private async fetchGithubData(username: string) {
    try {
      const headers = { 'User-Agent': 'RejectCheck-App' };
      const encodedUsername = encodeURIComponent(username);
      const profileRes = await fetch(
        `https://api.github.com/users/${encodedUsername}`,
        { headers },
      );
      if (!profileRes.ok) return null;
      const profile = await profileRes.json();

      const reposRes = await fetch(
        `https://api.github.com/users/${encodedUsername}/repos?sort=updated&per_page=10`,
        { headers },
      );
      const repos = reposRes.ok ? await reposRes.json() : [];

      return {
        bio: profile.bio,
        public_repos: profile.public_repos,
        followers: profile.followers,
        top_repos: repos.map((r: any) => ({
          name: r.name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
        })),
      };
    } catch (e) {
      console.error('GitHub API error:', e);
      return null;
    }
  }

  private async getTechnicalAnalysisWithClaude(data: {
    jobText: string;
    cvText: string;
    githubInfo: string;
    linkedinText: string;
    motivationLetterText: string;
    locale?: string;
  }): Promise<AnalyzeResponse> {
    const { jobText, cvText, githubInfo, linkedinText, motivationLetterText, locale } = data;
    const technicalPrompt = this.configService.get<string>('SYSTEM_TECHNICAL_PROMPT')!;

    console.log(`[AnalyzeService] Requesting full analysis from Claude...`);

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
                endpoints: { type: 'array' as const, items: { type: 'string' as const } },
                bonus: { anyOf: [{ type: 'null' as const }, { type: 'string' as const }] },
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
        severity: { type: 'string' as const, enum: ['critical', 'major', 'minor'] },
        category: {
          type: 'string' as const,
          enum: ['keywords', 'impact', 'seniority', 'stack', 'format', 'tone', 'consistency'],
        },
        what: { type: 'string' as const },
        why: { type: 'string' as const },
        fix: FIX_SCHEMA,
      },
      required: ['severity', 'category', 'what', 'why', 'fix'],
    };

    const AUDIT_SCHEMA = (description: string) => ({
      type: 'object' as const,
      description,
      properties: {
        score: { type: ['number', 'null'] as any, minimum: 0, maximum: 100 },
        strengths: { type: 'array' as const, items: { type: 'string' as const } },
        issues: { type: 'array' as const, items: ISSUE_SCHEMA },
      },
      required: ['score', 'issues', 'strengths'],
    });

    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        temperature: 0.1,
        system: technicalPrompt,
        tools: [
          {
            name: 'submit_analysis',
            description: 'Submit the completed full application analysis as structured data.',
            input_schema: {
              type: 'object' as const,
              properties: {
                technical_analysis: {
                  type: 'object' as const,
                  properties: {
                    reasoning: { type: 'string' as const },
                    skill_priority: {
                      type: 'array' as const,
                      description: 'The 5 skill names ordered from most to least critical for THIS specific job',
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
                    seniority_signals: { type: 'array' as const, items: { type: 'string' as const } },
                  },
                  required: ['reasoning', 'skill_priority', 'skills', 'recommendation', 'market_context', 'seniority_signals'],
                },
                project_recommendation: {
                  type: 'object' as const,
                  properties: {
                    name: { type: 'string' as const },
                    description: { type: 'string' as const },
                    technologies: { type: 'array' as const, items: { type: 'string' as const } },
                    key_features: { type: 'array' as const, items: { type: 'string' as const } },
                    architecture: { type: 'string' as const },
                    advanced_concepts: { type: 'array' as const, items: { type: 'string' as const } },
                    success_criteria: { type: 'array' as const, items: { type: 'string' as const } },
                    difficulty_level: { type: 'string' as const, enum: ['Intermediate', 'Advanced', 'Expert'] },
                    why_it_matters: { type: 'string' as const },
                    what_matters: { type: 'array' as const, items: { type: 'string' as const } },
                  },
                  required: ['name', 'description', 'technologies', 'key_features', 'architecture', 'advanced_concepts', 'success_criteria', 'difficulty_level', 'why_it_matters', 'what_matters'],
                },
                overall: {
                  type: 'object' as const,
                  description: 'Holistic overall rejection risk assessment combining all signals',
                  properties: {
                    score: { type: 'number' as const, minimum: 0, maximum: 100, description: 'Overall rejection risk: 0=strong match (low risk), 100=very weak match (high risk)' },
                    verdict: { type: 'string' as const, enum: ['Low', 'Medium', 'High'], description: 'Low=strong candidate, Medium=partial match, High=weak match' },
                    confidence: {
                      type: 'object' as const,
                      properties: {
                        score: { type: 'number' as const, minimum: 0, maximum: 100 },
                        reason: { type: 'string' as const, description: 'One sentence explaining the confidence level' },
                      },
                      required: ['score', 'reason'],
                    },
                  },
                  required: ['score', 'verdict', 'confidence'],
                },
                keyword_match: { type: 'number' as const, description: '0-100: presence and density of key JD keywords in the CV.' },
                experience_level: { type: 'number' as const, description: '0-100: candidate seniority vs JD requirements.' },
                tech_stack_fit: { type: 'number' as const, description: "0-100: how well the candidate's tech stack matches the JD." },
                github_signal: { type: ['number', 'null'] as any, description: 'GitHub profile strength 0-100, null if not provided.' },
                linkedin_signal: { type: ['number', 'null'] as any, description: 'LinkedIn profile strength 0-100, null if not provided.' },
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
                          sections_missing: { type: 'array' as const, items: { type: 'string' as const } },
                          score_impact: { type: 'number' as const },
                        },
                        required: ['keyword', 'jd_frequency', 'required', 'sections_missing', 'score_impact'],
                      },
                    },
                  },
                  required: ['would_pass', 'score', 'threshold', 'reason', 'critical_missing_keywords'],
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
                    detected: { type: 'string' as const, enum: ['passive', 'active', 'mixed'] },
                    examples: { type: 'array' as const, items: { type: 'string' as const } },
                    fix: FIX_SCHEMA,
                  },
                  required: ['detected', 'examples', 'fix'],
                },
                audit_cv: AUDIT_SCHEMA('CV structure, content and positioning audit.'),
                audit_github: AUDIT_SCHEMA('GitHub profile audit. score=null and empty arrays if GitHub not provided.'),
                audit_linkedin: AUDIT_SCHEMA('LinkedIn profile audit. score=null and empty arrays if LinkedIn not provided.'),
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
                          evidence: { anyOf: [{ type: 'null' as const }, { type: 'string' as const }] },
                        },
                        required: ['skill', 'found', 'evidence'],
                      },
                    },
                    experience_gap: { anyOf: [{ type: 'null' as const }, { type: 'string' as const }] },
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
                      description: 'Role type only, no seniority. E.g. "Front-End Developer", "Back-End Developer", "Full-Stack Developer", "DevOps Engineer", "Mobile Developer", "ML Engineer", "Data Engineer", "Security Engineer", "Software Engineer". Never return "Developer" alone or "N/A".',
                    },
                    company: {
                      type: 'string' as const,
                      description: 'Company name from the job description. Use "Unknown Company" if not found. Never return an empty string or "N/A".',
                    },
                    seniority: {
                      type: 'string' as const,
                      enum: ['junior', 'junior-mid', 'mid', 'mid-senior', 'senior', 'not-mentioned'],
                      description: 'Seniority level targeted by the JD. Use "not-mentioned" if absent.',
                    },
                    pay: {
                      anyOf: [{ type: 'string' as const }, { type: 'null' as const }],
                      description: 'Salary or daily rate as a free string (e.g. "45-55k€", "TJM 600€"). null if not mentioned.',
                    },
                    office_location: {
                      anyOf: [{ type: 'string' as const }, { type: 'null' as const }],
                      description: 'City or address (e.g. "Paris 8e", "Lyon"). null if fully remote or not mentioned.',
                    },
                    work_setting: {
                      type: 'string' as const,
                      enum: ['full-remote', 'on-site', 'hybrid', 'not-mentioned'],
                      description: 'Remote/office policy.',
                    },
                    contract_type: {
                      type: 'string' as const,
                      enum: ['CDI', 'CDD', 'freelance', 'internship', 'apprenticeship', 'not-mentioned'],
                      description: 'Type of contract.',
                    },
                    languages_required: {
                      type: 'string' as const,
                      enum: ['french-only', 'english-only', 'bilingual', 'not-mentioned'],
                      description: '"bilingual" = both French and English explicitly required.',
                    },
                    years_of_experience: {
                      anyOf: [{ type: 'string' as const }, { type: 'null' as const }],
                      description: 'Years of experience explicitly required (e.g. "3-5 ans", "2+ years"). null if not mentioned.',
                    },
                    company_stage: {
                      type: 'string' as const,
                      enum: ['startup', 'scale-up', 'sme', 'enterprise', 'not-mentioned'],
                      description: 'Company stage inferred from headcount, funding, or brand recognition.',
                    },
                    jd_language: {
                      type: 'string' as const,
                      description: 'ISO 639-1 language code of the job description text (e.g. "en", "fr", "de", "es"). Detect from the JD content.',
                    },
                  },
                  required: ['title', 'company', 'seniority', 'pay', 'office_location', 'work_setting', 'contract_type', 'languages_required', 'years_of_experience', 'company_stage', 'jd_language'],
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
          },
        ],
        tool_choice: { type: 'tool', name: 'submit_analysis' },
        messages: [
          {
            role: 'user',
            content: `Respond entirely in ${locale === 'fr' ? 'French' : 'English'}.

Perform a complete application analysis.

JOB DESCRIPTION:
${jobText}

---

CANDIDATE EVIDENCE:
CV / RESUME:
${cvText}

GITHUB PROJECTS: ${githubInfo || 'None provided'}
LINKEDIN SKILLS: ${linkedinText || 'None provided'}
MOTIVATION LETTER: ${motivationLetterText || 'None provided'}

Formatting rules:
- Use **markdown** in all text fields (reasoning, recommendation, market_context, skill evidence, seniority_signals): bold key terms, italics for nuance, short bullet lists where helpful.
- In skill_priority, list the exact 5 skill names from most to least critical for this specific job.`,
          },
        ],
      });

      const toolUse = msg.content.find((block: any) => block.type === 'tool_use');
      if (!toolUse || (toolUse as any).type !== 'tool_use') {
        console.error('[Claude] No tool_use block in response:', JSON.stringify(msg.content).slice(0, 300));
        throw new InternalServerErrorException('Analysis failed');
      }

      const i = (toolUse as any).input;
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
      console.error('[Claude] API call failed:', apiErr?.message || apiErr);
      throw new InternalServerErrorException('Analysis failed');
    }
  }


  async analyzeApplication(
    data: {
      cvBuffer?: Buffer;
      jobDescription: string;
      linkedinBuffer?: Buffer;
      motivationLetterBuffer?: Buffer;
      motivationLetterText?: string;
      githubUsername?: string;
      locale?: string;
    },
    onStep?: (step: string) => void,
  ): Promise<{
    result: AnalyzeResponse;
    cvText: string;
    linkedinText: string;
    githubInfo: string;
    motivationLetterText: string;
  }> {
    const {
      cvBuffer,
      jobDescription,
      linkedinBuffer,
      motivationLetterBuffer,
      motivationLetterText: mlText,
      githubUsername,
      locale,
    } = data;

    if (!cvBuffer) {
      throw new BadRequestException('CV is required');
    }

    onStep?.('parsing_cv');
    const jobText = jobDescription.trim().slice(0, 8000);
    const cvText = await this.parsePdf(cvBuffer);

    onStep?.('matching_skills');
    let linkedinText = '';
    if (linkedinBuffer) {
      try {
        linkedinText = await this.parsePdf(linkedinBuffer);
      } catch {
        console.warn('Failed to parse LinkedIn PDF');
      }
    }

    let motivationLetterText = '';
    if (mlText) {
      motivationLetterText = mlText.trim().slice(0, MAX_TEXT_CHARS);
    } else if (motivationLetterBuffer) {
      onStep?.('parsing_motivation_letter');
      try {
        motivationLetterText = await this.parsePdf(motivationLetterBuffer);
      } catch {
        console.warn('Failed to parse Motivation Letter PDF');
      }
    }

    let githubInfo = '';
    if (githubUsername) {
      onStep?.('analyzing_github');
      const ghData = await this.fetchGithubData(githubUsername);
      if (ghData) {
        githubInfo = JSON.stringify(ghData, null, 2);
      }
    }


    onStep?.('dual_ai_analysis');

    const result = await this.getTechnicalAnalysisWithClaude({
      jobText,
      cvText,
      githubInfo,
      linkedinText,
      motivationLetterText,
      locale,
    });
    return { result, cvText, linkedinText, githubInfo, motivationLetterText };
  }

  async checkUsageLimit(
    email?: string,
    ip?: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 1. Check if email has a paid subscription
    if (email) {
      const hasSub = await this.stripeService.checkSubscription(email);
      if (hasSub) return { allowed: true };
    }

    // 2. Check usage count by email
    if (email) {
      const count = await (this.prisma as any).analysis.count({
        where: { email },
      });
      if (count >= 1) return { allowed: false, reason: 'limit_reached' };
    }

    // 3. Check usage count by IP
    if (ip) {
      const count = await (this.prisma as any).analysis.count({
        where: { ip },
      });
      if (count >= 1) return { allowed: false, reason: 'limit_reached' };
    }

    return { allowed: true };
  }

  async saveAnalysis(data: {
    email?: string;
    ip?: string;
    jobDescription: string;
    jobLabel?: string;
    cvText?: string;
    linkedinText?: string;
    githubInfo?: string;
    motivationLetter?: string;
    result: any;
    isRegistered: boolean;
  }): Promise<{ id: number | null }> {
    const {
      email,
      ip,
      jobDescription,
      jobLabel,
      cvText,
      linkedinText,
      githubInfo,
      motivationLetter,
      result,
      isRegistered,
    } = data;

    // Use user-provided label, or fall back to AI-extracted job title
    const resolvedLabel = jobLabel?.trim() || result.job_details?.title || null;
    const resolvedCompany = result.job_details?.company?.trim() || 'Unknown Company';
    const jd = result.job_details ?? {};
    const notMentioned = (v: string | null | undefined) => (v === 'not-mentioned' ? null : (v ?? null));
    const jobMeta = {
      seniority:          notMentioned(jd.seniority),
      pay:                jd.pay ?? null,
      officeLocation:     jd.office_location ?? null,
      workSetting:        notMentioned(jd.work_setting),
      contractType:       notMentioned(jd.contract_type),
      languagesRequired:  notMentioned(jd.languages_required),
      yearsOfExperience:  jd.years_of_experience ?? null,
      companyStage:       notMentioned(jd.company_stage),
    };

    if (isRegistered && email) {
      // Registered User: Store everything
      const created = await (this.prisma as any).analysis.create({
        data: {
          email,
          ip: ip ?? null,
          jobDescription,
          jobLabel: resolvedLabel,
          company: resolvedCompany,
          jdLanguage: result.job_details?.jd_language ?? 'en',
          cvText: cvText ?? null,
          linkedinText: linkedinText ?? null,
          githubInfo: githubInfo ?? null,
          motivationLetter: motivationLetter ?? null,
          result: result,
        },
      });
      await (this.prisma as any).application.upsert({
        where: {
          email_jobTitle_company: {
            email,
            jobTitle: resolvedLabel || 'Unknown',
            company: resolvedCompany,
          },
        },
        update: {
          analysisId: created.id,
          updatedAt: new Date(),
          ...jobMeta,
        },
        create: {
          email,
          jobTitle: resolvedLabel || 'Unknown',
          company: resolvedCompany,
          status: 'applied',
          appliedAt: new Date(),
          analysisId: created.id,
          ...jobMeta,
        },
      });

      return { id: created.id };
    } else {
      // Anonymous User: Store ONLY IP and createdAt (by default)
      // We explicitly null out email and jobDescription as requested
      await (this.prisma as any).analysis.create({
        data: {
          ip: ip ?? null,
          email: null,
          jobDescription: null,
          // We omit 'result' to keep it as DB null
        },
      });
      return { id: null };
    }
  }

  async saveRewrite(
    analysisId: number,
    email: string,
    rewriteResult: RewriteResponse,
  ): Promise<void> {
    const analysis = await (this.prisma as any).analysis.findFirst({
      where: { id: analysisId, email },
    });
    if (!analysis || !analysis.result) return;
    const updatedResult = {
      ...analysis.result,
      rewrite: rewriteResult,
    };
    await (this.prisma as any).analysis.update({
      where: { id: analysisId },
      data: { result: updatedResult },
    });
  }

  async checkPremium(email: string): Promise<boolean> {
    return this.stripeService.checkSubscription(email);
  }

  async checkHiredPlan(email: string): Promise<boolean> {
    return this.stripeService.checkHiredPlan(email);
  }

  async rewriteCv(
    analysisId: number,
    email: string,
    locale = 'en',
  ): Promise<RewriteResponse> {
    const analysis = await (this.prisma as any).analysis.findFirst({
      where: { id: analysisId, email, result: { not: Prisma.DbNull } },
    });

    if (!analysis) throw new BadRequestException('Analysis not found');
    if (!analysis.cvText)
      throw new BadRequestException('CV text not available for this analysis');

    const result = analysis.result;

    // Build rich context from the existing analysis findings
    const missingKeywords =
      result.ats_simulation?.critical_missing_keywords
        ?.map(
          (k: any) =>
            `${k.keyword} (missing from: ${(k.sections_missing as string[]).join(', ')})`,
        )
        ?.join('\n  - ') || 'none';

    const atsScore = result.ats_simulation?.score ?? '?';
    const passiveExamples = result.cv_tone?.examples?.join('\n  - ') || 'none';
    const toneDetected = result.cv_tone?.detected || 'unknown';
    const seniorityGap = result.seniority_analysis?.gap || 'none';
    const seniorityFix = result.seniority_analysis?.fix?.summary || '';
    const cvIssues =
      result.audit?.cv?.issues
        ?.map((i: any) => `[${i.severity.toUpperCase()}] ${i.what} — ${i.why}`)
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
${analysis.cvText}`;

    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const reconstructed_cv =
        (msg.content.find((b) => b.type === 'text') as any)?.text?.trim() ?? '';
      console.log(`[Claude] rewriteCv returned ${reconstructed_cv.length} chars`);

      if (!reconstructed_cv)
        throw new InternalServerErrorException('Claude returned empty CV');

      return RewriteResponseSchema.parse({ reconstructed_cv });
    } catch (err: any) {
      console.error('[Claude] rewriteCv failed:', err?.message || err);
      throw new InternalServerErrorException('CV rewrite failed');
    }
  }

  async generateCoverLetter(
    email: string,
    analysisId: number,
    language: string,
  ): Promise<{ coverLetter: string; detectedLanguage: string }> {
    const analysis = await (this.prisma as any).analysis.findFirst({
      where: { id: analysisId, email },
    });
    if (!analysis || !analysis.result) {
      throw new BadRequestException('Analysis not found');
    }

    if (!analysis.jobDescription) throw new BadRequestException('Job description not available for this analysis');

    const profile = await (this.prisma as any).profile.findUnique({ where: { email } });
    const candidateName = profile?.coverLetterName || profile?.displayName || null;

    const result = analysis.result as any;
    const jd = analysis.jobDescription;
    const detectedLang = language === 'auto'
      ? (analysis.jdLanguage ?? 'en')
      : language;

    const langLabel: Record<string, string> = {
      en: 'English', fr: 'French', es: 'Spanish', de: 'German',
    };
    const langName = langLabel[detectedLang] ?? detectedLang;

    let response: Awaited<ReturnType<typeof this.anthropic.messages.create>>;
    try {
      response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
      system: `You are an expert career coach writing cover letters for software developers.
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
- End with one direct sentence — a specific ask or next step, not a pleasantry`,
      messages: [
        {
          role: 'user',
          content: `Write a cover letter for this application.

Job Description:
${jd}

Candidate CV (source of truth — only reference facts explicitly present here):
${analysis.cvText ?? 'not available'}

${analysis.linkedinText ? `Candidate LinkedIn profile:\n${analysis.linkedinText}\n` : ''}${analysis.githubInfo ? `Candidate GitHub activity:\n${analysis.githubInfo}\n` : ''}
Analysis summary (use to guide emphasis, never invent beyond what the documents above confirm):
- Key strengths: ${result.audit?.cv?.strengths?.join(', ')}
- Main gaps: ${result.audit?.cv?.issues?.slice(0, 2).map((i: any) => i.what).join(', ')}
- Seniority detected: ${result.seniority_analysis?.detected}
- Matched tech skills: ${result.technical_analysis?.skills?.filter((s: any) => s.current >= s.expected).map((s: any) => s.name).slice(0, 5).join(', ')}
- Keywords to include if genuinely present in CV: ${result.ats_simulation?.critical_missing_keywords?.slice(0, 3).map((k: any) => k.keyword).join(', ')}

Role: ${analysis.jobLabel || 'the position'}
Company: ${analysis.company || 'the company'}
Candidate name (for signing only): ${candidateName || 'not provided'}
Language: ${langName}`,
        },
      ],
      });
    } catch (err: any) {
      console.error('[Claude] generateCoverLetter failed:', err?.message || err);
      throw new InternalServerErrorException('Cover letter generation failed');
    }

    const content = response.content[0];
    if (!content) throw new InternalServerErrorException('Claude returned empty response');
    return {
      coverLetter: content.type === 'text' ? content.text : '',
      detectedLanguage: detectedLang,
    };
  }

  async getHistory(email: string, page: number, limit: number) {
    if (!email) return { data: [], total: 0 };
    const skip = (page - 1) * limit;
    const where = { email, result: { not: Prisma.DbNull } };
    const [data, total] = await Promise.all([
      (this.prisma as any).analysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).analysis.count({ where }),
    ]);
    return { data, total };
  }

  async getAnalysisById(id: number, email: string) {
    return (this.prisma as any).analysis.findFirst({
      where: {
        id,
        email,
        result: { not: Prisma.DbNull },
      },
    });
  }

  async deleteAnalysis(id: number, email: string) {
    const analysis = await (this.prisma as any).analysis.findFirst({
      where: { id, email },
    });
    if (!analysis)
      throw new BadRequestException('Analysis not found or unauthorized');
    return (this.prisma as any).analysis.delete({
      where: { id },
    });
  }

  async getProfile(email: string) {
    let profile = await (this.prisma as any).profile.findUnique({
      where: { email },
    });
    if (!profile) {
      profile = await (this.prisma as any).profile.create({ data: { email } });
    }
    return profile;
  }

  async updateProfile(
    email: string,
    data: { username?: string; avatarUrl?: string; displayName?: string; githubUsername?: string; linkedinUrl?: string; coverLetterName?: string },
  ) {
    return (this.prisma as any).profile.upsert({
      where: { email },
      update: data,
      create: { email, ...data },
    });
  }

  async listSavedCvs(email: string) {
    return (this.prisma as any).savedCv.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addSavedCv(email: string, name: string, url: string) {
    return (this.prisma as any).savedCv.create({ data: { email, name, url } });
  }

  async removeSavedCv(email: string, id: number) {
    const cv = await (this.prisma as any).savedCv.findFirst({ where: { id, email } });
    if (!cv) throw new BadRequestException('Not found');
    return (this.prisma as any).savedCv.delete({ where: { id } });
  }
}
