import { Injectable, UnprocessableEntityException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { AnalyzeResponseSchema, AnalyzeResponse } from './dto/analyze-response.dto';

const MAX_TEXT_CHARS = 12000;

@Injectable()
export class AnalyzeService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
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
    githubUsername?: string;
  }): Promise<AnalyzeResponse> {
    const { cvBuffer, jobDescription, linkedinBuffer, githubUsername } = data;
    
    if (!cvBuffer) {
      throw new BadRequestException('CV is required');
    }

    const jobText = jobDescription.trim().slice(0, 8000);
    const cvText = await this.parsePdf(cvBuffer);
    
    let linkedinText = '';
    if (linkedinBuffer) {
      try {
        linkedinText = await this.parsePdf(linkedinBuffer);
      } catch {
        console.warn('Failed to parse LinkedIn PDF');
      }
    }

    let githubInfo = '';
    if (githubUsername) {
      const ghData = await this.fetchGithubData(githubUsername);
      if (ghData) {
        githubInfo = JSON.stringify(ghData, null, 2);
      }
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: process.env.SYSTEM_ANALYZE_PROMPT! },
        {
          role: "user",
          content: `Analyze this application for the following job. Use the provided CV and additional context (LinkedIn/GitHub) to find gaps.

          JOB DESCRIPTION:
          ${jobText}

          ---

          CANDIDATE CV:
          ${cvText}

          ${linkedinText ? `---\nLINKEDIN PROFILE:\n${linkedinText}` : ''}
          ${githubInfo ? `---\nGITHUB DATA:\n${githubInfo}` : ''}

          Return only valid JSON. Be brutal and specific.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new InternalServerErrorException("Empty response from AI");

    try {
      const parsedJson = JSON.parse(raw);
      return AnalyzeResponseSchema.parse(parsedJson);
    } catch (err) {
      console.error("Zod validation or JSON error:", err, raw);
      throw new InternalServerErrorException("Invalid AI response format");
    }
  }
}
