import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ANALYSIS_REPOSITORY } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import {
  GeminiStarterRepoProvider,
  StarterRepo,
  StarterRepoSchema,
} from '../infrastructure/gemini-starter-repo.provider';
import { AnalysisNotFoundException } from '../../common/exceptions';
import { mergeHotAndDeep } from '../dto/analyze-response.dto';

@Injectable()
export class GenerateStarterRepoUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    private readonly gemini: GeminiStarterRepoProvider,
  ) {}

  async execute(
    analysisId: number,
    email: string,
  ): Promise<{ repo: StarterRepo; projectName: string }> {
    const stored = await this.analyses.findById(analysisId, email);
    if (!stored || !stored.result) throw new AnalysisNotFoundException(analysisId);

    const merged = stored.deepAnalysis
      ? mergeHotAndDeep(stored.result, stored.deepAnalysis as never)
      : stored.result;

    const project = merged.project_recommendation;
    if (!project) {
      throw new BadRequestException(
        'Bridge project not yet generated for this analysis',
      );
    }

    // Idempotent: return cached if already generated
    const cached = await this.analyses.findStarterRepo(analysisId, email);
    if (cached) {
      const safe = StarterRepoSchema.safeParse(cached);
      if (safe.success) return { repo: safe.data, projectName: project.name };
    }

    const repo = await this.gemini.generate(project);
    await this.analyses.attachStarterRepo(analysisId, email, repo);
    return { repo, projectName: project.name };
  }
}
