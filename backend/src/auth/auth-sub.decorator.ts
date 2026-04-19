import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extracts the verified Supabase user UUID (sub) from the JWT (set by SupabaseGuard). */
export const AuthSub = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.authUser.sub;
  },
);
