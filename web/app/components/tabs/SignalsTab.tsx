"use client";

import ReactMarkdown from "react-markdown";
import { Github, Linkedin } from "react-bootstrap-icons";
import type { AnalysisResult } from "../types";
import { IssueItem } from "../IssueItem";
import { SectionHeader } from "../SectionHeader";
import { useLanguage } from "../../../context/language";

type SignalData = AnalysisResult["audit"]["github"] | AnalysisResult["audit"]["linkedin"];

type Props = {
  github: AnalysisResult["audit"]["github"];
  linkedin: AnalysisResult["audit"]["linkedin"];
  hasGithub: boolean;
  hasLinkedin: boolean;
};

function SignalSection({
  title, score, strengths, issues, hasData, emptyMessage, ctaText,
}: {
  title: React.ReactNode;
  score: number | null;
  strengths: string[];
  issues: SignalData["issues"];
  hasData: boolean;
  emptyMessage: string;
  ctaText: string;
}) {
  const { t } = useLanguage();
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const majorCount    = issues.filter(i => i.severity === "major").length;
  const minorCount    = issues.filter(i => i.severity === "minor").length;

  return (
    <div>
      <SectionHeader
        label={t.signalsTab.signalAnalysis}
        title={title}
        subtitle={hasData ? t.signalsTab.issuesDetected.replace('{count}', String(issues.length)).replace(/\{plural\}/g, issues.length !== 1 ? 's' : '') : t.signalsTab.notProvided}
        meta={
          <div className="text-right">
            <span className="font-mono text-[11px] uppercase tracking-widest text-rc-hint block mb-1">{t.signalsTab.signalScore}</span>
            <span className={`font-mono text-[26px] font-medium ${score === null ? 'text-rc-hint' : score >= 70 ? 'text-rc-green' : score >= 50 ? 'text-rc-amber' : 'text-rc-red'}`}>
              {score !== null ? `${score}%` : "N/A"}
            </span>
          </div>
        }
      />

      <div className="bg-rc-surface border border-rc-border overflow-hidden">
      {!hasData ? (
        <div className="p-10 text-center">
          <p className="text-[17px] text-rc-muted mb-4 leading-relaxed">{emptyMessage}</p>
          <p className="font-mono text-[12px] text-rc-hint bg-rc-bg border border-dashed border-rc-border/40 px-5 py-3 inline-block">
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
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 bg-rc-red/5 border border-rc-red/20 text-rc-red">
                    <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />{criticalCount} {t.signalsTab.critical}
                  </span>
                )}
                {majorCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 bg-rc-amber/5 border border-rc-amber/20 text-rc-amber">
                    <span className="w-1.5 h-1.5 rounded-full bg-rc-amber" />{majorCount} {t.signalsTab.major}
                  </span>
                )}
                {minorCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 bg-rc-surface/10 border border-rc-border/30 text-rc-hint">
                    <span className="w-1.5 h-1.5 rounded-full bg-rc-hint" />{minorCount} {t.signalsTab.minor}
                  </span>
                )}
              </div>
              {strengths.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {strengths.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 bg-rc-green/5 text-rc-green border border-rc-green/20">
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
            <p className="font-mono text-[12px] text-rc-hint italic text-center py-10 uppercase tracking-wider">
              {t.signalsTab.noIssuesDetected}
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export function SignalsTab({ github, linkedin, hasGithub, hasLinkedin }: Props) {
  const { t } = useLanguage();
  // Derive hasData from actual content - handles history-loaded results where state vars are empty
  const githubHasData = hasGithub || github.score !== null || github.issues.length > 0 || github.strengths.length > 0;
  const linkedinHasData = hasLinkedin || linkedin.score !== null || linkedin.issues.length > 0 || linkedin.strengths.length > 0;

  return (
    <div className="space-y-12">
      <SignalSection
        title={<span className="flex items-center gap-2.5"><Github size={20} className="text-rc-text" />GitHub Signal</span>}
        score={github.score}
        strengths={github.strengths}
        issues={github.issues}
        hasData={githubHasData}
        emptyMessage={t.signalsTab.githubEmpty}
        ctaText={t.signalsTab.githubCta}
      />
      <SignalSection
        title={<span className="flex items-center gap-2.5"><Linkedin size={20} className="text-rc-text" />LinkedIn Signal</span>}
        score={linkedin.score}
        strengths={linkedin.strengths}
        issues={linkedin.issues}
        hasData={linkedinHasData}
        emptyMessage={t.signalsTab.linkedinEmpty}
        ctaText={t.signalsTab.linkedinCta}
      />
    </div>
  );
}
