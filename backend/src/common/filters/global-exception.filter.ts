import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ZodError } from 'zod';
import { DomainException } from '../exceptions/domain.exception';

type ErrorBody = {
  code: string;
  message: string;
  requestId: string;
  details?: unknown;
};

/**
 * Translates any thrown error into a stable JSON envelope:
 *   { code: string, message: string, requestId: string, details?: unknown }
 *
 * - DomainException: code/message/details come from the class.
 * - HttpException (NestJS validation, etc.): code derived from status name.
 * - ZodError: 422 with field-level details.
 * - Anything else: 500, code = INTERNAL_ERROR, full stack to logs + Sentry.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? randomUUID();

    const { status, body } = this.translate(exception, requestId);

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} → ${status} ${body.code}: ${body.message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      Sentry.captureException(exception, { tags: { requestId } });
    } else {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} → ${status} ${body.code}: ${body.message}`,
      );
    }

    response.setHeader('x-request-id', requestId);
    response.status(status).json(body);
  }

  private translate(
    exception: unknown,
    requestId: string,
  ): { status: number; body: ErrorBody } {
    if (exception instanceof DomainException) {
      return {
        status: exception.getStatus(),
        body: {
          code: exception.code,
          message: exception.message,
          requestId,
          details: exception.details,
        },
      };
    }

    if (exception instanceof ZodError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: {
          code: 'VALIDATION_FAILED',
          message: 'Request payload failed validation.',
          requestId,
          details: exception.issues,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const message =
        typeof raw === 'string'
          ? raw
          : (((raw as { message?: unknown })?.message as string | undefined) ??
            exception.message);
      return {
        status,
        body: {
          code: codeFromHttpStatus(status),
          message: typeof message === 'string' ? message : exception.message,
          requestId,
          details: typeof raw === 'object' && raw !== null ? raw : undefined,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        requestId,
      },
    };
  }
}

function codeFromHttpStatus(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    402: 'PAYMENT_REQUIRED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[status] ?? `HTTP_${status}`;
}
