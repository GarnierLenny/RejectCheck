import { HttpException } from '@nestjs/common';

/**
 * Base class for domain-meaningful errors. Extends NestJS HttpException so the
 * default exception handling still works, but adds a stable `code` field that
 * clients can branch on without parsing messages.
 *
 * The GlobalExceptionFilter inspects `code` to format consistent JSON responses.
 */
export abstract class DomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    httpStatus: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, httpStatus);
  }
}
