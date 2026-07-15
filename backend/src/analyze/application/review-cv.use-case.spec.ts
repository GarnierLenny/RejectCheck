import { BadRequestException } from '@nestjs/common';
import { ReviewCvUseCase } from './review-cv.use-case';

/**
 * Guards for the CV-audit source extraction:
 *  - the min-evidence gate (incident 2026-07-11, analysis id=82: an image-based
 *    PDF parsed to the bare page marker "-- 1 of 1 --" and review-cv had no gate,
 *    so it synthesised the audit from the owner's profile digest);
 *  - the Claude-vision OCR fallback for image-based PDFs and direct image uploads.
 */
describe('ReviewCvUseCase — CV source extraction', () => {
  function makeUseCase(
    cvText: string,
    opts: { ocrText?: string; claude?: Record<string, unknown>; analyses?: unknown } = {},
  ) {
    const pdf = {
      parse: jest.fn().mockResolvedValue(cvText),
      parseFormatted: jest.fn().mockResolvedValue(cvText),
    };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const claude = {
      transcribeDocument: jest.fn().mockResolvedValue(opts.ocrText ?? ''),
      reviewCv: jest.fn().mockResolvedValue({}),
      ...(opts.claude ?? {}),
    };
    const analyses = opts.analyses ?? {
      saveAnonymous: jest.fn().mockResolvedValue({ claimToken: 'tok' }),
    };
    const noop = {} as any;

    return new ReviewCvUseCase(
      analyses as any,
      claude as any,
      noop, // github
      pdf as any,
      noop, // subs
      noop, // profiles
      noop, // digests
      noop, // creditLedger
      noop, // portfolioScraper
      noop, // generateDigestUc
      config as any,
    );
  }

  const pdfCmd = { cvBuffer: Buffer.from('%PDF-fake'), isRegistered: false };
  const imgCmd = {
    cvBuffer: Buffer.from('fake-jpeg'),
    cvMimeType: 'image/png',
    isRegistered: false,
  };

  it('rejects an image PDF that parses to "-- 1 of 1 --" when OCR also fails', async () => {
    const uc = makeUseCase('-- 1 of 1 --', { ocrText: '' });
    await expect(uc.execute(pdfCmd)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets a text PDF through the gate', async () => {
    const uc = makeUseCase('x'.repeat(250));
    await expect(uc.execute(pdfCmd)).resolves.toMatchObject({ analysisId: null });
  });

  it('OCR-recovers an image-based PDF that pdf-parse could not read', async () => {
    const uc = makeUseCase('-- 1 of 1 --', { ocrText: 'y'.repeat(300) });
    await expect(uc.execute(pdfCmd)).resolves.toMatchObject({ analysisId: null });
  });

  it('OCRs a direct image upload without touching pdf-parse', async () => {
    const uc = makeUseCase('irrelevant', { ocrText: 'z'.repeat(300) });
    await expect(uc.execute(imgCmd)).resolves.toMatchObject({ analysisId: null });
  });

  it('rejects a direct image upload whose OCR is near-empty', async () => {
    const uc = makeUseCase('irrelevant', { ocrText: '   ' });
    await expect(uc.execute(imgCmd)).rejects.toBeInstanceOf(BadRequestException);
  });
});

/**
 * Regression: the signed-in user's OWN portfolio (from their profile, not this
 * upload) is fed as a cross-check source. It's OFF by default (opt-in) —
 * relying on CV_REVIEW_PORTFOLIO_ENABLED=false being set in prod was a footgun
 * that leaked the owner's portfolio into strangers' CV audits, surfacing it as
 * fake "identity mismatch" inconsistencies. Only CV_REVIEW_PORTFOLIO_ENABLED=
 * 'true' opts back in (for auditing your own CV).
 */
describe('ReviewCvUseCase — portfolio gated by CV_REVIEW_PORTFOLIO_ENABLED', () => {
  // `portfolioFlag`: value returned for CV_REVIEW_PORTFOLIO_ENABLED (undefined
  // = unset = default-OFF). PROFILE_DIGEST_ENABLED stays off throughout.
  function makeRegisteredUseCase(portfolioFlag: string | undefined) {
    const pdf = {
      parse: jest.fn().mockResolvedValue('x'.repeat(300)),
      parseFormatted: jest.fn().mockResolvedValue('x'.repeat(300)),
    };
    const config = {
      get: jest.fn((k: string) =>
        k === 'CV_REVIEW_PORTFOLIO_ENABLED' ? portfolioFlag : undefined,
      ),
    };
    const reviewCv = jest.fn().mockResolvedValue({ cv_quality: { overall: 60 } });
    const claude = { transcribeDocument: jest.fn().mockResolvedValue(''), reviewCv };
    const subs = {
      getState: jest.fn().mockResolvedValue({ hasActiveSubscription: false, isHired: false }),
    };
    const profiles = {
      findByEmail: jest.fn().mockResolvedValue({ portfolioUrl: 'https://lennygarnier.com' }),
    };
    const portfolioScraper = {
      fetch: jest.fn().mockResolvedValue({ markdown: 'OWNER PORTFOLIO CONTENT' }),
    };
    const analyses = {
      creditsSince: jest.fn().mockResolvedValue(0),
      countByIp: jest.fn().mockResolvedValue(0),
      saveRegistered: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const creditLedger = {
      getBalance: jest.fn().mockResolvedValue(0),
      consume: jest.fn().mockResolvedValue(undefined),
    };
    const noop = {} as any;

    const uc = new ReviewCvUseCase(
      analyses as any,
      claude as any,
      noop, // github
      pdf as any,
      subs as any,
      profiles as any,
      noop, // digests
      creditLedger as any,
      portfolioScraper as any,
      noop, // generateDigestUc
      config as any,
    );
    return { uc, portfolioScraper, reviewCv };
  }

  const cmd = {
    cvBuffer: Buffer.from('%PDF-fake'),
    email: 'owner@example.com',
    isRegistered: true,
  };

  it('does NOT scrape the profile portfolio by default (flag unset)', async () => {
    const { uc, portfolioScraper, reviewCv } = makeRegisteredUseCase(undefined);
    await uc.execute(cmd);
    expect(portfolioScraper.fetch).not.toHaveBeenCalled();
    expect(reviewCv.mock.calls[0][0].portfolioMarkdown).toBeFalsy();
    expect(reviewCv.mock.calls[0][0].portfolioUrl).toBeNull();
  });

  it('does NOT scrape the profile portfolio when explicitly disabled', async () => {
    const { uc, portfolioScraper, reviewCv } = makeRegisteredUseCase('false');
    await uc.execute(cmd);
    expect(portfolioScraper.fetch).not.toHaveBeenCalled();
    expect(reviewCv.mock.calls[0][0].portfolioMarkdown).toBeFalsy();
    expect(reviewCv.mock.calls[0][0].portfolioUrl).toBeNull();
  });

  it('scrapes the profile portfolio only when explicitly enabled', async () => {
    const { uc, portfolioScraper } = makeRegisteredUseCase('true');
    await uc.execute(cmd);
    expect(portfolioScraper.fetch).toHaveBeenCalledWith('https://lennygarnier.com');
  });
});

/**
 * Owner audit mode: lean generation, portfolio off, and quota bypassed
 * (no reserveQuotaIntent lookups, no ledger consume). Only honored when the
 * JWT email is in OWNER_EMAILS.
 */
describe('ReviewCvUseCase — owner audit mode', () => {
  function makeUseCase(ownerEmails: string) {
    const pdf = {
      parse: jest.fn().mockResolvedValue('x'.repeat(300)),
      parseFormatted: jest.fn().mockResolvedValue('x'.repeat(300)),
    };
    const config = {
      get: jest.fn((k: string) => (k === 'OWNER_EMAILS' ? ownerEmails : undefined)),
    };
    const reviewCv = jest.fn().mockResolvedValue({ cv_quality: { overall: 60 } });
    const claude = { transcribeDocument: jest.fn().mockResolvedValue(''), reviewCv };
    const subs = {
      getState: jest.fn().mockResolvedValue({ hasActiveSubscription: false, isHired: false }),
    };
    const profiles = {
      findByEmail: jest.fn().mockResolvedValue({ portfolioUrl: 'https://lennygarnier.com' }),
    };
    const portfolioScraper = { fetch: jest.fn().mockResolvedValue({ markdown: 'X' }) };
    const analyses = {
      creditsSince: jest.fn().mockResolvedValue(0),
      countByIp: jest.fn().mockResolvedValue(0),
      saveRegistered: jest.fn().mockResolvedValue({ id: 7 }),
    };
    const creditLedger = {
      getBalance: jest.fn().mockResolvedValue(0),
      consume: jest.fn().mockResolvedValue(undefined),
    };
    const noop = {} as any;
    const uc = new ReviewCvUseCase(
      analyses as any, claude as any, noop, pdf as any, subs as any,
      profiles as any, noop, creditLedger as any, portfolioScraper as any,
      noop, config as any,
    );
    return { uc, reviewCv, analyses, creditLedger, portfolioScraper };
  }

  const auditCmd = {
    cvBuffer: Buffer.from('%PDF-fake'),
    email: 'owner@example.com',
    isRegistered: true,
    auditMode: true,
  };

  it('runs lean, portfolio-off, quota-free for an owner', async () => {
    const { uc, reviewCv, analyses, creditLedger, portfolioScraper } =
      makeUseCase('owner@example.com');
    const out = await uc.execute(auditCmd);

    expect(out.auditMode).toBe(true);
    expect(reviewCv.mock.calls[0][0].lean).toBe(true);
    expect(portfolioScraper.fetch).not.toHaveBeenCalled();
    // Quota bypass: no reserve lookups, no ledger consume.
    expect(analyses.creditsSince).not.toHaveBeenCalled();
    expect(creditLedger.getBalance).not.toHaveBeenCalled();
    expect(creditLedger.consume).not.toHaveBeenCalled();
  });

  it('ignores auditMode for a non-owner (normal quota-counted analysis)', async () => {
    const { uc, reviewCv, analyses } = makeUseCase('someone-else@example.com');
    const out = await uc.execute(auditCmd);

    expect(out.auditMode).toBe(false);
    expect(reviewCv.mock.calls[0][0].lean).toBe(false);
    // Normal path runs the quota reservation.
    expect(analyses.creditsSince).toHaveBeenCalled();
  });
});
