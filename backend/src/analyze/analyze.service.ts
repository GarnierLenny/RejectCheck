import { Injectable, UnprocessableEntityException, InternalServerErrorException, BadRequestException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';
import { AnalyzeResponseSchema, AnalyzeResponse } from './dto/analyze-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { Prisma } from '@prisma/client';

const MAX_TEXT_CHARS = 12000;

@Injectable()
export class AnalyzeService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {
    const prompt = this.configService.get<string>('SYSTEM_ANALYZE_PROMPT');
    console.log(`[AnalyzeService] Constructor: SYSTEM_ANALYZE_PROMPT loaded. Length: ${prompt?.length ?? 0}`);
    if (prompt) console.log(`[AnalyzeService] Prompt Start: "${prompt.slice(0, 50)}..."`);
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('OPENAI_API_KEY') });
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

    const systemPrompt = this.configService.get<string>('SYSTEM_ANALYZE_PROMPT')!;
    console.log(`[AnalyzeService] Sending request to OpenAI. System prompt length: ${systemPrompt.length}`);

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analysis_response",
          strict: true,
          schema: z.toJSONSchema(AnalyzeResponseSchema),
        },
      },
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this application for the following job. Use the provided documents to find gaps.

          JOB DESCRIPTION:
          ${jobText}

          ---

          CANDIDATE CV:
          ${cvText}

          ${motivationLetterText ? `---\nMOTIVATION LETTER:\n${motivationLetterText}` : ''}
          ${linkedinText ? `---\nLINKEDIN PROFILE:\n${linkedinText}` : ''}
          ${githubInfo ? `---\nGITHUB DATA:\n${githubInfo}` : ''}

          Be brutal and specific. Evaluate if the motivation letter (if provided) actually adds value or is generic.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new InternalServerErrorException("Empty response from AI");

    try {
      const parsedJson = JSON.parse(raw);
      const result = AnalyzeResponseSchema.parse(parsedJson);
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
