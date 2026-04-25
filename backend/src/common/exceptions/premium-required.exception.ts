import { DomainException } from './domain.exception';

export class PremiumRequiredException extends DomainException {
  constructor(
    message = 'This feature requires an active subscription.',
    details?: Record<string, unknown>,
  ) {
    super('PREMIUM_REQUIRED', message, 402, details);
  }
}
