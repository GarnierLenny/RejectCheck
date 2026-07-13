import { BadRequestException } from '@nestjs/common';
import { RescanKeywordsUseCase } from './rescan-keywords.use-case';
import { AnalysisNotFoundException } from '../../common/exceptions';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { PdfParser } from '../ports/pdf.parser';
import { matchKeywords } from '../domain/keyword-match/keyword-match';

const JD = 'We need React and TypeScript. Docker is required.';
const ORIGINAL_CV = 'I know React.';
const CORRECTED_CV = 'I know React, TypeScript and Docker. '.repeat(20); // > 200 chars

type Detail = {
  jobDescription: string | null;
  cvText: string | null;
  keywordMatch: ReturnType<typeof matchKeywords> | null;
};

function build(opts: {
  detail?: Detail | null;
  parsedCv?: string;
} = {}) {
  const detail =
    opts.detail === undefined
      ? { jobDescription: JD, cvText: ORIGINAL_CV, keywordMatch: null }
      : opts.detail;

  const analyses = {
    findDetailById: jest.fn().mockResolvedValue(detail),
    attachKeywordMatch: jest.fn().mockResolvedValue(undefined),
    createRescan: jest
      .fn()
      .mockResolvedValue({ id: 1, createdAt: new Date('2026-07-12T00:00:00Z') }),
    listRescans: jest.fn().mockResolvedValue([
      {
        id: 1,
        coverageScore: 100,
        matchedCount: 3,
        totalCount: 3,
        keywordMatch: matchKeywords(JD, CORRECTED_CV),
        createdAt: new Date('2026-07-12T00:00:00Z'),
      },
    ]),
  } as unknown as AnalysisRepository;

  const pdf = {
    parse: jest.fn().mockResolvedValue(opts.parsedCv ?? CORRECTED_CV),
    parseFormatted: jest.fn(),
  } as unknown as PdfParser;

  return { uc: new RescanKeywordsUseCase(analyses, pdf), analyses, pdf };
}

const cmd = {
  analysisId: 42,
  email: 'a@b.com',
  cvBuffer: Buffer.from('pdf'),
  cvMimeType: 'application/pdf',
};

describe('RescanKeywordsUseCase', () => {
  it('recomputes the baseline from the original CV, backfills it, and reports the climb', async () => {
    const { uc, analyses } = build();
    const r = await uc.execute(cmd);

    // React only in the original → 1/(1+1+2 weights) = 25.
    expect(r.coverageBefore).toBe(25);
    // Corrected CV has all three → 100.
    expect(r.coverageAfter).toBe(100);
    expect(r.coverageDelta).toBe(75);

    // Baseline was null → backfilled onto the analysis.
    expect(analyses.attachKeywordMatch).toHaveBeenCalledWith(42, 'a@b.com', expect.any(Object));
    // New attempt recorded + timeline returned.
    expect(analyses.createRescan).toHaveBeenCalledWith(
      expect.objectContaining({ analysisId: 42, coverageScore: 100 }),
    );
    expect(r.timeline).toHaveLength(1);
  });

  it('uses the stored baseline without recomputing/backfilling when present', async () => {
    const stored = matchKeywords(JD, ORIGINAL_CV);
    const { uc, analyses } = build({
      detail: { jobDescription: JD, cvText: ORIGINAL_CV, keywordMatch: stored },
    });
    const r = await uc.execute(cmd);
    expect(r.baseline).toEqual(stored);
    expect(analyses.attachKeywordMatch).not.toHaveBeenCalled();
  });

  it('throws NotFound when the analysis is not owned by the caller', async () => {
    const { uc } = build({ detail: null });
    await expect(uc.execute(cmd)).rejects.toBeInstanceOf(AnalysisNotFoundException);
  });

  it('rejects an analysis with no job description (CV-review rows)', async () => {
    const { uc } = build({
      detail: { jobDescription: null, cvText: ORIGINAL_CV, keywordMatch: null },
    });
    await expect(uc.execute(cmd)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unreadable / image upload (free path has no OCR)', async () => {
    const { uc, analyses } = build({ parsedCv: 'too short' });
    await expect(uc.execute(cmd)).rejects.toBeInstanceOf(BadRequestException);
    expect(analyses.createRescan).not.toHaveBeenCalled();
  });

  it('rejects a job with no recognised skills to track', async () => {
    const { uc } = build({
      detail: {
        jobDescription: 'Warm empathetic barista wanted, loves people.',
        cvText: 'I smile a lot and make coffee.',
        keywordMatch: null,
      },
      parsedCv: 'I smile a lot and make great coffee for everyone. '.repeat(10),
    });
    await expect(uc.execute(cmd)).rejects.toBeInstanceOf(BadRequestException);
  });
});
