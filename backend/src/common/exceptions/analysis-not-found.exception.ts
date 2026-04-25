import { DomainException } from './domain.exception';

export class AnalysisNotFoundException extends DomainException {
  constructor(analysisId?: number | string) {
    super(
      'ANALYSIS_NOT_FOUND',
      analysisId ? `Analysis ${analysisId} not found.` : 'Analysis not found.',
      404,
      analysisId !== undefined ? { analysisId } : undefined,
    );
  }
}
