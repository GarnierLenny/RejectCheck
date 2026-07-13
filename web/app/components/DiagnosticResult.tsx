"use client";

import type { AnalysisResult } from "./types";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../context/language";
import { AnalysisLayout } from "./AnalysisLayout";
import { ResultSignupNudge } from "./ResultSignupNudge";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  result: AnalysisResult;
  analysisId: number | null;
  cvBlobUrl: string | null;
  liBlobUrl?: string | null;
  mlBlobUrl?: string | null;
  // "pending" while the single pass is still streaming the actionable
  // sections; "ready" once complete.
  deepStatus: "pending" | "ready";
  isPremium: boolean;
  userPlan?: "free" | "shortlisted" | "hired";
  premiumUnlocked?: boolean;
  onUnlockRewrite?: () => void;
  isUnlocking?: boolean;
  onReset: () => void;
  onExportMd: () => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
  onShare?: () => void;
  isSharing: boolean;
  reconstructedCv?: string | null;
  liText?: string | null;
  coverLetterText?: string | null;
  isRewriting?: boolean;
  onRewrite?: () => void;
  email?: string | null;
  accessToken?: string | null;
  completedSteps?: number[];
  isAnonymous?: boolean;
  cvTextFormatted?: string | null;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DiagnosticResult({
  result,
  analysisId,
  cvBlobUrl,
  liBlobUrl = null,
  mlBlobUrl = null,
  deepStatus,
  isPremium,
  userPlan = "free",
  premiumUnlocked = false,
  onUnlockRewrite,
  isUnlocking = false,
  onReset,
  onExportMd,
  onExportPdf,
  isExportingPdf,
  onShare,
  isSharing,
  reconstructedCv = null,
  liText = null,
  coverLetterText = null,
  isRewriting = false,
  onRewrite,
  email = null,
  accessToken = null,
  completedSteps,
  isAnonymous = false,
  cvTextFormatted = null,
}: Props) {
  const { t, localePath } = useLanguage();

  const role = result.job_details?.title ?? "";
  const company = result.job_details?.company ?? "";

  const btn = (primary = false): React.CSSProperties => ({
    fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", padding: "7px 12px",
    border: `1px solid ${primary ? "var(--rc-text)" : "var(--rc-border)"}`,
    borderRadius: 4, cursor: "pointer",
    background: primary ? "var(--rc-text)" : "var(--rc-surface)",
    color: primary ? "#fff" : "var(--rc-hint)",
    display: "inline-flex", alignItems: "center", gap: 6,
    whiteSpace: "nowrap" as const, transition: "all 150ms ease",
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-rc-bg text-rc-text">

      {/* ── Topbar ── */}
      <nav className="flex-shrink-0 z-60 flex items-center justify-between px-8 h-[54px] bg-rc-bg/85 backdrop-blur-sm border-b border-rc-border">
        <div className="flex items-center gap-5">
          <Link href={localePath("/")} className="flex items-center gap-2.5 no-underline">
            <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={24} height={24} />
            <span className="font-sans font-semibold text-[14px] text-rc-text">RejectCheck</span>
          </Link>
          {(role || company) && (
            <div className="flex items-center gap-2 pl-4 border-l border-rc-border">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-rc-hint">{t.analysisLayout.diagnosis}</span>
              <span className="text-rc-border select-none">·</span>
              <span className="font-sans text-[13px] font-semibold text-rc-text max-w-[280px] truncate">
                {role}{company ? ` · ${company}` : ""}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={btn()} onClick={onExportMd}>{t.analysisLayout.exportMd}</button>
          <button style={{ ...btn(), opacity: isExportingPdf ? 0.4 : 1, cursor: isExportingPdf ? "not-allowed" : "pointer" }} onClick={onExportPdf} disabled={isExportingPdf}>
            {isExportingPdf ? t.analysisLayout.exportingPdf : t.analysisLayout.exportPdf}
          </button>
          {onShare && (
            <button style={{ ...btn(), opacity: isSharing ? 0.4 : 1, cursor: isSharing ? "not-allowed" : "pointer" }} onClick={onShare} disabled={isSharing}>
              {isSharing ? t.analysisLayout.sharing : t.analysisLayout.share}
            </button>
          )}
          <button style={btn(true)} onClick={onReset}>{t.analysisLayout.newAnalysis}</button>
        </div>
      </nav>

      {/* ── Split panel ── */}
      <AnalysisLayout
        result={result}
        analysisId={analysisId}
        cvBlobUrl={cvBlobUrl}
        liBlobUrl={liBlobUrl}
        mlBlobUrl={mlBlobUrl}
        deepStatus={deepStatus}
        isPremium={isPremium}
        userPlan={userPlan}
        premiumUnlocked={premiumUnlocked}
        onUnlockRewrite={onUnlockRewrite}
        isUnlocking={isUnlocking}
        onReset={onReset}
        reconstructedCv={reconstructedCv}
        liText={liText}
        coverLetterText={coverLetterText}
        isRewriting={isRewriting}
        onRewrite={onRewrite}
        email={email}
        accessToken={accessToken}
        completedSteps={completedSteps}
        cvTextFormatted={cvTextFormatted}
      />

      {isAnonymous && <ResultSignupNudge />}
    </div>
  );
}
