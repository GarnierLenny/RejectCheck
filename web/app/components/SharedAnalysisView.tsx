"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import Image from "next/image";
import Link from "next/link";
import type { AnalysisResult } from "./types";
import { AnalysisLayout } from "./AnalysisLayout";
import { CvAuditResult } from "./CvAuditResult";
import { useLanguage } from "../../context/language";

type Props = {
  result: AnalysisResult;
  jobLabel: string | null;
  company: string | null;
  profile: { displayName: string | null; avatarUrl: string | null } | null;
  lang: string;
  token: string;
  cvTextFormatted?: string | null;
  cvFileUrl?: string | null;
  linkedinTextFormatted?: string | null;
  liFileUrl?: string | null;
  coverLetter?: string | null;
  mlFileUrl?: string | null;
};

export function SharedAnalysisView({
  result,
  jobLabel,
  company,
  profile,
  lang,
  token,
  cvTextFormatted = null,
  cvFileUrl = null,
  linkedinTextFormatted = null,
  liFileUrl = null,
  coverLetter = null,
  mlFileUrl = null,
}: Props) {
  const { t } = useLanguage();

  const isCvReview = !!result.cv_quality;

  useEffect(() => {
    posthog.capture("share_link_visited", {
      token,
      mode: isCvReview ? "cv-review" : "vs-job",
      score: isCvReview ? result.cv_quality!.overall : result.score,
      has_position: !!(jobLabel || company),
      lang,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noop = () => {};

  const displayName = profile?.displayName ?? "Someone";
  const avatarUrl = profile?.avatarUrl ?? null;
  const initials = displayName.slice(0, 2).toUpperCase();
  const positionLabel = [jobLabel, company].filter(Boolean).join(" @ ");

  const avatar = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={displayName}
      width={28}
      height={28}
      className="rounded-full object-cover w-7 h-7 shrink-0"
    />
  ) : (
    <div className="w-7 h-7 rounded-full bg-rc-red/10 border border-rc-red/30 flex items-center justify-center shrink-0">
      <span className="font-mono text-[11px] font-bold text-rc-red">{initials}</span>
    </div>
  );

  // ── vs-job: the full narrative report, read-only — same layout the owner sees.
  if (!isCvReview) {
    // Competitiveness = 100 − rejection risk: higher = better (green), matching the meter.
    const comp = 100 - result.score;
    const scoreColor =
      comp >= 67
        ? "var(--rc-green)"
        : comp >= 34
          ? "var(--rc-amber)"
          : "var(--rc-red)";

    return (
      <div className="h-screen flex flex-col overflow-hidden bg-rc-bg text-rc-text font-sans">
        {/* Topbar (mirrors DiagnosticResult) — owner attribution + convert CTA */}
        <nav className="flex-shrink-0 z-60 flex items-center justify-between gap-4 px-5 md:px-8 h-[54px] bg-rc-bg/85 backdrop-blur-sm border-b border-rc-border">
          <div className="flex items-center gap-4 min-w-0">
            <Link href={`/${lang}`} className="flex items-center gap-2.5 no-underline shrink-0">
              <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={24} height={24} />
              <span className="font-sans font-semibold text-[14px] text-rc-text hidden sm:inline">RejectCheck</span>
            </Link>
            <div className="flex items-center gap-2.5 pl-4 border-l border-rc-border min-w-0">
              {avatar}
              <span className="font-mono text-[12px] text-rc-hint truncate min-w-0">
                <span className="font-bold text-rc-text">{displayName}</span>
                {positionLabel ? <span className="hidden md:inline"> · {positionLabel}</span> : null}
              </span>
              <span className="font-mono text-[13px] font-bold shrink-0" style={{ color: scoreColor }}>
                {comp}
              </span>
            </div>
          </div>
          <Link
            href={`/${lang}/analyze`}
            onClick={() => posthog.capture("share_sticky_cta_clicked", { token, mode: "vs-job" })}
            className="shrink-0 inline-flex items-center justify-center px-4 md:px-5 py-2 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase transition-colors hover:bg-rc-red/90 active:scale-95"
          >
            {t.share.ctaButton} →
          </Link>
        </nav>

        {/* No wrapper here: AnalysisShell's root is itself the `flex-1` child that
            bounds the report's height (like the owner view). A block wrapper in
            between kills that flex-1 and the report loses its inner scroll. */}
        <AnalysisLayout
          readOnly
          result={result}
          analysisId={null}
          cvBlobUrl={cvFileUrl}
          liBlobUrl={liFileUrl}
          mlBlobUrl={mlFileUrl}
          /* Parsed text drives the highlighted CV view (default) in the left
             doc panel — exactly what the owner sees. */
          reconstructedCv={cvTextFormatted}
          cvTextFormatted={cvTextFormatted}
          liText={linkedinTextFormatted}
          coverLetterText={coverLetter}
          deepStatus="ready"
          isPremium={false}
          userPlan="free"
          onReset={noop}
        />
      </div>
    );
  }

  // ── cv-review: the same full CV-audit view the owner sees, read-only.
  return (
    <CvAuditResult
      readOnly
      result={result}
      analysisId={null}
      cvBlobUrl={cvFileUrl}
      liBlobUrl={liFileUrl}
      mlBlobUrl={mlFileUrl}
      reconstructedCv={cvTextFormatted}
      liText={linkedinTextFormatted}
      onReset={noop}
      onExportMd={noop}
      isSharing={false}
      userPlan="free"
      sharedByName={profile?.displayName ?? null}
      sharedByAvatar={avatarUrl}
      ctaHref={`/${lang}/analyze`}
    />
  );
}
