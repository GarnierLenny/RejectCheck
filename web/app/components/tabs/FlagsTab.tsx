import type { AnalysisResult } from "../types";
import { FixBlock } from "../FixBlock";

type Props = {
  flags: AnalysisResult["hidden_red_flags"];
  jdMatch: AnalysisResult["audit"]["jd_match"];
  score: AnalysisResult["score"];
  verdict: AnalysisResult["verdict"];
  confidence: AnalysisResult["confidence"];
  breakdown: AnalysisResult["breakdown"];
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  High:   { label: "Strong Match",  color: "text-rc-green", bg: "bg-rc-green/5",   border: "border-rc-green/20" },
  Medium: { label: "Partial Match", color: "text-rc-amber", bg: "bg-rc-amber/5",   border: "border-rc-amber/20" },
  Low:    { label: "Weak Match",    color: "text-rc-red",   bg: "bg-rc-red/5",     border: "border-rc-red/20" },
};

const BREAKDOWN_LABELS: Record<string, string> = {
  keyword_match:    "Keyword Match",
  tech_stack_fit:   "Tech Stack Fit",
  experience_level: "Experience Level",
  github_signal:    "GitHub Signal",
  linkedin_signal:  "LinkedIn Signal",
};

export function FlagsTab({ flags, jdMatch, score, verdict, confidence, breakdown }: Props) {
  const sortedSkills = [...jdMatch.required_skills].sort((a, b) =>
    a.found === b.found ? 0 : a.found ? 1 : -1
  );

  const foundCount = sortedSkills.filter(s => s.found).length;
  const totalCount = sortedSkills.length;

  const verdictCfg = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.Low;
  const breakdownEntries = Object.entries(breakdown).filter(([, v]) => v !== null) as [string, number][];

  return (
    <div className="space-y-8">

      {/* ── Recruiter View ────────────────────────────────── */}
      <div className={`p-6 rounded border ${verdictCfg.bg} ${verdictCfg.border}`}>
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint block mb-2">Recruiter View</span>
            <h2 className={`font-sans font-bold text-[22px] tracking-tight uppercase ${verdictCfg.color}`}>
              {verdictCfg.label}
            </h2>
            <p className="text-[13px] text-rc-muted leading-relaxed mt-2 max-w-[420px]">{confidence.reason}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[42px] font-mono font-medium leading-none text-rc-text">
              {score}<span className="text-[18px] text-rc-hint">/100</span>
            </div>
            <div className={`font-mono text-[11px] mt-1 font-semibold ${verdictCfg.color}`}>
              {confidence.score}% confidence
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-3">
          {breakdownEntries.map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-rc-hint">
                  {BREAKDOWN_LABELS[key] ?? key}
                </span>
                <span className={`font-mono text-[10px] font-bold ${value >= 70 ? 'text-rc-green' : value >= 50 ? 'text-rc-amber' : 'text-rc-red'}`}>
                  {value}
                </span>
              </div>
              <div className="h-2 bg-rc-border/40 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${value >= 70 ? 'bg-rc-green' : value >= 50 ? 'bg-rc-amber' : 'bg-rc-red'}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

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
            <div key={idx} className="border border-rc-border/40 border-l-2 border-l-rc-red bg-rc-surface p-5 hover:bg-rc-surface-raised transition-colors">
              <div className="space-y-4 w-full">
                <div>
                  <h4 className="text-[14px] font-semibold font-mono text-rc-text mb-1 uppercase tracking-tight">{flag.flag}</h4>
                  <div className="text-[13px] text-rc-muted leading-relaxed">
                    <span className="text-rc-amber font-mono text-[10px] uppercase font-bold mr-2">Recruiter perception:</span>
                    {flag.perception}
                  </div>
                </div>
                <FixBlock fix={flag.fix} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Requirement Matrix */}
      <div className="bg-rc-surface border border-rc-border rounded p-6">
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
          <div className="p-4 bg-rc-red/5 border-l-4 border-rc-red">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red block mb-1 font-bold">Crucial Experience Gap</span>
            <p className="text-[13px] text-rc-muted italic leading-relaxed">{jdMatch.experience_gap}</p>
          </div>
        )}
      </div>
    </div>
  );
}
