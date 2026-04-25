import { DomainException } from './domain.exception';

export class QuotaExceededException extends DomainException {
  constructor(
    message = 'Free quota exceeded — upgrade to continue.',
    details?: Record<string, unknown>,
  ) {
    super('QUOTA_EXCEEDED', message, 403, details);
  }
}
