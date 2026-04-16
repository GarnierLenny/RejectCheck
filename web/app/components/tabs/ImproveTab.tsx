"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Wand2, Loader2, Zap, ScanSearch, TrendingUp, FileWarning, Download, CheckCircle } from "lucide-react";
import { generateCvPdf } from "../../utils/export";
import { CvMarkdownRenderer } from "../CvMarkdownRenderer";

type ImproveTabProps = {
  reconstructedCv: string | null;
  isLoading: boolean;
  isPremium: boolean;
  hasAnalysisId: boolean;
  onRewrite: () => void;
};

export function ImproveTab({ reconstructedCv, isLoading, isPremium, hasAnalysisId, onRewrite }: ImproveTabProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  async function handleExport() {
    if (!reconstructedCv) return;
    setIsExportingPdf(true);
    try {
      await generateCvPdf(reconstructedCv, "cv-rewritten.pdf");
    } catch {
      // silently fail — user will notice nothing downloaded
    } finally {
      setIsExportingPdf(false);
    }
  }

  if (!isPremium) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-rc-surface border border-rc-border rounded-[24px] p-8 md:p-12 w-full max-w-[520px] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rc-red/40 to-transparent" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-red/5 border border-rc-red/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">Premium Feature</span>
          </div>
          <h3 className="text-2xl font-bold text-rc-text mb-3 tracking-tight">
            Let AI rewrite your CV
          </h3>
          <p className="text-[15px] text-rc-muted mb-8 leading-relaxed">
            Based on every issue found in this analysis, AI surgically rewrites your CV — injecting missing keywords, fixing passive tone, and adding seniority signals. Download the result as a formatted PDF.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/20 no-underline font-bold"
          >
            Unlock Improve CV <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-rc-red animate-spin" />
        <p className="font-mono text-[12px] uppercase tracking-widest text-rc-muted">
          Rewriting your CV...
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
            <p className="text-[15px] font-semibold text-rc-text">Your improved CV is ready.</p>
          </div>
          <button
            onClick={onRewrite}
            className="font-mono text-[10px] uppercase tracking-widest text-rc-hint hover:text-rc-muted transition-colors"
          >
            Regenerate
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold">✦ Your improved CV</p>
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
          Download PDF
        </button>

        <p className="font-mono text-[10px] text-rc-hint leading-relaxed">
          The PDF is formatted as a standard CV. Open it in any PDF viewer or send it directly to recruiters.
        </p>
      </div>
    );
  }

  // Idle state — premium user, no rewrite yet
  const fixes = [
    { icon: <Zap className="w-3.5 h-3.5 text-rc-red shrink-0 mt-0.5" />, text: <>Passive bullets <strong>rewritten</strong>. &quot;responsible for&quot; becomes <strong>Led</strong>, <strong>Built</strong>, <strong>Reduced</strong>.</> },
    { icon: <ScanSearch className="w-3.5 h-3.5 text-rc-amber shrink-0 mt-0.5" />, text: <><strong>Missing ATS keywords</strong> injected naturally into your existing content. No keyword dumping.</> },
    { icon: <TrendingUp className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />, text: <><strong>Seniority signals</strong> added. Scope, ownership, and impact language where the scan flagged gaps.</> },
    { icon: <FileWarning className="w-3.5 h-3.5 text-rc-hint shrink-0 mt-0.5" />, text: <><strong>CV audit issues</strong> addressed. Structure and clarity fixes on the flagged sections only.</> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text">
          Your CV, <span className="text-rc-red">fixed.</span>
        </h2>
        <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-1">
          Surgical rewrites based on what this scan actually found
        </p>
      </div>

      <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">What gets rewritten</p>
        {fixes.map((fix, i) => (
          <div key={i} className="flex items-start gap-3">
            {fix.icon}
            <p className="text-[13px] text-rc-text leading-snug [&_strong]:font-semibold [&_strong]:text-rc-text">{fix.text}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 p-4 bg-rc-surface/10 border border-rc-border/30 rounded-xl">
        <Wand2 className="w-3.5 h-3.5 text-rc-hint shrink-0 mt-0.5" />
        <p className="font-mono text-[10px] text-rc-hint leading-relaxed">
          Nothing is fabricated. Every change traces back to a specific problem found in this scan. Your voice stays intact.
        </p>
      </div>

      {!hasAnalysisId ? (
        <p className="text-[13px] text-rc-hint font-mono">Sign in to enable CV rewriting.</p>
      ) : (
        <button
          onClick={onRewrite}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/20 font-bold"
        >
          <Wand2 className="w-4 h-4" />
          Rewrite my CV
        </button>
      )}
    </div>
  );
}
