import { DomainException } from './domain.exception';

export class AiProviderException extends DomainException {
  constructor(
    provider: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(
      'AI_PROVIDER_FAILED',
      `${provider} provider failed: ${message}`,
      502,
      { provider, ...details },
    );
  }
}
