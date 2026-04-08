import { Injectable, UnprocessableEntityException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';

const MAX_CV_CHARS = 12000;

@Injectable()
export class AnalyzeService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('OPENAI_API_KEY') });
  }

  async analyzeCv(cvBuffer: Buffer, jobDescription: string) {
    const jobText = jobDescription.trim().slice(0, 8000);
    let cvText: string;
    try {
      const parser = new PDFParse({ data: cvBuffer });
      try {
        const parsed = await parser.getText();
        cvText = parsed.text.replace(/\s+/g, " ").trim().slice(0, MAX_CV_CHARS);
        if (!cvText) throw new Error("Empty PDF");
      } finally {
        await parser.destroy();
      }
    } catch {
      throw new UnprocessableEntityException("Failed to parse PDF. Make sure it is a valid, text-based PDF.");
    }

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cv_analysis",
          schema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Rejection risk score where 100 means very high chance of rejection and 0 means strong match"
              },
              verdict: {
                type: "string",
                enum: ["Low", "Medium", "High"],
                description: "Overall rejection risk level"
              },
              top_reasons: {
                type: "array",
                description: "Top 3 specific reasons why this CV would be rejected for this job",
                items: {
                  type: "string",
                  minLength: 10,
                  description: "A clear and specific rejection reason tied to missing skills, weak experience, or mismatch"
                },
                minItems: 3,
                maxItems: 3
              },
              improvements: {
                type: "array",
                description: "Top 3 actionable improvements to increase chances of getting an interview",
                items: {
                  type: "string",
                  description: "A concrete, actionable fix with an example if possible"
                },
                minItems: 3,
                maxItems: 3
              }
            },
            required: ["score", "verdict", "top_reasons", "improvements"],
            additionalProperties: false
          }
        }
      },
      temperature: 0.3,
      messages: [
        { role: "system", content: process.env.SYSTEM_ANALYZE_PROMPT! },
        {
          role: "user",
          content: `Here is a developer CV and a job description.

          Analyze why this candidate would be rejected.

          CV:
          ${cvText}

          ---

          Job Description:
          ${jobText.trim()}
          Return only valid JSON. Do not include explanations.
          Each reason must be brutally clear and impactful.
          Avoid vague wording. Prefer strong statements.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      throw new InternalServerErrorException("Empty response from AI");
    }

    

    let parsed;
    try {
      parsed = JSON.parse(raw);

      if (
        typeof parsed.score !== "number" ||
        parsed.score < 0 ||
        parsed.score > 100 ||
        !["Low", "Medium", "High"].includes(parsed.verdict) ||
        !Array.isArray(parsed.top_reasons) ||
        parsed.top_reasons.length !== 3 ||
        !Array.isArray(parsed.improvements) ||
        parsed.improvements.length !== 3
      ) {
        throw new InternalServerErrorException("Invalid AI response structure");
      }
    } catch (err) {
      console.error("Invalid JSON from AI:", raw);
      throw new InternalServerErrorException("Invalid AI response format");
    }

    return parsed;
  }
}
