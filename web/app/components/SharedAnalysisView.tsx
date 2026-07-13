"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import Image from "next/image";
import Link from "next/link";
import type { AnalysisResult } from "./types";
import { AnalysisLayout } from "./AnalysisLayout";
import { CvReviewTab } from "./tabs/CvReviewTab";
import { Navbar } from "./Navbar";
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
  const [stickyVisible, setStickyVisible] = useState(false);

  const isCvReview = !!result.cv_quality;

  // The cv-review branch scrolls the window; surface the sticky CTA past the
  // fold. The vs-job branch uses the full-height report shell (internal scroll)
  // and carries its CTA in the topbar instead, so this is a no-op there.
  useEffect(() => {
    function onScroll() {
      setStickyVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    // Risk score: higher = worse (red), so the chip colour matches the meter.
    const scoreColor =
      result.score >= 70
        ? "var(--rc-red)"
        : result.score >= 40
          ? "var(--rc-amber)"
          : "var(--rc-green)";

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
                {result.score}%
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

        <div className="flex-1 min-h-0">
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
      </div>
    );
  }

  // ── cv-review: standalone audit, normal document flow.
  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      {/* Share header */}
      <div className="border-b border-rc-border bg-rc-surface px-5 md:px-[32px] py-5">
        <div className="max-w-[1600px] mx-auto flex items-center gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-rc-red/10 border border-rc-red/30 flex items-center justify-center shrink-0">
              <span className="font-mono text-[13px] font-bold text-rc-red">{initials}</span>
            </div>
          )}
          <p className="font-mono text-[13px] text-rc-text leading-snug">
            <span className="font-bold">{displayName}</span>
            {" "}{t.share.cvScorePhrase}{" "}
            <span className={`font-bold ${result.cv_quality!.overall >= 70 ? "text-rc-green" : result.cv_quality!.overall >= 40 ? "text-rc-amber" : "text-rc-red"}`}>
              {result.cv_quality!.overall}%
            </span>
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] w-[92%] mx-auto pt-9 pb-[80px] px-5 md:px-[32px]">
        <CvReviewTab result={result} />
      </div>

      {/* Sticky CTA bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${stickyVisible ? "translate-y-0" : "translate-y-full"}`}>
        <div className="bg-rc-surface border-t border-rc-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-[1600px] w-[92%] mx-auto px-5 md:px-[32px] py-4 flex items-center justify-between gap-4">
            <p className="text-[13px] text-rc-text leading-snug hidden sm:block">
              {t.share.ctaTextCvReview.replace("{name}", displayName)}
            </p>
            <Link
              href={`/${lang}/analyze`}
              onClick={() => posthog.capture("share_sticky_cta_clicked", { token, mode: "cv-review" })}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center px-6 py-2.5 bg-rc-red text-white font-mono text-[12px] tracking-widest uppercase transition-colors hover:bg-rc-red/90 active:scale-95"
            >
              {t.share.ctaButtonCvReview} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
