import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Returns the verified email from the Supabase JWT if present, otherwise
 * undefined. Pair with `OptionalSupabaseGuard` so the request is not blocked
 * when no token is provided.
 */
export const OptionalAuthEmail = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.authUser?.email;
  },
);
