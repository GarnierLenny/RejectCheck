"use client";

import type { AnalysisResult } from "./types";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../context/language";
import { AnalysisLayout } from "./AnalysisLayout";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  result: AnalysisResult;
  analysisId: number | null;
  cvBlobUrl: string | null;
  deepStatus: "pending" | "failed" | "ready";
  isPremium: boolean;
  userPlan?: "free" | "shortlisted" | "hired";
  onReset: () => void;
  onExportMd: () => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
  onShare?: () => void;
  isSharing: boolean;
  reconstructedCv?: string | null;
  isRewriting?: boolean;
  onRewrite?: () => void;
  email?: string | null;
  accessToken?: string | null;
  completedSteps?: number[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DiagnosticResult({
  result,
  analysisId,
  cvBlobUrl,
  deepStatus,
  isPremium,
  userPlan = "free",
  onReset,
  onExportMd,
  onExportPdf,
  isExportingPdf,
  onShare,
  isSharing,
  reconstructedCv = null,
  isRewriting = false,
  onRewrite,
  email = null,
  accessToken = null,
  completedSteps,
}: Props) {
  const { localePath } = useLanguage();

  const role = result.job_details?.title ?? "";
  const company = result.job_details?.company ?? "";

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
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-rc-hint">Diagnosis</span>
              <span className="text-rc-border select-none">·</span>
              <span className="font-sans text-[13px] font-semibold text-rc-text max-w-[280px] truncate">
                {role}{company ? ` · ${company}` : ""}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold px-3 py-[6px] border border-rc-border bg-rc-surface text-rc-hint cursor-pointer hover:text-rc-text hover:border-rc-border/80 transition-colors"
            onClick={onExportMd}
          >
            ↓ MD
          </button>
          <button
            className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold px-3 py-[6px] border border-rc-border bg-rc-surface text-rc-hint cursor-pointer hover:text-rc-text hover:border-rc-border/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onExportPdf}
            disabled={isExportingPdf}
          >
            {isExportingPdf ? "Exporting…" : "↓ PDF"}
          </button>
          {onShare && (
            <button
              className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold px-3 py-[6px] border border-rc-border bg-rc-surface text-rc-hint cursor-pointer hover:text-rc-text hover:border-rc-border/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onShare}
              disabled={isSharing}
            >
              {isSharing ? "…" : "↗ Share"}
            </button>
          )}
          <button
            className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold px-3 py-[6px] border border-rc-text bg-rc-text text-white cursor-pointer hover:bg-rc-muted hover:border-rc-muted transition-colors"
            onClick={onReset}
          >
            ↻ New
          </button>
        </div>
      </nav>

      {/* ── Split panel ── */}
      <AnalysisLayout
        result={result}
        analysisId={analysisId}
        cvBlobUrl={cvBlobUrl}
        deepStatus={deepStatus}
        isPremium={isPremium}
        userPlan={userPlan}
        onReset={onReset}
        reconstructedCv={reconstructedCv}
        isRewriting={isRewriting}
        onRewrite={onRewrite}
        email={email}
        accessToken={accessToken}
        completedSteps={completedSteps}
      />

    </div>
  );
}
