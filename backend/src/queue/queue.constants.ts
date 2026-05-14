export const DEEP_ANALYSIS_QUEUE = 'analyze-deep';
export const NEGOTIATION_QUEUE = 'analyze-negotiation';

export type DeepAnalysisJobPayload = {
  analysisId: number;
  email: string;
};

export type NegotiationJobPayload = {
  analysisId: number;
  email: string;
  locale: string;
};

export const QUEUE_ENABLED = !!process.env.REDIS_URL;
