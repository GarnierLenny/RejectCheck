import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { stripJsonFences } from '../../challenge/infrastructure/strip-json-fences';
import { ProjectRecommendationSchema } from '../dto/analyze-response.dto';

type ProjectRecommendation = ReturnType<typeof ProjectRecommendationSchema.parse>;

const MODEL_NAME = 'gemini-2.5-flash';

export const StarterRepoFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const StarterRepoSchema = z.object({
  files: z.array(StarterRepoFileSchema),
});

export type StarterRepoFile = z.infer<typeof StarterRepoFileSchema>;
export type StarterRepo = z.infer<typeof StarterRepoSchema>;

@Injectable()
export class GeminiStarterRepoProvider {
  private readonly logger = new Logger(GeminiStarterRepoProvider.name);
  private readonly client: GoogleGenerativeAI | null = null;

  constructor(configService: ConfigService) {
    const key = configService.get<string>('GEMINI_API_KEY');
    if (key) {
      this.client = new GoogleGenerativeAI(key);
    }
  }

  private model() {
    if (!this.client) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }
    return this.client.getGenerativeModel({ model: MODEL_NAME });
  }

  async generate(project: ProjectRecommendation): Promise<StarterRepo> {
    const prompt = `You are a senior software engineer. Generate a minimal but opinionated starter repository for the following project.

Project name: ${project.name}
Description: ${project.description}
Technologies: ${(project.technologies as Array<string | { name: string }>).map((t) => (typeof t === 'string' ? t : t.name)).join(', ')}
Architecture: ${project.architecture}
Key features to implement:
${(project.key_features as string[]).map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

Generate a minimal starter repo with:
- A well-structured README.md with setup instructions (install, run, env vars needed)
- A CONTEXT.md file that gives an AI coding assistant (Claude, Copilot, Cursor, Windsurf…) enough context to provide targeted help when the developer is stuck — not a "generate everything" prompt, but a concise brief covering: stack rationale, key architectural decisions, constraints, and suggested first steps for each major feature. The developer will paste this when asking specific questions, not to auto-generate the project.
- The main project files with correct folder structure and boilerplate (package.json or equivalent, config files, entry points with correct imports but business logic as TODO stubs with guiding comments)
- A .gitignore appropriate for the tech stack
- A .env.example file listing required environment variables

Rules:
- Keep each file focused and minimal — no placeholder Lorem Ipsum
- Use the exact technologies specified
- README setup steps must be copy-pasteable commands
- Service files and core business logic must be stubs (skeleton + TODO comments explaining what to implement), not full implementations — the developer is supposed to write that code
- CONTEXT.md should explain the "why" behind architecture choices and give enough context for an AI assistant to answer follow-up questions accurately

Respond with ONLY a JSON object matching this exact shape, no prose before or after:
{
  "files": [
    { "path": "README.md", "content": "..." },
    { "path": "CONTEXT.md", "content": "..." },
    ...
  ]
}`;

    this.logger.log(`Generating starter repo for project: ${project.name}`);

    const result = await this.model().generateContent(prompt);
    const raw = stripJsonFences(result.response.text());

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.error('Gemini returned invalid JSON for starter repo');
      throw new InternalServerErrorException('Starter repo generation failed');
    }

    const safe = StarterRepoSchema.safeParse(parsed);
    if (!safe.success) {
      this.logger.error(
        `Starter repo schema mismatch: ${safe.error.issues[0].message}`,
      );
      throw new InternalServerErrorException('Starter repo generation failed');
    }

    return safe.data;
  }
}
