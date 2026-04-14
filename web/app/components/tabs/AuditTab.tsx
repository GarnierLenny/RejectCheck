import type { AnalysisResult } from "../types";
import { IssueItem } from "../IssueItem";

type Props = {
  cv: AnalysisResult["audit"]["cv"];
};

const SEVERITY_CONFIG = {
  critical: { color: "text-rc-red", dot: "bg-rc-red", border: "border-rc-red/20", bg: "bg-rc-red/5" },
  major:    { color: "text-rc-amber", dot: "bg-rc-amber", border: "border-rc-amber/20", bg: "bg-rc-amber/5" },
  minor:    { color: "text-rc-hint", dot: "bg-rc-hint", border: "border-rc-border/30", bg: "bg-rc-surface/10" },
};

export function AuditTab({ cv }: Props) {
  const criticalCount = cv.issues.filter(i => i.severity === "critical").length;
  const majorCount    = cv.issues.filter(i => i.severity === "major").length;
  const minorCount    = cv.issues.filter(i => i.severity === "minor").length;

  return (
    <div className="space-y-8">
      <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-rc-border/30 flex items-start justify-between">
          <div>
            <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text">CV Forensic Audit</h2>
            <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-1">
              {cv.issues.length} vulnerabilit{cv.issues.length !== 1 ? "ies" : "y"} identified
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint block mb-1">Health Score</span>
            <span className={`font-mono text-[24px] font-medium ${cv.score >= 80 ? 'text-rc-green' : cv.score >= 60 ? 'text-rc-amber' : 'text-rc-red'}`}>
              {cv.score}%
            </span>
          </div>
        </div>

        {/* Severity breakdown + Strengths */}
        <div className="p-5 border-b border-rc-border/30 flex flex-wrap gap-4 items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {(["critical", "major", "minor"] as const).map(sev => {
              const count = sev === "critical" ? criticalCount : sev === "major" ? majorCount : minorCount;
              if (count === 0) return null;
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <span key={sev} className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {count} {sev}
                </span>
              );
            })}
          </div>

          {cv.strengths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cv.strengths.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded bg-rc-green/5 text-rc-green border border-rc-green/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-green" />
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Issues list */}
        <div className="divide-y divide-rc-border/20">
          {cv.issues.map((issue, idx) => (
            <IssueItem key={idx} issue={issue} />
          ))}
        </div>
      </div>
    </div>
  );
}
