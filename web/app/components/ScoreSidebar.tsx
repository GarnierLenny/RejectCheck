import type { AnalysisResult } from "./types";
import { Tooltip } from "./Tooltip";
import { Download, FileDown, RotateCcw } from "lucide-react";

type Props = {
  result: AnalysisResult;
  onReset: () => void;
  onExportPdf: () => void;
  onExportMd: () => void;
  isExportingPdf?: boolean;
};

export function ScoreSidebar({ result, onReset, onExportPdf, onExportMd, isExportingPdf }: Props) {
  const scoreTextClass =
    result.score >= 70 ? "text-rc-red"
    : result.score >= 40 ? "text-rc-amber"
    : "text-rc-green";

  const scoreBgClass =
    result.score >= 70 ? "bg-rc-red"
    : result.score >= 40 ? "bg-rc-amber"
    : "bg-rc-green";

  return (
    <div className="lg:col-span-4 sticky top-[40px] space-y-5">
      {/* Score card */}
      <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-muted">Overall Risk</span>
            <Tooltip text="Aggregate rejection probability based on profile weaknesses, ATS flags, and seniority gaps.">
              <div className="cursor-help opacity-40 hover:opacity-100 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 9V7m0-2h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
            </Tooltip>
          </div>
          <span className={`font-sans text-[14px] px-3 py-1 rounded bg-rc-bg border-[0.5px] ${scoreTextClass} border-current uppercase tracking-widest`}>
            {result.verdict}
          </span>
        </div>

        <div className={`font-mono text-[64px] font-medium leading-none mb-2 ${scoreTextClass}`}>
          {result.score}<span className="text-[24px] opacity-60">%</span>
        </div>

        <div className="h-[2px] bg-rc-text/10 w-full rounded-full overflow-hidden mb-8">
          <div className={`h-full ${scoreBgClass} transition-all duration-1000`} style={{ width: `${result.score}%` }} />
        </div>

        <div className="space-y-2">
          {Object.entries(result.breakdown).map(([key, val]) => {
            const label = key.replace(/_/g, ' ');
            let badge: React.ReactNode;
            if (val === null) {
              badge = (
                <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-rc-border text-rc-hint bg-rc-bg">
                  Not analyzed
                </span>
              );
            } else {
              const [text, cls] =
                val <= 30 ? ["Weak",     "text-rc-red bg-rc-red/10 border-rc-red/20"] :
                val <= 60 ? ["Moderate", "text-rc-amber bg-rc-amber/10 border-rc-amber/20"] :
                val <= 80 ? ["Good",     "text-rc-green bg-rc-green/10 border-rc-green/20"] :
                            ["Strong",   "text-rc-green bg-rc-green/10 border-rc-green/20"];
              badge = (
                <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
                  {text}
                </span>
              );
            }
            return (
              <div key={key} className="flex items-center justify-between py-1.5">
                <span className="font-mono text-[10px] text-rc-muted uppercase tracking-tight">{label}</span>
                {badge}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="flex items-center justify-center gap-2 font-mono text-[10px] text-rc-text bg-rc-surface hover:bg-rc-bg transition-colors py-3 border-[0.5px] border-rc-border rounded-xl uppercase tracking-widest disabled:opacity-50"
        >
          <FileDown size={14} className="text-rc-red" />
          {isExportingPdf ? "Exporting..." : "Export PDF"}
        </button>
        <button
          onClick={onExportMd}
          className="flex items-center justify-center gap-2 font-mono text-[10px] text-rc-text bg-rc-surface hover:bg-rc-bg transition-colors py-3 border-[0.5px] border-rc-border rounded-xl uppercase tracking-widest"
        >
          <Download size={14} className="text-rc-hint" />
          Markdown
        </button>
      </div>

      {/* Confidence card */}
      <div className="bg-rc-surface/50 border-[0.5px] border-rc-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] tracking-widest uppercase text-rc-hint">Model Confidence</span>
          <span className="text-[12px] font-mono font-bold text-rc-text">{result.confidence.score}%</span>
        </div>
        <p className="text-[12px] text-rc-muted leading-relaxed font-sans">{result.confidence.reason}</p>
      </div>

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 font-mono text-[10px] text-rc-hint hover:text-rc-text transition-colors py-3 border-[0.5px] border-rc-border rounded-xl uppercase tracking-widest"
      >
        <RotateCcw size={12} />
        New Profile
      </button>
    </div>
  );
}

