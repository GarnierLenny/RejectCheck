"use client";

import { useState } from "react";
import { Wand2, Loader2, Zap, ScanSearch, TrendingUp, FileWarning, Download, CheckCircle } from "lucide-react";
import { generateCvPdf } from "../../utils/export";
import { CvMarkdownRenderer } from "../CvMarkdownRenderer";
import { useLanguage } from "../../../context/language";
import { PremiumPaywall } from "../PremiumFeature";

type ImproveTabProps = {
  reconstructedCv: string | null;
  isLoading: boolean;
  isPremium: boolean;
  hasAnalysisId: boolean;
  onRewrite: () => void;
};

export function ImproveTab({ reconstructedCv, isLoading, isPremium, hasAnalysisId, onRewrite }: ImproveTabProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { t } = useLanguage();

  async function handleExport() {
    if (!reconstructedCv) return;
    setIsExportingPdf(true);
    try {
      await generateCvPdf(reconstructedCv, "cv-rewritten.pdf");
    } catch {
      // silently fail - user will notice nothing downloaded
    } finally {
      setIsExportingPdf(false);
    }
  }

  if (!isPremium) {
    return (
      <PremiumPaywall
        badge={t.improveTab.premiumBadge}
        title={t.improveTab.premiumTitle}
        description={t.improveTab.premiumDesc}
        ctaLabel={t.improveTab.unlockButton}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-rc-red animate-spin" />
        <p className="font-mono text-[12px] uppercase tracking-widest text-rc-muted">
          {t.improveTab.rewriting}
        </p>
      </div>
    );
  }

  if (reconstructedCv) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-rc-green shrink-0" />
            <p className="text-[15px] font-semibold text-rc-text">{t.improveTab.cvReady}</p>
          </div>
          <button
            onClick={onRewrite}
            className="font-mono text-[10px] uppercase tracking-widest text-rc-hint hover:text-rc-muted transition-colors"
          >
            {t.improveTab.regenerate}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold">{t.improveTab.yourImprovedCv}</p>
          <div className="h-[520px] overflow-y-auto rounded-xl border border-rc-red/20 bg-rc-surface/10 p-6">
            <CvMarkdownRenderer markdown={reconstructedCv} />
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExportingPdf}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/20 font-bold disabled:opacity-50"
        >
          {isExportingPdf
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />
          }
          {t.improveTab.downloadPdf}
        </button>

        <p className="font-mono text-[10px] text-rc-hint leading-relaxed">
          {t.improveTab.pdfNote}
        </p>
      </div>
    );
  }

  // Idle state - premium user, no rewrite yet
  const fixes = [
    { icon: <Zap className="w-3.5 h-3.5 text-rc-red shrink-0 mt-0.5" />, text: t.improveTab.fixes[0].text },
    { icon: <ScanSearch className="w-3.5 h-3.5 text-rc-amber shrink-0 mt-0.5" />, text: t.improveTab.fixes[1].text },
    { icon: <TrendingUp className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />, text: t.improveTab.fixes[2].text },
    { icon: <FileWarning className="w-3.5 h-3.5 text-rc-hint shrink-0 mt-0.5" />, text: t.improveTab.fixes[3].text },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text">
          {t.improveTab.cvFixed.split(',')[0]}, <span className="text-rc-red">{t.improveTab.cvFixed.split(',')[1]?.trim()}</span>
        </h2>
        <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-1">
          {t.improveTab.cvFixedSubtitle}
        </p>
      </div>

      <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">{t.improveTab.whatGetsRewritten}</p>
        {fixes.map((fix, i) => (
          <div key={i} className="flex items-start gap-3">
            {fix.icon}
            <p className="text-[13px] text-rc-text leading-snug">{fix.text}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 p-4 bg-rc-surface/10 border border-rc-border/30 rounded-xl">
        <Wand2 className="w-3.5 h-3.5 text-rc-hint shrink-0 mt-0.5" />
        <p className="font-mono text-[10px] text-rc-hint leading-relaxed">
          {t.improveTab.noFabrication}
        </p>
      </div>

      {!hasAnalysisId ? (
        <p className="text-[13px] text-rc-hint font-mono">{t.improveTab.signInRequired}</p>
      ) : (
        <button
          onClick={onRewrite}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/20 font-bold"
        >
          <Wand2 className="w-4 h-4" />
          {t.improveTab.rewriteButton}
        </button>
      )}
    </div>
  );
}
