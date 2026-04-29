import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { createRemoteJWKSet, jwtVerify } from 'jose';

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(supabaseUrl: string) {
  if (!jwksCache) {
    const jwksUri = new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
    jwksCache = createRemoteJWKSet(jwksUri);
  }
  return jwksCache;
}

/**
 * Variant of SupabaseGuard that never blocks the request:
 * - If a valid Bearer token is present, attaches `authUser = { email, sub }`.
 * - If no token, an invalid token, or token verification fails, the request
 *   simply proceeds with `authUser` undefined.
 *
 * Use on endpoints that work for both anonymous and authenticated viewers,
 * where the auth context is optional context (e.g. computing `isFollowing`).
 */
@Injectable()
export class OptionalSupabaseGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return true;

    const token = authHeader.slice(7);
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    if (!supabaseUrl) return true;

    try {
      const JWKS = getJwks(supabaseUrl);
      const { payload } = await jwtVerify(token, JWKS, {
        audience: 'authenticated',
      });
      if (payload.email) {
        request.authUser = {
          email: payload.email as string,
          sub: payload.sub as string,
        };
        Sentry.setUser({
          id: payload.sub as string,
          email: payload.email as string,
        });
      }
    } catch {
      // Silently ignore — request continues anonymously.
    }
    return true;
  }
}
