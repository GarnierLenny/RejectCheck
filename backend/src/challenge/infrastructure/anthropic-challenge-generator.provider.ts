import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  type Difficulty,
  type GeneratedChallenge,
  GeneratedChallengeSchema,
} from '../dto/challenge.dto';
import type { ChallengeLanguage, FocusTag } from '../domain/focus-tags';
import type { ChallengeGenerator } from '../ports/challenge-generator.provider';
import {
  buildChallengePrompt,
  validateGenerated,
} from './challenge-generation-prompt';
import { stripJsonFences } from './strip-json-fences';

const MODEL_NAME = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

@Injectable()
export class AnthropicChallengeGenerator implements ChallengeGenerator {
  private readonly logger = new Logger(AnthropicChallengeGenerator.name);
  private readonly client: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (key) {
      this.client = new Anthropic({ apiKey: key });
    }
    if (
      !this.configService.get<string>('CHALLENGE_GENERATION_PROMPT')?.trim()
    ) {
      this.logger.warn(
        'CHALLENGE_GENERATION_PROMPT is not set — falling back to the minimal stub. Production must override this env var.',
      );
    }
  }

  async generate(
    language: ChallengeLanguage,
    focusTag: FocusTag,
    difficulty: Difficulty,
  ): Promise<GeneratedChallenge> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'ANTHROPIC_API_KEY is not configured',
      );
    }

    const override = this.configService.get<string>(
      'CHALLENGE_GENERATION_PROMPT',
    );
    const prompt = buildChallengePrompt(
      language,
      focusTag,
      difficulty,
      override,
    );

    const response = await this.client.messages.create({
      model: MODEL_NAME,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text') as
      | { type: 'text'; text: string }
      | undefined;
    const rawText = textBlock?.text ?? '';
    if (!rawText) {
      throw new BadGatewayException('Empty response from Claude');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonFences(rawText));
    } catch {
      throw new BadGatewayException(
        'Claude returned invalid JSON for challenge generation',
      );
    }

    const safe = GeneratedChallengeSchema.safeParse(parsed);
    if (!safe.success) {
      throw new BadGatewayException(
        `Claude challenge did not match schema: ${safe.error.issues[0].message}`,
      );
    }
    validateGenerated(safe.data);
    return safe.data;
  }
}
