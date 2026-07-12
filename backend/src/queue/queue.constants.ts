export const NEGOTIATION_QUEUE = 'analyze-negotiation';
export const EMAIL_QUEUE = 'email-send';

export type NegotiationJobPayload = {
  analysisId: number;
  email: string;
  locale: string;
};

export const QUEUE_ENABLED = !!process.env.REDIS_URL;
