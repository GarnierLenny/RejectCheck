import type { AnalysisResult } from "../types";

type Keyword = AnalysisResult["ats_simulation"]["critical_missing_keywords"][number];

type Props = {
  ats: AnalysisResult["ats_simulation"];
  checkedKeywords: Set<string>;
  onToggle: (kw: string) => void;
  onReset: () => void;
};

const ATS_THRESHOLD_FALLBACK = 70;

function KeywordRow({ kw, checked, onToggle, accent }: { kw: Keyword; checked: boolean; onToggle: () => void; accent: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-rc-green border-rc-green' : 'border-rc-border group-hover:border-rc-green/50'}`}
        onClick={onToggle}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[13px] font-medium transition-colors ${checked ? 'line-through text-rc-hint' : 'text-rc-text'}`}>{kw.keyword}</span>
          <span className={`font-mono text-[10px] ${accent} px-1.5 py-0.5 rounded`}>{kw.jd_frequency}x in JD</span>
          <span className="font-mono text-[10px] text-rc-green">+{kw.score_impact} pts</span>
        </div>
        {kw.sections_missing.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {kw.sections_missing.map((sec) => (
              <span key={sec} className="font-mono text-[9px] text-rc-hint bg-rc-bg border border-rc-border px-1.5 py-0.5 rounded">{sec} ✗</span>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

export function AtsTab({ ats, checkedKeywords, onToggle, onReset }: Props) {
  const atsThreshold = ats.threshold ?? ATS_THRESHOLD_FALLBACK;
  const simulatedScore = Math.min(100, Math.round(
    ats.score + Array.from(checkedKeywords).reduce((sum, kw) => {
      const found = ats.critical_missing_keywords.find(k => k.keyword === kw);
      return sum + (found?.score_impact ?? 0);
    }, 0)
  ));
  const gapToThreshold = atsThreshold - simulatedScore;
  const requiredKws = ats.critical_missing_keywords.filter(k => k.required);
  const preferredKws = ats.critical_missing_keywords.filter(k => !k.required);

  return (
    <div className="space-y-6">
      {/* Verdict + Score */}
      <div className={`p-7 rounded-2xl border-[1px] ${ats.would_pass ? 'border-rc-green/30 bg-rc-green/5' : 'border-rc-red/20 bg-rc-red/5'}`}>
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-rc-hint block mb-2">Module 01 — Bot Filter Simulation</span>
            <h2 className={`font-sans font-bold text-[26px] tracking-tight uppercase ${ats.would_pass ? 'text-rc-green' : 'text-rc-red'}`}>
              {ats.would_pass ? 'ATS Pass Estimated' : 'ATS Rejection Likely'}
            </h2>
            <p className="text-[13px] text-rc-muted leading-relaxed mt-2 max-w-[420px]">{ats.reason}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[42px] font-mono font-medium leading-none text-rc-text">{ats.score}<span className="text-[18px] text-rc-hint">/100</span></div>
            <div className={`text-[12px] font-mono mt-1 font-semibold ${gapToThreshold > 0 ? 'text-rc-red' : 'text-rc-green'}`}>
              {gapToThreshold > 0 ? `${gapToThreshold} pts below threshold` : `${Math.abs(gapToThreshold)} pts above threshold`}
            </div>
          </div>
        </div>

        {/* Threshold bar */}
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-[10px] text-rc-hint uppercase">
            <span>0</span><span>100</span>
          </div>
          <div className="relative h-3 bg-rc-border/40 rounded-full overflow-visible">
            <div className="absolute z-10 flex flex-col items-center" style={{ left: `${atsThreshold}%`, top: '-6px', transform: 'translateX(-50%)' }}>
              <div className="w-[4px] h-6 bg-rc-amber rounded-full" />
              <div className="absolute -top-6 font-mono text-[11px] text-rc-amber font-bold whitespace-nowrap bg-rc-amber/15 border border-rc-amber/40 px-2 py-1 rounded-md">
                min. {atsThreshold}
              </div>
            </div>
            <div
              className={`h-full rounded-full transition-all duration-500 ${simulatedScore >= atsThreshold ? 'bg-rc-green' : 'bg-rc-amber'}`}
              style={{ width: `${ats.score}%` }}
            />
            {simulatedScore > ats.score && (
              <div
                className="absolute top-0 h-full rounded-full bg-rc-green/40 transition-all duration-300"
                style={{ left: `${ats.score}%`, width: `${simulatedScore - ats.score}%` }}
              />
            )}
          </div>
          {simulatedScore !== ats.score && (
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-rc-hint">Current: {ats.score}</span>
              <span className={`font-semibold ${simulatedScore >= atsThreshold ? 'text-rc-green' : 'text-rc-amber'}`}>
                Simulated: {simulatedScore} {simulatedScore >= atsThreshold ? '— would pass ✓' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Keyword Simulator */}
      <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-rc-border flex items-center justify-between">
          <h3 className="font-sans font-semibold text-[14px] text-rc-text">Simulate your ATS score — check what you can add</h3>
          {checkedKeywords.size > 0 && (
            <button onClick={onReset} className="font-mono text-[10px] text-rc-hint hover:text-rc-red transition-colors uppercase tracking-wider">Reset</button>
          )}
        </div>

        {requiredKws.length > 0 && (
          <div className="p-6 border-b border-rc-border">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-rc-red font-semibold">Required</span>
              <span className="font-mono text-[9px] text-rc-hint">— mentioned {requiredKws.reduce((s, k) => s + k.jd_frequency, 0)}x in job description</span>
            </div>
            <div className="space-y-3">
              {requiredKws.map((kw) => (
                <KeywordRow key={kw.keyword} kw={kw} checked={checkedKeywords.has(kw.keyword)} onToggle={() => onToggle(kw.keyword)} accent="text-rc-red bg-rc-red/10" />
              ))}
            </div>
          </div>
        )}

        {preferredKws.length > 0 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-rc-amber font-semibold">Preferred</span>
              <span className="font-mono text-[9px] text-rc-hint">— bonus points, not eliminatory</span>
            </div>
            <div className="space-y-3">
              {preferredKws.map((kw) => (
                <KeywordRow key={kw.keyword} kw={kw} checked={checkedKeywords.has(kw.keyword)} onToggle={() => onToggle(kw.keyword)} accent="text-rc-amber bg-rc-amber/10" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
