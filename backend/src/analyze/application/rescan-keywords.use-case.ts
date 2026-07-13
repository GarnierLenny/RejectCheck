import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ANALYSIS_REPOSITORY, PDF_PARSER } from '../ports/tokens';
import type { AnalysisRepository } from '../ports/analysis.repository';
import type { PdfParser } from '../ports/pdf.parser';
import { AnalysisNotFoundException } from '../../common/exceptions';
import {
  matchKeywords,
  type KeywordMatchResult,
} from '../domain/keyword-match/keyword-match';

/** Below this, the upload is an image/scanned PDF we can't read for free. */
const MIN_CV_TEXT_CHARS = 200;

export type RescanKeywordsCommand = {
  analysisId: number;
  email: string;
  cvBuffer: Buffer;
  cvMimeType?: string;
};

export type RescanTimelinePoint = {
  coverageScore: number;
  matchedCount: number;
  totalCount: number;
  createdAt: Date;
};

export type RescanKeywordsResult = {
  /** Deterministic match of the ORIGINAL CV against the (unchanged) JD. */
  baseline: KeywordMatchResult;
  /** Deterministic match of the CORRECTED CV against the same JD. */
  current: KeywordMatchResult;
  coverageBefore: number;
  coverageAfter: number;
  coverageDelta: number;
  /** All attempts so far (incl. this one), oldest first — the climb chart. */
  timeline: RescanTimelinePoint[];
  createdAt: Date;
};

/**
 * FREE, LLM-free keyword re-scan (the retention loop). The user re-uploads a
 * corrected CV; we re-run the deterministic keyword match against the analysis's
 * stored job description and record the new coverage so the UI can show the
 * score climbing. No credits, no Claude call — just the pure matcher.
 *
 * A full (paid) re-analysis with fresh narrative/fixes is a separate flow
 * (POST :id/rescan → AnalyzeCvUseCase with parentAnalysisId).
 */
@Injectable()
export class RescanKeywordsUseCase {
  private readonly logger = new Logger(RescanKeywordsUseCase.name);

  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(PDF_PARSER) private readonly pdf: PdfParser,
  ) {}

  async execute(cmd: RescanKeywordsCommand): Promise<RescanKeywordsResult> {
    // findDetailById is already scoped to (id, email) — ownership proven here.
    const detail = await this.analyses.findDetailById(cmd.analysisId, cmd.email);
    if (!detail) throw new AnalysisNotFoundException(cmd.analysisId);

    const jd = detail.jobDescription?.trim();
    if (!jd) {
      throw new BadRequestException(
        'This analysis has no job description to re-scan against.',
      );
    }

    // Free path: text-based PDFs only. No OCR (that would cost a vision call and
    // break the "free" promise). Point image/scanned uploads at the full re-scan.
    const newCvText = await this.pdf.parse(cmd.cvBuffer).catch(() => '');
    if (newCvText.trim().length < MIN_CV_TEXT_CHARS) {
      throw new BadRequestException(
        "We couldn't read enough text from that file. Upload a text-based PDF, or run a full re-scan (it can read images).",
      );
    }

    const current = matchKeywords(jd, newCvText);
    if (current.coverageScore === null) {
      throw new BadRequestException(
        "This job doesn't list any recognised skills, so there's no keyword coverage to track. A full re-scan still works.",
      );
    }

    const baseline = this.resolveBaseline(detail.keywordMatch, jd, detail.cvText, current);
    // Same JD → same keyword set, so a non-null current guarantees a non-null
    // baseline. Coalesce defensively anyway.
    const coverageBefore = baseline.coverageScore ?? current.coverageScore;
    const coverageAfter = current.coverageScore;

    // Backfill the baseline onto the analysis so future re-scans and the result
    // view read a stored value. Best-effort — never fail the re-scan for it.
    if (!detail.keywordMatch) {
      await this.analyses
        .attachKeywordMatch(cmd.analysisId, cmd.email, baseline)
        .catch((err) =>
          this.logger.warn(
            `keyword-match backfill failed (id=${cmd.analysisId}): ${err?.message || err}`,
          ),
        );
    }

    const { createdAt } = await this.analyses.createRescan({
      analysisId: cmd.analysisId,
      coverageScore: coverageAfter,
      matchedCount: current.matchedCount,
      totalCount: current.totalCount,
      keywordMatch: current,
    });

    const rows = await this.analyses.listRescans(cmd.analysisId);
    const timeline: RescanTimelinePoint[] = rows.map((r) => ({
      coverageScore: r.coverageScore,
      matchedCount: r.matchedCount,
      totalCount: r.totalCount,
      createdAt: r.createdAt,
    }));

    return {
      baseline,
      current,
      coverageBefore,
      coverageAfter,
      coverageDelta: coverageAfter - coverageBefore,
      timeline,
      createdAt,
    };
  }

  /**
   * The baseline to diff against: the stored snapshot if present, else recomputed
   * from the original CV text, else the current result (0 delta) when the
   * original text is gone (legacy/scrubbed rows).
   */
  private resolveBaseline(
    stored: KeywordMatchResult | null,
    jd: string,
    originalCvText: string | null,
    current: KeywordMatchResult,
  ): KeywordMatchResult {
    if (stored) return stored;
    if (originalCvText && originalCvText.trim()) {
      return matchKeywords(jd, originalCvText);
    }
    return current;
  }
}
