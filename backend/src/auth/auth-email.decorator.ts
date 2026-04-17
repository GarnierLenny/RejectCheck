import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extracts the verified email from the Supabase JWT (set by SupabaseGuard). */
export const AuthEmail = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.authUser.email;
  },
);
