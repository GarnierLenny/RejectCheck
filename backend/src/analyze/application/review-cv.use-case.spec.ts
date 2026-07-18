import { BadRequestException } from '@nestjs/common';
import { ReviewCvUseCase } from './review-cv.use-case';
import { CvReviewResponseSchema } from '../dto/cv-review-response.dto';
import { anchorCvQuality } from '../domain/score/compose-cv-review-score';

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

  it('does NOT scrape the profile portfolio when the flag is on but useOwnProfile is unset (stranger audit, id=82 guard)', async () => {
    const { uc, portfolioScraper, reviewCv } = makeRegisteredUseCase('true');
    await uc.execute(cmd); // no useOwnProfile -> request-scoped, never touch owner data
    expect(portfolioScraper.fetch).not.toHaveBeenCalled();
    expect(reviewCv.mock.calls[0][0].portfolioUrl).toBeNull();
  });

  it('scrapes the profile portfolio only when useOwnProfile AND the flag are set', async () => {
    const { uc, portfolioScraper } = makeRegisteredUseCase('true');
    await uc.execute({ ...cmd, useOwnProfile: true });
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

/**
 * The per-role experience_analysis block (CV-audit redesign, PR1):
 *  - the DTO accepts and preserves the new fields (the zod parse strips unknown
 *    keys, so a DTO lagging the tool schema would silently drop the section);
 *  - the anchored quality score is IDENTICAL with and without it: the 5-level
 *    finding severities are display-only, composePenalty never reads them;
 *  - pre-migration rows (no experience_analysis, no expected on radar axes)
 *    still parse (backward compat).
 */
describe('ReviewCvUseCase: experience_analysis DTO + score invariance', () => {
  const experienceAnalysis = [
    {
      company: 'Acme',
      title: 'Senior Backend Engineer',
      start: '2022-03',
      end: 'present',
      sources: ['cv'],
      seniority_read: 'mid',
      seniority_alignment: 'below_title',
      ratings: { scope: 3, ownership: 4, impact: 2 },
      hard_skills: [
        { name: 'Node.js', status: 'proven', evidence: 'Shipped the payments API in Node' },
        { name: 'Kubernetes', status: 'claimed', evidence: null },
      ],
      soft_skills: [{ name: 'Mentoring', status: 'claimed', evidence: null }],
      findings: [
        // A critical here must NOT feed the score penalty (local enum).
        { severity: 'critical', what: 'Claims a rewrite the dates make impossible', why: 'Reads as fabrication' },
        { severity: 'medium', what: 'Main deliverable has no outcome', why: 'Recruiter cannot size the impact' },
        { severity: 'info', what: 'Payments migration is a strong anchor', why: 'Lead the role with it' },
      ],
      margin_note: 'Solid ownership, but nothing tells me it mattered.',
    },
    {
      company: 'Globex',
      title: 'Backend Developer',
      start: null,
      end: null,
      sources: ['cv'],
      seniority_read: 'junior',
      seniority_alignment: 'matches_title',
      ratings: { scope: 2, ownership: 2, impact: 1 },
      hard_skills: [],
      soft_skills: [],
      findings: [],
      margin_note: 'Undated and thin: reads like filler.',
    },
  ];

  function fixture(withExperience: boolean) {
    return {
      score: 55,
      cv_quality: {
        overall: 55,
        clarity: 60,
        impact: 45,
        hard_skills: 55,
        soft_skills: 50,
        consistency: 65,
        ats_format: 70,
      },
      skill_radar: {
        axes: [
          { label: 'Backend', score: 70, expected: 75, evidence: '4 years Node.js across 2 companies' },
          { label: 'Frontend', score: 40, expected: 55, evidence: 'React mentioned once, side project' },
          { label: 'DevOps', score: 30, expected: 50, evidence: 'No infra bullets anywhere' },
          { label: 'Leadership', score: 35, expected: 45, evidence: 'No team-size or mentoring bullets' },
        ],
      },
      projected_profile: {
        seniority: 'mid',
        target_roles: ['Backend Developer'],
        domains: ['B2B SaaS'],
        narrative: 'A backend developer with ownership but no proof of impact.',
        profile_type: 'specialist',
      },
      ats_audit: { score: 70, issues: [] },
      seniority_analysis: {
        expected: 'mid',
        detected: 'senior',
        gap: 'The title says senior but the bullets read mid.',
        strength: 'Owned a service end to end.',
      },
      cv_tone: { detected: 'mixed', examples: [], rewrites: [] },
      audit: {
        cv: {
          score: 55,
          issues: [
            { severity: 'critical', category: 'impact', what: 'No metrics anywhere', why: 'Reads unproven' },
          ],
        },
        github: { score: null, issues: [] },
        linkedin: { score: null, issues: [] },
      },
      hidden_red_flags: [{ flag: 'gap', perception: '9 months unexplained' }],
      ...(withExperience ? { experience_analysis: experienceAnalysis } : {}),
    };
  }

  it('parses and preserves experience_analysis and expected through the DTO', () => {
    const parsed = CvReviewResponseSchema.parse(fixture(true));
    expect(parsed.experience_analysis).toEqual(experienceAnalysis);
    expect(parsed.skill_radar?.axes[0].expected).toBe(75);
  });

  it('anchored quality score is identical with and without experience_analysis', () => {
    // Mirror of the provider's penalty wiring (anthropic-claude.provider.ts):
    // experience_analysis findings are absent from it BY DESIGN.
    const countCritical = (arr: unknown): number =>
      (Array.isArray(arr) ? arr : []).filter(
        (x) => (x as { severity?: string })?.severity === 'critical',
      ).length;
    const anchor = (r: ReturnType<typeof fixture>) =>
      anchorCvQuality(r.cv_quality, {
        redFlagCount: r.hidden_red_flags.length,
        criticalIssueCount:
          countCritical(r.audit.cv.issues) +
          countCritical(r.audit.github.issues) +
          countCritical(r.audit.linkedin.issues),
        fatalBulletCount: 0,
      });
    expect(anchor(fixture(true))).toEqual(anchor(fixture(false)));
  });

  it('backward compat: a pre-migration row without the new fields parses', () => {
    const legacy = fixture(false);
    // Old rows also predate `expected` on the radar axes.
    legacy.skill_radar.axes = legacy.skill_radar.axes.map(
      ({ expected: _e, ...axis }) => axis,
    ) as typeof legacy.skill_radar.axes;
    const parsed = CvReviewResponseSchema.parse(legacy);
    expect(parsed.experience_analysis).toBeUndefined();
    expect(parsed.skill_radar?.axes[0]).not.toHaveProperty('expected');
  });
});
