import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SharedSecretRevenueCatVerifier } from './revenuecat-webhook.verifier';

function makeVerifier(secret?: string) {
  const config = {
    get: (k: string) =>
      k === 'REVENUECAT_WEBHOOK_SECRET' ? secret : undefined,
  } as unknown as ConfigService;
  return new SharedSecretRevenueCatVerifier(config);
}

describe('SharedSecretRevenueCatVerifier', () => {
  it('fails closed when no secret is configured', () => {
    const v = makeVerifier(undefined);
    expect(() => v.verify('anything')).toThrow(UnauthorizedException);
  });

  it('accepts the exact secret', () => {
    const v = makeVerifier('s3cret');
    expect(() => v.verify('s3cret')).not.toThrow();
  });

  it('tolerates an optional Bearer prefix', () => {
    const v = makeVerifier('s3cret');
    expect(() => v.verify('Bearer s3cret')).not.toThrow();
  });

  it('rejects a wrong secret', () => {
    const v = makeVerifier('s3cret');
    expect(() => v.verify('wrong')).toThrow(UnauthorizedException);
  });

  it('rejects a missing header', () => {
    const v = makeVerifier('s3cret');
    expect(() => v.verify(undefined)).toThrow(UnauthorizedException);
  });
});
