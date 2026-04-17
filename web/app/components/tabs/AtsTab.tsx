"use client";

import type { AnalysisResult } from "../types";
import { SectionHeader } from "../SectionHeader";
import { useLanguage } from "../../../context/language";

type Keyword = AnalysisResult["ats_simulation"]["critical_missing_keywords"][number];

type Props = {
  ats: AnalysisResult["ats_simulation"];
  checkedKeywords: Set<string>;
  onToggle: (kw: string) => void;
  onReset: () => void;
};

const ATS_THRESHOLD_FALLBACK = 70;

function KeywordRow({ kw, checked, onToggle, accent, maxImpact }: { kw: Keyword; checked: boolean; onToggle: () => void; accent: string; maxImpact: number }) {
  const { t } = useLanguage();
  const impactPct = maxImpact > 0 ? Math.round((kw.score_impact / maxImpact) * 100) : 0;
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-rc-green border-rc-green' : 'border-rc-border group-hover:border-rc-green/50'}`}
        onClick={onToggle}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className={`text-[16px] font-medium transition-colors ${checked ? 'line-through text-rc-hint' : 'text-rc-text'}`}>{kw.keyword}</span>
          <span className={`font-mono text-[11px] ${accent} px-1.5 py-0.5`}>{kw.jd_frequency}{t.atsTab.inJd}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-rc-border/40 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${checked ? 'bg-rc-green/40' : 'bg-rc-green'}`}
              style={{ width: `${impactPct}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-rc-green shrink-0">+{kw.score_impact} pts</span>
        </div>
        {kw.sections_missing.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {kw.sections_missing.map((sec) => (
              <span key={sec} className="font-mono text-[11px] text-rc-hint bg-rc-bg border border-rc-border/40 px-1.5 py-0.5">{sec} ✗</span>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

export function AtsTab({ ats, checkedKeywords, onToggle, onReset }: Props) {
  const { t } = useLanguage();
  const atsThreshold = ats.threshold ?? ATS_THRESHOLD_FALLBACK;
  const missingKeywords = ats.critical_missing_keywords ?? [];
  const simulatedScore = Math.min(100, Math.round(
    ats.score + Array.from(checkedKeywords).reduce((sum, kw) => {
      const found = missingKeywords.find(k => k.keyword === kw);
      return sum + (found?.score_impact ?? 0);
    }, 0)
  ));
  const gapToThreshold = atsThreshold - simulatedScore;
  const requiredKws = [...missingKeywords.filter(k => k.required)].sort((a, b) => b.score_impact - a.score_impact);
  const preferredKws = [...missingKeywords.filter(k => !k.required)].sort((a, b) => b.score_impact - a.score_impact);
  const maxImpact = Math.max(...missingKeywords.map(k => k.score_impact), 1);

  return (
    <div className="space-y-12">

      {/* ── SECTION 1: ATS Simulation ────────────────────── */}
      <div>
        <SectionHeader
          label={t.atsTab.botFilter}
          labelColor={ats.would_pass ? "text-rc-green" : "text-rc-red"}
          title={ats.would_pass ? t.atsTab.atsPassEstimated : t.atsTab.atsRejectionLikely}
          subtitle={ats.reason}
          meta={
            <div className="text-right shrink-0">
              <div className="text-[44px] font-mono font-medium leading-none text-rc-text">
                {ats.score}<span className="text-[20px] text-rc-hint">/100</span>
              </div>
              <div className={`font-mono text-[12px] mt-1 font-semibold ${gapToThreshold > 0 ? 'text-rc-red' : 'text-rc-green'}`}>
                {gapToThreshold > 0 ? `${gapToThreshold} ${t.atsTab.ptsBelow}` : `${Math.abs(gapToThreshold)} ${t.atsTab.ptsAbove}`}
              </div>
            </div>
          }
        />

        <div className={`p-6 border ${ats.would_pass ? 'border-rc-green/20 bg-rc-green/5' : 'border-rc-red/20 bg-rc-red/5'}`}>
          {/* Threshold bar */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[11px] text-rc-hint uppercase">
              <span>0</span><span>100</span>
            </div>
            <div className="relative h-3 bg-rc-border/40 overflow-visible">
              <div className="absolute z-10 flex flex-col items-center" style={{ left: `${atsThreshold}%`, top: '-6px', transform: 'translateX(-50%)' }}>
                <div className="w-[4px] h-6 bg-rc-amber" />
                <div className="absolute -top-6 font-mono text-[11px] text-rc-amber font-bold whitespace-nowrap bg-rc-amber/10 border border-rc-amber/30 px-2 py-1">
                  {t.atsTab.minThreshold.replace('{threshold}', String(atsThreshold))}
                </div>
              </div>
              <div
                className={`h-full transition-all duration-500 ${simulatedScore >= atsThreshold ? 'bg-rc-green' : 'bg-rc-amber'}`}
                style={{ width: `${ats.score}%` }}
              />
              {simulatedScore > ats.score && (
                <div
                  className="absolute top-0 h-full bg-rc-green/40 transition-all duration-300"
                  style={{ left: `${ats.score}%`, width: `${simulatedScore - ats.score}%` }}
                />
              )}
            </div>
            {simulatedScore !== ats.score && (
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-rc-hint">{t.atsTab.current} {ats.score}</span>
                <span className={`font-semibold ${simulatedScore >= atsThreshold ? 'text-rc-green' : 'text-rc-amber'}`}>
                  {t.atsTab.simulated} {simulatedScore} {simulatedScore >= atsThreshold ? t.atsTab.wouldPass : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ATS explanation callout */}
        <div className="flex items-start gap-3 p-4 bg-rc-surface border border-rc-border mt-4">
          <span className="font-mono text-[12px] text-rc-hint mt-0.5">?</span>
          <p className="font-mono text-[12px] text-rc-hint leading-relaxed">
            {t.atsTab.atsExplanation}
          </p>
        </div>
      </div>

      {/* ── SECTION 2: Keyword Simulator ─────────────────── */}
      <div>
        <SectionHeader
          label={t.atsTab.simulator}
          title={t.atsTab.keywordGap}
          subtitle={t.atsTab.keywordGapSubtitle}
          meta={
            checkedKeywords.size > 0
              ? <button onClick={onReset} className="font-mono text-[11px] text-rc-hint hover:text-rc-red transition-colors uppercase tracking-wider">{t.atsTab.reset}</button>
              : undefined
          }
        />

        <div className="bg-rc-surface border border-rc-border overflow-hidden">
          {requiredKws.length > 0 && (
            <div className="p-6 border-b border-rc-border">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />
                <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-rc-red font-bold">{t.atsTab.required}</span>
                <span className="font-mono text-[11px] text-rc-hint">— {t.atsTab.requiredMention.replace('{count}', String(requiredKws.reduce((s, k) => s + k.jd_frequency, 0)))}</span>
              </div>
              <div className="space-y-4">
                {requiredKws.map((kw) => (
                  <KeywordRow key={kw.keyword} kw={kw} checked={checkedKeywords.has(kw.keyword)} onToggle={() => onToggle(kw.keyword)} accent="text-rc-red bg-rc-red/10" maxImpact={maxImpact} />
                ))}
              </div>
            </div>
          )}

          {preferredKws.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-amber" />
                <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-rc-amber font-bold">{t.atsTab.preferred}</span>
                <span className="font-mono text-[11px] text-rc-hint">— {t.atsTab.preferredNote}</span>
              </div>
              <div className="space-y-4">
                {preferredKws.map((kw) => (
                  <KeywordRow key={kw.keyword} kw={kw} checked={checkedKeywords.has(kw.keyword)} onToggle={() => onToggle(kw.keyword)} accent="text-rc-amber bg-rc-amber/10" maxImpact={maxImpact} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
