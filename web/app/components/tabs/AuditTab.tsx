import type { AnalysisResult } from "../types";
import { IssueItem } from "../IssueItem";

type Props = {
  cv: AnalysisResult["audit"]["cv"];
};

export function AuditTab({ cv }: Props) {
  return (
    <div className="space-y-8">
      <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-rc-border bg-rc-surface/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-rc-red/10 border border-rc-red/20 flex items-center justify-center text-rc-red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h3 className="font-sans text-[22px] uppercase">CV Forensic Audit</h3>
              <p className="text-[11px] font-mono text-rc-hint uppercase tracking-tight">Status: {cv.issues.length} technical vulnerabilities identified</p>
            </div>
          </div>
          <div className="text-right">
            <span className="block font-mono text-[11px] text-rc-hint uppercase">Health Score</span>
            <span className="text-[24px] font-mono text-rc-text">{cv.score}%</span>
          </div>
        </div>

        {cv.strengths.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 border-b border-rc-border">
            {cv.strengths.map((s, i) => (
              <span key={i} className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-rc-green/10 text-rc-green border border-rc-green/20">Strength: {s}</span>
            ))}
          </div>
        )}

        <div className="divide-y divide-rc-border">
          {cv.issues.map((issue, idx) => (
            <IssueItem key={idx} issue={issue} />
          ))}
        </div>
      </div>
    </div>
  );
}
