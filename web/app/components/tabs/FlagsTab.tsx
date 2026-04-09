import type { AnalysisResult } from "../types";
import { FixBlock } from "../FixBlock";

type Props = {
  flags: AnalysisResult["hidden_red_flags"];
  jdMatch: AnalysisResult["audit"]["jd_match"];
};

export function FlagsTab({ flags, jdMatch }: Props) {
  const sortedSkills = [...jdMatch.required_skills].sort((a, b) =>
    a.found === b.found ? 0 : a.found ? 1 : -1
  );

  return (
    <div className="space-y-8">
      {/* Hidden Red Flags */}
      <div className="space-y-4">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-rc-hint px-2">Experienced Recruiter Intuition</h3>
        <div className="grid grid-cols-1 gap-4">
          {flags.map((flag, idx) => (
            <div key={idx} className="group bg-rc-bg border-[0.5px] border-rc-border rounded-xl p-6 transition-all hover:bg-white/[0.01]">
              <div className="flex items-start gap-5">
                <div className="w-1.5 h-1.5 bg-rc-red rounded-full mt-2 shrink-0" />
                <div className="space-y-4 w-full">
                  <div>
                    <h4 className="text-[15px] font-bold text-rc-text mb-1 uppercase tracking-tight">{flag.flag}</h4>
                    <div className="text-[13px] text-rc-muted leading-relaxed">
                      <span className="text-rc-amber font-mono text-[10px] uppercase font-bold mr-2">Recruiter perception:</span>
                      {flag.perception}
                    </div>
                  </div>
                  <FixBlock fix={flag.fix} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Requirement Matrix */}
      <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-xl p-8">
        <h3 className="font-sans text-[22px] uppercase mb-8">Technical Requirement Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-8">
          {sortedSkills.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-rc-border/40">
              <span className="text-[13px] text-rc-text">{s.skill}</span>
              <div className="flex items-center gap-3">
                {s.evidence && <span className="text-[9px] font-mono text-rc-hint truncate max-w-[100px]">{s.evidence}</span>}
                {s.found ? (
                  <span className="w-4 h-4 rounded-full bg-rc-green/20 text-rc-green flex items-center justify-center text-[10px]">✓</span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-rc-red/20 text-rc-red flex items-center justify-center text-[12px] leading-none">×</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {jdMatch.experience_gap && (
          <div className="mt-8 p-4 bg-rc-red/5 border-l-4 border-rc-red rounded-r-lg">
            <span className="text-[11px] font-mono uppercase text-rc-red block mb-1">Crucial Experience Gap</span>
            <p className="text-[13px] text-rc-text italic leading-relaxed">{jdMatch.experience_gap}</p>
          </div>
        )}
      </div>
    </div>
  );
}
