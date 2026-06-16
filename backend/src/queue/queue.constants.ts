export const DEEP_ANALYSIS_QUEUE = 'analyze-deep';
export const NEGOTIATION_QUEUE = 'analyze-negotiation';
export const EMAIL_QUEUE = 'email-send';

export type DeepAnalysisJobPayload = {
  analysisId: number;
  email: string;
  /** When false, Claude skips project_recommendation generation. */
  generateBridgeProject?: boolean;
};

export type NegotiationJobPayload = {
  analysisId: number;
  email: string;
  locale: string;
};

export const QUEUE_ENABLED = !!process.env.REDIS_URL;
