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

  const foundCount = sortedSkills.filter(s => s.found).length;
  const totalCount = sortedSkills.length;

  return (
    <div className="space-y-8">

      {/* Hidden Red Flags */}
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />
            Experienced Recruiter Intuition
          </h3>
          <span className="font-mono text-[9px] uppercase tracking-wider text-rc-hint">
            {flags.length} flag{flags.length !== 1 ? "s" : ""} identified
          </span>
        </div>

        <div className="space-y-3">
          {flags.map((flag, idx) => (
            <div key={idx} className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6 hover:bg-rc-surface/30 transition-colors">
              <div className="flex items-start gap-5">
                <div className="w-1.5 h-1.5 bg-rc-red rounded-full mt-2 shrink-0" />
                <div className="space-y-4 w-full">
                  <div>
                    <h4 className="text-[14px] font-semibold text-rc-text mb-1 uppercase tracking-tight">{flag.flag}</h4>
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
      <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-text font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rc-text" />
            Technical Requirement Matrix
          </h3>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[10px] font-bold ${foundCount === totalCount ? 'text-rc-green' : foundCount >= totalCount * 0.7 ? 'text-rc-amber' : 'text-rc-red'}`}>
              {foundCount}/{totalCount}
            </span>
            <span className="font-mono text-[9px] text-rc-hint uppercase">skills matched</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 mb-6">
          {sortedSkills.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-rc-border/30">
              <span className="text-[13px] text-rc-text">{s.skill}</span>
              <div className="flex items-center gap-3">
                {s.evidence && (
                  <span className="font-mono text-[9px] text-rc-hint">{s.evidence}</span>
                )}
                {s.found ? (
                  <span className="font-mono text-[10px] text-rc-green font-bold">✓</span>
                ) : (
                  <span className="font-mono text-[11px] text-rc-red font-bold leading-none">×</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {jdMatch.experience_gap && (
          <div className="p-4 bg-rc-red/5 border-l-4 border-rc-red rounded-r-xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red block mb-1 font-bold">Crucial Experience Gap</span>
            <p className="text-[13px] text-rc-muted italic leading-relaxed">{jdMatch.experience_gap}</p>
          </div>
        )}
      </div>
    </div>
  );
}
