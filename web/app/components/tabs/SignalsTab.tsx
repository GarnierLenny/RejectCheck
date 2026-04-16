import ReactMarkdown from "react-markdown";
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
  title, icon, score, strengths, issues, hasData, emptyMessage, ctaText,
}: {
  title: string;
  icon: React.ReactNode;
  score: number | null;
  strengths: string[];
  issues: SignalData["issues"];
  hasData: boolean;
  emptyMessage: string;
  ctaText: string;
}) {
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const majorCount    = issues.filter(i => i.severity === "major").length;
  const minorCount    = issues.filter(i => i.severity === "minor").length;

  return (
    <div className="bg-rc-surface border border-rc-border rounded overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-rc-border flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-rc-surface-raised border border-rc-border flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-sans font-bold text-[17px] tracking-tight uppercase text-rc-text">{title}</h3>
            <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-0.5">
              {hasData ? `${issues.length} issue${issues.length !== 1 ? "s" : ""} detected` : "Not provided"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint block mb-1">Signal Score</span>
          <span className={`font-mono text-[24px] font-medium ${score === null ? 'text-rc-hint' : score >= 70 ? 'text-rc-green' : score >= 50 ? 'text-rc-amber' : 'text-rc-red'}`}>
            {score !== null ? `${score}%` : "N/A"}
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="p-8 text-center">
          <p className="text-[13px] text-rc-muted mb-3">{emptyMessage}</p>
          <p className="font-mono text-[10px] text-rc-hint bg-rc-bg border border-dashed border-rc-border/40 px-4 py-3 inline-block">
            {ctaText}
          </p>
        </div>
      ) : (
        <div>
          {/* Severity breakdown + Strengths */}
          {(issues.length > 0 || strengths.length > 0) && (
            <div className="p-5 border-b border-rc-border flex flex-wrap gap-4 items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {criticalCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded bg-rc-red/5 border border-rc-red/20 text-rc-red">
                    <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />{criticalCount} critical
                  </span>
                )}
                {majorCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded bg-rc-amber/5 border border-rc-amber/20 text-rc-amber">
                    <span className="w-1.5 h-1.5 rounded-full bg-rc-amber" />{majorCount} major
                  </span>
                )}
                {minorCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded bg-rc-surface/10 border border-rc-border/30 text-rc-hint">
                    <span className="w-1.5 h-1.5 rounded-full bg-rc-hint" />{minorCount} minor
                  </span>
                )}
              </div>
              {strengths.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {strengths.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded bg-rc-green/5 text-rc-green border border-rc-green/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-rc-green" />
                      <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{s}</ReactMarkdown>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {issues.length > 0 ? (
            <div className="divide-y divide-rc-border/20">
              {issues.map((issue, idx) => (
                <IssueItem key={idx} issue={issue} />
              ))}
            </div>
          ) : (
            <p className="font-mono text-[11px] text-rc-hint italic text-center py-8 uppercase tracking-wider">
              No issues detected — strong signal.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SignalsTab({ github, linkedin, hasGithub, hasLinkedin }: Props) {
  // Derive hasData from actual content — handles history-loaded results where state vars are empty
  const githubHasData = hasGithub || github.score !== null || github.issues.length > 0 || github.strengths.length > 0;
  const linkedinHasData = hasLinkedin || linkedin.score !== null || linkedin.issues.length > 0 || linkedin.strengths.length > 0;

  return (
    <div className="space-y-6">
      <SignalSection
        title="GitHub Signal"
        icon={<img src="/icons/github.svg" alt="GitHub" width={16} height={16} style={{ filter: 'invert(0.6)' }} />}
        score={github.score}
        strengths={github.strengths}
        issues={github.issues}
        hasData={githubHasData}
        emptyMessage="No GitHub username provided — deep technical verification skipped."
        ctaText="Re-analyze with your GitHub username to unlock signal"
      />
      <SignalSection
        title="LinkedIn Signal"
        icon={<img src="/icons/linkedin.svg" alt="LinkedIn" width={16} height={16} style={{ filter: 'invert(0.6)' }} />}
        score={linkedin.score}
        strengths={linkedin.strengths}
        issues={linkedin.issues}
        hasData={linkedinHasData}
        emptyMessage="No LinkedIn PDF provided — cross-reference verification skipped."
        ctaText="Export your LinkedIn PDF (Settings → Data Privacy → Get a copy) and re-analyze"
      />
    </div>
  );
}
