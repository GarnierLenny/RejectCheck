import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUserPayload = {
  email: string;
  /** Supabase auth user id (JWT `sub`), needed to delete the auth record. */
  sub: string;
};

/**
 * The verified identity from the Supabase JWT (set by SupabaseGuard).
 *
 * Use this rather than AuthEmail when the handler also needs `sub`. Both read
 * the same guard-populated object, so neither can be spoofed by the caller.
 */
export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.authUser as AuthUserPayload;
  },
);
