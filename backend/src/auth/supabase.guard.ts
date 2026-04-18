import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Cache the JWKS fetcher — re-used across all requests, keys refreshed lazily by jose
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(supabaseUrl: string) {
  if (!jwksCache) {
    const jwksUri = new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
    jwksCache = createRemoteJWKSet(jwksUri);
  }
  return jwksCache;
}

@Injectable()
export class SupabaseGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or malformed Authorization header',
      );
    }

    const token = authHeader.slice(7);
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    if (!supabaseUrl) {
      throw new UnauthorizedException(
        'Server authentication is not configured',
      );
    }

    try {
      const JWKS = getJwks(supabaseUrl);
      const { payload } = await jwtVerify(token, JWKS, {
        audience: 'authenticated',
      });

      if (!payload.email) {
        throw new UnauthorizedException(
          'Token does not contain an email claim',
        );
      }

      request.authUser = {
        email: payload.email as string,
        sub: payload.sub as string,
      };
      return true;
    } catch (err: any) {
      throw new UnauthorizedException(err?.message ?? 'Invalid token');
    }
  }
}
