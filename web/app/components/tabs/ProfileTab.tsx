import type { AnalysisResult } from "../types";
import { FixBlock } from "../FixBlock";

type Props = {
  result: AnalysisResult;
};

export function ProfileTab({ result }: Props) {
  const { seniority_analysis, cv_tone, correlation } = result;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seniority Gap */}
        <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-xl p-6 flex flex-col">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint mb-6">Seniority Gap Analysis</span>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 text-center p-3 bg-rc-bg rounded border border-rc-border">
              <span className="text-[10px] uppercase text-rc-hint block mb-1">Expected</span>
              <span className="text-[14px] font-medium text-rc-text">{seniority_analysis.expected}</span>
            </div>
            <div className="text-rc-hint">→</div>
            <div className="flex-1 text-center p-3 bg-rc-bg rounded border border-rc-red/20 shadow-[0_0_15px_rgba(226,75,74,0.05)]">
              <span className="text-[10px] uppercase text-rc-hint block mb-1 font-bold text-rc-red">Detected</span>
              <span className="text-[14px] font-medium text-rc-text">{seniority_analysis.detected}</span>
            </div>
          </div>
          <p className="text-[13px] text-rc-muted leading-relaxed mb-4 italic">{seniority_analysis.gap}</p>
          {seniority_analysis.strength && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-rc-green/10 text-rc-green border border-rc-green/20">
                Strength: {seniority_analysis.strength}
              </span>
            </div>
          )}
          <FixBlock fix={seniority_analysis.fix} />
        </div>

        {/* Tone Audit */}
        <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-xl p-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint mb-6 flex justify-between items-center">
            Tone Audit
            <span className={`px-2 py-0.5 rounded text-[9px] ${cv_tone.detected === 'active' ? 'text-rc-green bg-rc-green/10' : 'text-rc-amber bg-rc-amber/10'}`}>
              {cv_tone.detected.toUpperCase()}
            </span>
          </span>
          <div className="space-y-4 mb-6">
            {cv_tone.examples.map((ex, i) => (
              <div key={i} className="p-3 bg-rc-bg rounded border-l-2 border-rc-amber-border text-[12px] text-rc-muted leading-relaxed italic">
                &quot;{ex}&quot;
              </div>
            ))}
          </div>
          <FixBlock fix={cv_tone.fix} />
        </div>
      </div>

      {/* Correlation */}
      {correlation.detected && (
        <div className="p-5 bg-rc-amber/5 border border-rc-amber/20 rounded-xl">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rc-amber block mb-2">Pattern Detected — Tone × Seniority</span>
          <p className="text-[13px] text-rc-muted leading-relaxed">{correlation.explanation}</p>
        </div>
      )}
    </div>
  );
}
