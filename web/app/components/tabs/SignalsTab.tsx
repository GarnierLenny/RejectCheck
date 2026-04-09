import type { AnalysisResult } from "../types";
import { IssueItem } from "../IssueItem";

type SignalData = AnalysisResult["audit"]["github"] | AnalysisResult["audit"]["linkedin"];

type Props = {
  github: AnalysisResult["audit"]["github"];
  linkedin: AnalysisResult["audit"]["linkedin"];
  hasGithub: boolean;
  hasLinkedin: boolean;
};

function SignalSection({
  title, abbr, abbrevBg, icon, score, strengths, issues, hasData, emptyMessage, ctaText,
}: {
  title: string;
  abbr: string;
  abbrevBg: string;
  icon: React.ReactNode;
  score: number | null;
  strengths: string[];
  issues: SignalData["issues"];
  hasData: boolean;
  emptyMessage: string;
  ctaText: string;
}) {
  return (
    <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-rc-border bg-rc-surface/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${abbrevBg} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className="font-sans text-[18px] uppercase">{title}</h3>
            <p className="text-[11px] font-mono text-rc-hint uppercase tracking-tight">
              {issues.length} issue{issues.length !== 1 ? "s" : ""} detected
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="block font-mono text-[11px] text-rc-hint uppercase">Signal Score</span>
          <span className="text-[24px] font-mono text-rc-text">{score !== null ? `${score}%` : "N/A"}</span>
        </div>
      </div>

      {!hasData ? (
        <div className="p-8 text-center">
          <p className="text-[13px] text-rc-muted mb-2">{emptyMessage}</p>
          <p className="font-mono text-[11px] text-rc-hint bg-rc-bg border border-dashed border-rc-border rounded-lg px-4 py-3 inline-block mt-2">{ctaText}</p>
        </div>
      ) : (
        <div>
          {strengths.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 border-b border-rc-border">
              {strengths.map((s, i) => (
                <span key={i} className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-rc-green/10 text-rc-green border border-rc-green/20">Strength: {s}</span>
              ))}
            </div>
          )}
          {issues.length > 0 ? (
            <div className="divide-y divide-rc-border">
              {issues.map((issue, idx) => (
                <IssueItem key={idx} issue={issue} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-rc-hint italic text-center py-8">No issues detected — strong signal.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function SignalsTab({ github, linkedin, hasGithub, hasLinkedin }: Props) {
  return (
    <div className="space-y-8">
      <SignalSection
        title="GitHub Signal"
        abbr="GH"
        abbrevBg="bg-rc-text/10"
        icon={<img src="/icons/github.svg" alt="GitHub" width={18} height={18} className="opacity-70" style={{ filter: 'invert(1)' }} />}
        score={github.score}
        strengths={github.strengths}
        issues={github.issues}
        hasData={hasGithub}
        emptyMessage="No GitHub username provided — deep technical verification skipped."
        ctaText="Re-analyze with your GitHub username to unlock signal"
      />
      <SignalSection
        title="LinkedIn Signal"
        abbr="in"
        abbrevBg="bg-[#0A66C2]"
        icon={<img src="/icons/linkedin.svg" alt="LinkedIn" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} />}
        score={linkedin.score}
        strengths={linkedin.strengths}
        issues={linkedin.issues}
        hasData={hasLinkedin}
        emptyMessage="No LinkedIn PDF provided — cross-reference verification skipped."
        ctaText="Export your LinkedIn PDF (Settings → Data Privacy → Get a copy) and re-analyze"
      />
    </div>
  );
}
