import { Injectable, UnprocessableEntityException, InternalServerErrorException, BadRequestException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';
import { AnalyzeResponseSchema, AnalyzeResponse } from './dto/analyze-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { Prisma } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const MAX_TEXT_CHARS = 12000;

@Injectable()
export class AnalyzeService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {
    const prompt = this.configService.get<string>('SYSTEM_ANALYZE_PROMPT');
    console.log(`[AnalyzeService] Constructor: SYSTEM_ANALYZE_PROMPT loaded. Length: ${prompt?.length ?? 0}`);
    if (prompt) console.log(`[AnalyzeService] Prompt Start: "${prompt.slice(0, 50)}..."`);
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('OPENAI_API_KEY') });
    this.anthropic = new Anthropic({ apiKey: this.configService.get<string>('ANTHROPIC_API_KEY') });
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const parser = new PDFParse({ data: buffer });
      try {
        const parsed = await parser.getText();
        const text = parsed.text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARS);
        if (!text) throw new Error("Empty PDF");
        return text;
      } finally {
        await parser.destroy();
      }
    } catch (err) {
      throw new UnprocessableEntityException("Failed to parse PDF. Make sure it is a valid, text-based PDF.");
    }
  }

  private async fetchGithubData(username: string) {
    try {
      const headers = { 'User-Agent': 'RejectCheck-App' };
      const profileRes = await fetch(`https://api.github.com/users/${username}`, { headers });
      if (!profileRes.ok) return null;
      const profile = await profileRes.json();

      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, { headers });
      const repos = reposRes.ok ? await reposRes.json() : [];

      return {
        bio: profile.bio,
        public_repos: profile.public_repos,
        followers: profile.followers,
        top_repos: repos.map((r: any) => ({
          name: r.name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count
        }))
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
  }): Promise<{ technical_analysis: AnalyzeResponse['technical_analysis']; project_recommendation: AnalyzeResponse['project_recommendation']; scores: { tech_stack_fit: number; github_signal: number | null } }> {
    const { jobText, cvText, githubInfo, linkedinText, motivationLetterText } = data;
    const technicalPrompt = this.configService.get<string>('SYSTEM_TECHNICAL_PROMPT')!;

    console.log(`[AnalyzeService] Requesting Technical Analysis from Claude 3.5 Sonnet...`);

    try {
      const msg = await this.anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        temperature: 0.1,
        system: technicalPrompt,
        tools: [
          {
            name: "submit_technical_analysis",
            description: "Submit the completed technical gap analysis as structured data.",
            input_schema: {
              type: "object" as const,
              properties: {
                technical_analysis: {
                  type: "object",
                  properties: {
                    reasoning: { type: "string" },
                    skill_priority: {
                      type: "array",
                      description: "The 5 skill names ordered from most to least critical for THIS specific job",
                      items: { type: "string" },
                      minItems: 5,
                      maxItems: 5,
                    },
                    skills: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          expected: { type: "number" },
                          current: { type: "number" },
                          evidence: { type: "string" },
                        },
                        required: ["name", "expected", "current", "evidence"],
                      },
                      minItems: 5,
                      maxItems: 5,
                    },
                    recommendation: { type: "string" },
                    market_context: { type: "string" },
                    seniority_signals: { type: "array", items: { type: "string" } },
                  },
                  required: ["reasoning", "skill_priority", "skills", "recommendation", "market_context", "seniority_signals"],
                },
                project_recommendation: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    technologies: { type: "array", items: { type: "string" } },
                    key_features: { type: "array", items: { type: "string" } },
                    architecture: { type: "string" },
                    advanced_concepts: { type: "array", items: { type: "string" } },
                    success_criteria: { type: "array", items: { type: "string" } },
                    difficulty_level: { type: "string" },
                    why_it_matters: { type: "string" },
                    what_matters: { type: "array", items: { type: "string" } },
                  },
                  required: ["name", "description", "technologies", "key_features", "architecture", "advanced_concepts", "success_criteria", "difficulty_level", "why_it_matters", "what_matters"],
                },
                scores: {
                  type: "object",
                  properties: {
                    tech_stack_fit: { type: "number" },
                    github_signal: { type: ["number", "null"] },
                  },
                  required: ["tech_stack_fit", "github_signal"],
                },
              },
              required: ["technical_analysis", "project_recommendation", "scores"],
            },
          }
        ],
        tool_choice: { type: "tool", name: "submit_technical_analysis" },
        messages: [
          {
            role: "user",
            content: `Perform a technical gap analysis.

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
          - In skill_priority, list the exact 5 skill names from most to least critical for this specific job.`
          }
        ]
      });

      const toolUse = msg.content.find((block: any) => block.type === 'tool_use');
      if (!toolUse || (toolUse as any).type !== 'tool_use') {
        console.error("[Claude] No tool_use block in response:", JSON.stringify(msg.content).slice(0, 300));
        throw new InternalServerErrorException("Technical Analysis failed");
      }
      return (toolUse as any).input;
    } catch (apiErr: any) {
      console.error("[Claude] Anthropic API call failed:", apiErr?.message || apiErr);
      throw new InternalServerErrorException("Technical Analysis failed");
    }
  }

  async analyzeApplication(data: {
    cvBuffer?: Buffer;
    jobDescription: string;
    linkedinBuffer?: Buffer;
    motivationLetterBuffer?: Buffer;
    motivationLetterText?: string;
    githubUsername?: string;
  }, onStep?: (step: string) => void): Promise<{ result: AnalyzeResponse; cvText: string; motivationLetterText: string }> {
    const { cvBuffer, jobDescription, linkedinBuffer, motivationLetterBuffer, motivationLetterText: mlText, githubUsername } = data;

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

    onStep?.('running_ats');

    // Define the restricted schema for GPT-4o (No Technical Fields)
    const GPTAnalysisSchema = AnalyzeResponseSchema.omit({
      project_recommendation: true,
      technical_analysis: true,
    }).extend({
      breakdown: z.object({
        keyword_match: z.number(),
        experience_level: z.number(),
        linkedin_signal: z.number().nullable(),
      }),
    });

    // Signal the start of the parallel dual-intelligence analysis
    onStep?.('dual_ai_analysis');

    const systemPrompt = this.configService.get<string>('SYSTEM_ANALYZE_PROMPT')!;
    console.log(`[AnalyzeService] Sending request to OpenAI with RESTRICTED schema.`);

    // Run both analyses in parallel using allSettled for robustness
    const [gptResult, claudeResult] = await Promise.allSettled([
      this.openai.chat.completions.create({
        model: "gpt-4o",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "gpt_analysis_response",
            strict: true,
            schema: z.toJSONSchema(GPTAnalysisSchema),
          },
        },
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this application for the following job.
  
            JOB DESCRIPTION:
            ${jobText}
  
            ---
  
            CANDIDATE CV:
            ${cvText}
  
            ${motivationLetterText ? `---\nMOTIVATION LETTER:\n${motivationLetterText}` : ''}
            ${linkedinText ? `---\nLINKEDIN PROFILE:\n${linkedinText}` : ''}
            ${githubInfo ? `---\nGITHUB DATA:\n${githubInfo}` : ''}`,
          },
        ],
      }),
      this.getTechnicalAnalysisWithClaude({ jobText, cvText, githubInfo, linkedinText, motivationLetterText })
    ]);

    if (gptResult.status === 'rejected') {
      console.error("OpenAI Primary Analysis failed:", gptResult.reason);
      throw new InternalServerErrorException("Primary Analysis failed");
    }

    const raw = gptResult.value.choices[0]?.message?.content;
    if (!raw) throw new InternalServerErrorException("Empty response from OpenAI");

    try {
      const gptParsed = JSON.parse(raw);
      
      // Initialize full response structure with GPT data
      const fullResponse: any = {
        ...gptParsed,
        // Reconstruct breakdown with Claude's scores if available
        breakdown: {
          ...gptParsed.breakdown,
          tech_stack_fit: 0,
          github_signal: null,
        }
      };
      
      // Merge Claude's results if successful
      if (claudeResult.status === 'fulfilled') {
        fullResponse.technical_analysis = claudeResult.value.technical_analysis;
        fullResponse.project_recommendation = claudeResult.value.project_recommendation;
        fullResponse.breakdown.tech_stack_fit = claudeResult.value.scores.tech_stack_fit;
        fullResponse.breakdown.github_signal = claudeResult.value.scores.github_signal;
      } else {
        console.error("Claude Technical Analysis failed, using fallback placeholders");
        const placeholder = { name: "Technical Analysis Unavailable", expected: 5, current: 0, evidence: "Technical engine was unavailable for this scan." };
        fullResponse.technical_analysis = { 
          reasoning: "Technical analysis was unavailable for this run.", 
          skills: [placeholder, placeholder, placeholder, placeholder, placeholder], 
          recommendation: "",
          market_context: "Unavailable",
          seniority_signals: []
        };
        fullResponse.project_recommendation = { name: "Analysis Incomplete", description: "Technical engine was unavailable.", technologies: [], key_features: [], architecture: "", advanced_concepts: [], success_criteria: [], difficulty_level: "Intermediate", why_it_matters: "", what_matters: [] };
      }
      
      const result = AnalyzeResponseSchema.parse(fullResponse);
      return { result, cvText, motivationLetterText };
    } catch (err) {
      console.error("Zod validation or JSON error:", err, raw);
      throw new InternalServerErrorException("Invalid AI response format");
    }
  }

  async checkUsageLimit(email?: string, ip?: string): Promise<{ allowed: boolean; reason?: string }> {
    // 1. Check if email has a paid subscription
    if (email) {
      const hasSub = await this.stripeService.checkSubscription(email);
      if (hasSub) return { allowed: true };
    }

    // 2. Check usage count by email
    if (email) {
      const count = await (this.prisma as any).analysis.count({ where: { email } });
      if (count >= 1) return { allowed: false, reason: 'limit_reached' };
    }

    // 3. Check usage count by IP
    if (ip) {
      const count = await (this.prisma as any).analysis.count({ where: { ip } });
      if (count >= 1) return { allowed: false, reason: 'limit_reached' };
    }

    return { allowed: true };
  }

  async saveAnalysis(data: { 
    email?: string; 
    ip?: string; 
    jobDescription: string; 
    cvText?: string;
    motivationLetter?: string;
    result: any; 
    isRegistered: boolean 
  }) {
    const { email, ip, jobDescription, cvText, motivationLetter, result, isRegistered } = data;

    if (isRegistered && email) {
      // Registered User: Store everything
      await (this.prisma as any).analysis.create({
        data: {
          email,
          ip: ip ?? null,
          jobDescription,
          cvText: cvText ?? null,
          motivationLetter: motivationLetter ?? null,
          result: result as any,
        }
      });
    } else {
      // Anonymous User: Store ONLY IP and createdAt (by default)
      // We explicitly null out email and jobDescription as requested
      await (this.prisma as any).analysis.create({
        data: {
          ip: ip ?? null,
          email: null,
          jobDescription: null,
          // We omit 'result' to keep it as DB null
        }
      });
    }
  }

  async getHistory(email: string) {
    if (!email) return [];
    return (this.prisma as any).analysis.findMany({
      where: { 
        email,
        result: { not: Prisma.DbNull }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAnalysisById(id: number, email: string) {
    return (this.prisma as any).analysis.findFirst({
      where: { 
        id,
        email,
        result: { not: Prisma.DbNull }
      }
    });
  }

  async deleteAnalysis(id: number, email: string) {
    const analysis = await (this.prisma as any).analysis.findFirst({
      where: { id, email },
    });
    if (!analysis) throw new BadRequestException('Analysis not found or unauthorized');
    return (this.prisma as any).analysis.delete({
      where: { id },
    });
  }

  async getProfile(email: string) {
    let profile = await (this.prisma as any).profile.findUnique({ where: { email } });
    if (!profile) {
      profile = await (this.prisma as any).profile.create({ data: { email } });
    }
    return profile;
  }

  async updateProfile(email: string, data: { username?: string; avatarUrl?: string }) {
    return (this.prisma as any).profile.upsert({
      where: { email },
      update: data,
      create: { email, ...data },
    });
  }
}
