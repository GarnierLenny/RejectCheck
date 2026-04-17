import type { AnalysisResult } from "./types";
import { Tooltip } from "./Tooltip";
import { Download, FileDown, RotateCcw } from "lucide-react";
import { useLanguage } from "../../context/language";

type Props = {
  result: AnalysisResult;
  onReset: () => void;
  onExportPdf: () => void;
  onExportMd: () => void;
  isExportingPdf?: boolean;
};

export function ScoreSidebar({ result, onReset, onExportPdf, onExportMd, isExportingPdf }: Props) {
  const { t } = useLanguage();
  const scoreTextClass =
    result.score >= 70 ? "text-rc-red"
    : result.score >= 40 ? "text-rc-amber"
    : "text-rc-green";

  const scoreBgClass =
    result.score >= 70 ? "bg-rc-red"
    : result.score >= 40 ? "bg-rc-amber"
    : "bg-rc-green";

  return (
    <div className="bg-rc-surface border border-rc-border overflow-hidden mb-8">
      {/* Top bar: label + export actions */}
      <div className="px-8 py-4 border-b border-rc-border bg-rc-surface-hero flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] tracking-[0.15em] uppercase text-rc-hint">{t.scoreSidebar.overallRisk}</span>
          <Tooltip text={t.scoreSidebar.tooltipText}>
            <div className="cursor-help opacity-40 hover:opacity-100 transition-opacity">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 9V7m0-2h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 font-mono text-[11px] text-rc-hint hover:text-rc-text transition-colors px-3 py-1.5 border border-rc-border bg-rc-surface uppercase tracking-wider disabled:opacity-50"
          >
            <FileDown size={12} className="text-rc-red" />
            {isExportingPdf ? t.scoreSidebar.exporting : "PDF"}
          </button>
          <button
            onClick={onExportMd}
            className="flex items-center gap-1.5 font-mono text-[11px] text-rc-hint hover:text-rc-text transition-colors px-3 py-1.5 border border-rc-border bg-rc-surface uppercase tracking-wider"
          >
            <Download size={12} />
            .md
          </button>
        </div>
      </div>

      {/* Score + Breakdown body */}
      <div className="flex flex-col lg:flex-row">
        {/* Left: large score + verdict + bar */}
        <div className="px-8 py-8 lg:w-[300px] shrink-0 border-b lg:border-b-0 lg:border-r border-rc-border flex flex-col justify-center">
          <div className={`font-mono font-medium leading-none tracking-tight ${scoreTextClass}`} style={{ fontSize: '88px', lineHeight: 1 }}>
            {result.score}<span style={{ fontSize: '28px' }} className="opacity-40">%</span>
          </div>
          <div className="mt-5 mb-6">
            <span className={`font-mono text-[13px] px-4 py-1.5 border uppercase tracking-widest ${scoreTextClass} border-current`}>
              {t.scoreSidebar.verdicts[result.verdict] ?? result.verdict} {t.scoreSidebar.risk}
            </span>
          </div>
          <div className="h-[4px] bg-rc-text/10 w-full overflow-hidden">
            <div className={`h-full ${scoreBgClass} transition-all duration-1000`} style={{ width: `${result.score}%` }} />
          </div>
        </div>

        {/* Right: breakdown metric rows */}
        <div className="flex-1 px-8 py-8">
          <div className="space-y-5">
            {Object.entries(result.breakdown).map(([key, val]) => {
              const bl = t.scoreSidebar.breakdownLabels;
              const label = bl[key as keyof typeof bl] ?? key.replace(/_/g, ' ');
              let badge: React.ReactNode;
              if (val === null) {
                badge = (
                  <span className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 border border-rc-border text-rc-hint bg-rc-bg">
                    N/A
                  </span>
                );
              } else {
                const [text, cls] =
                  val <= 30 ? [t.scoreSidebar.strength.weak,     "text-rc-red bg-rc-red/10 border-rc-red/20"] :
                  val <= 60 ? [t.scoreSidebar.strength.moderate, "text-rc-amber bg-rc-amber/10 border-rc-amber/20"] :
                  val <= 80 ? [t.scoreSidebar.strength.good,     "text-rc-green bg-rc-green/10 border-rc-green/20"] :
                              [t.scoreSidebar.strength.strong,   "text-rc-green bg-rc-green/10 border-rc-green/20"];
                badge = (
                  <span className={`font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 border ${cls}`}>
                    {text}
                  </span>
                );
              }
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] text-rc-hint uppercase tracking-tight">{label}</span>
                    {badge}
                  </div>
                  {val !== null && (
                    <div className="h-[3px] bg-rc-text/8 w-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          val <= 30 ? 'bg-rc-red' : val <= 60 ? 'bg-rc-amber' : 'bg-rc-green'
                        }`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: confidence + reset */}
      <div className="px-8 py-5 border-t border-rc-border bg-rc-surface-hero flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-[14px] text-rc-muted leading-snug max-w-[680px]">
          <span className="font-semibold text-rc-text">{t.scoreSidebar.modelConfidence} {result.confidence.score}%</span>
          {" — "}
          {result.confidence.reason}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 font-mono text-[12px] text-rc-hint hover:text-rc-text transition-colors uppercase tracking-wider shrink-0"
        >
          <RotateCcw size={13} />
          {t.scoreSidebar.newProfile}
        </button>
      </div>
    </div>
  );
}
