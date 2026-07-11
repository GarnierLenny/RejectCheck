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
