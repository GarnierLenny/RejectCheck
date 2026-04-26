import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  type ChallengeIssue,
  type ScoreResult,
  ScoreResultSchema,
} from '../dto/challenge.dto';
import type { AttemptCoach } from '../ports/attempt-coach.provider';
import { stripJsonFences } from './strip-json-fences';

const MODEL_NAME = 'gemini-2.5-flash';

@Injectable()
export class GeminiAttemptCoach implements AttemptCoach {
  private readonly client: GoogleGenerativeAI | null = null;

  constructor(configService: ConfigService) {
    const key = configService.get<string>('GEMINI_API_KEY');
    if (key) {
      this.client = new GoogleGenerativeAI(key);
    }
  }

  private model() {
    if (!this.client) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured',
      );
    }
    return this.client.getGenerativeModel({ model: MODEL_NAME });
  }

  async generateSocraticFollowup(
    snippet: string,
    issues: ChallengeIssue[],
    firstAnswer: string,
  ): Promise<string> {
    const prompt = `You are a senior developer reviewing a junior developer's code review answer.
The developer was asked to review this code snippet and identify issues.

Code snippet:
${snippet}

Real issues in this code:
${JSON.stringify(issues, null, 2)}

Developer's answer:
${firstAnswer}

Your job: Ask ONE specific follow-up question that challenges their thinking.
- If they missed a critical issue, guide them toward it without revealing it
- If their answer is good, push them deeper on one point
- Keep it under 2 sentences
- Be direct, not condescending
- Do NOT reveal the answer

Respond with only the question, no preamble.`;

    const result = await this.model().generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) {
      throw new BadGatewayException('Empty response from Gemini');
    }
    return text;
  }

  async scoreAttempt(
    snippet: string,
    issues: ChallengeIssue[],
    firstAnswer: string,
    aiChallenge: string,
    secondAnswer: string,
  ): Promise<ScoreResult> {
    const prompt = `You are scoring a developer's code review performance.

Code snippet:
${snippet}

Real issues (ground truth):
${JSON.stringify(issues, null, 2)}

Developer's first answer:
${firstAnswer}

AI follow-up question:
${aiChallenge}

Developer's final answer:
${secondAnswer}

Score on these 4 criteria. Return JSON only, matching this exact shape:
{
  "issues_found": 0-40,
  "explanation_quality": 0-30,
  "prioritization": 0-20,
  "bonus": 0-10,
  "total": 0-100,
  "feedback": "2-3 sentences of honest, specific feedback",
  "missed_issues": ["list of issue titles they completely missed"]
}

total must equal issues_found + explanation_quality + prioritization + bonus.
Do not include any prose outside the JSON object.`;

    const result = await this.model().generateContent(prompt);
    const raw = stripJsonFences(result.response.text());

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadGatewayException('Gemini returned invalid JSON for scoring');
    }

    const safe = ScoreResultSchema.safeParse(parsed);
    if (!safe.success) {
      throw new BadGatewayException(
        `Gemini score did not match schema: ${safe.error.issues[0].message}`,
      );
    }

    const sum =
      safe.data.issues_found +
      safe.data.explanation_quality +
      safe.data.prioritization +
      safe.data.bonus;
    return { ...safe.data, total: Math.min(100, sum) };
  }
}
