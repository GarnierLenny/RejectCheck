"use client";

import ReactMarkdown from "react-markdown";
import type { AnalysisResult } from "./types";
import { RadarChart } from "./RadarChart";
import { TechnicalAnalysisSkeleton } from "./skeletons/TechnicalAnalysisSkeleton";
import { useLanguage } from "../../context/language";

interface Props {
  data: AnalysisResult["technical_analysis"];
}

export function TechnicalRadarChart({ data }: Props) {
  const { t, locale } = useLanguage();
  const tr = t.technicalRadar;
  const fr = locale === 'fr';

  if (!data) {
    return <TechnicalAnalysisSkeleton />;
  }

  const axes = data.skills.map((s) => ({
    label: s.name,
    score: s.current,
    expected: s.expected,
    evidence: s.evidence,
  }));

  const skillMap = Object.fromEntries(data.skills.map((s) => [s.name, s]));

  return (
    <div className="relative group py-4">
      <div className="flex flex-col gap-10">

        {/* ── RADAR ENCART ─────────────────────────────────────────────────── */}
        <div className="bg-rc-surface border border-rc-border overflow-hidden">
          <div className="px-8 py-4 border-b border-rc-border bg-rc-surface-hero">
            <span className="font-mono text-[12px] tracking-[0.15em] uppercase text-rc-hint">
              {tr.label}
            </span>
          </div>
          <div className="px-12 py-10">
            <p className="font-mono text-[11px] text-rc-muted mb-8">{tr.subtitle}</p>
            <RadarChart
              axes={axes}
              fluid
              scale={10}
              legend={{ current: tr.yourProfile, expected: tr.targetJd }}
              evidenceHeader={{ title: tr.yourProfile, subtitle: fr ? 'Score par compétence vs. le poste' : 'Skill scores vs. job requirements' }}
              evidenceFooter={
                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="font-mono text-[11px] uppercase tracking-wider text-rc-red font-bold flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />
                      {tr.jobPriority}
                    </h4>
                    <p className="font-mono text-[11px] text-rc-hint">{tr.skillsRanked}</p>
                  </div>
                  <ol className="flex flex-col gap-1.5">
                    {(data.skill_priority ?? data.skills?.map(s => s.name) ?? []).map((name, i) => {
                      const skill = skillMap[name];
                      const gap = skill ? skill.expected - skill.current : 0;
                      const isOk = gap <= 0;
                      const rankColors = ["text-rc-red", "text-rc-amber", "text-rc-muted", "text-rc-hint", "text-rc-hint"];
                      return (
                        <li key={i} className="flex items-center gap-3 px-3 py-2 bg-rc-bg border border-rc-border/50 hover:border-rc-border transition-colors">
                          <span className={`font-mono text-[11px] font-bold w-5 text-center shrink-0 ${rankColors[i]}`}>{i + 1}</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rc-text leading-tight">{name}</span>
                            {skill && (
                              <span className={`font-mono text-[10px] text-rc-hint ${isOk ? 'text-rc-green' : ''}`}>
                                {isOk ? tr.checkTargetMet : tr.ptsGap.replace('{gap}', String(gap))}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              }
            />
          </div>
        </div>

        {/* ── STRATEGIC REC ────────────────────────────────────────────────── */}
        <div className="space-y-8">
          <div className="bg-rc-surface border border-rc-border p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 2v20M2 12h20M12 2a10 10 0 0 1 10 10M12 2A10 10 0 0 0 2 12M22 12a10 10 0 0 1-10 10M2 12a10 10 0 0 0 10 10" />
              </svg>
            </div>
            <h3 className="font-mono text-[12px] uppercase tracking-[0.2em] text-rc-red mb-4 font-bold">{tr.strategicRec}</h3>
            <div className="text-[17px] text-rc-text leading-[1.7] font-sans italic [&_strong]:font-semibold [&_strong]:not-italic [&_em]:italic [&_ul]:mt-2 [&_ul]:space-y-1 [&_li]:ml-4 [&_li]:list-disc">
              <ReactMarkdown>{data.recommendation}</ReactMarkdown>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.skills.map((s, idx) => {
              const gap = s.expected - s.current;
              const isOk = gap <= 0;
              return (
                <div key={idx} className="bg-rc-surface border border-rc-border p-6 flex flex-col gap-4 hover:bg-rc-surface-raised transition-all cursor-default">
                  <div className="flex items-center justify-between">
                    <span className="text-rc-text font-mono text-[11px] uppercase tracking-wider font-semibold">{s.name}</span>
                    <span className={`px-2.5 py-1 text-[9px] font-bold ${isOk ? 'bg-rc-green/10 text-rc-green border border-rc-green/30' : 'bg-rc-amber/10 text-rc-amber border border-rc-amber/20'}`}>
                      {isOk ? tr.targetMet : tr.gap}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-rc-text font-mono text-2xl font-bold">{s.current} <span className="text-rc-hint text-sm font-normal">/ {s.expected}</span></span>
                    {!isOk && <span className="text-rc-amber font-mono text-[11px] uppercase font-bold">-{gap} PTS</span>}
                  </div>
                  <div className="text-[14px] text-rc-muted leading-[1.7] border-t border-rc-border pt-4 [&_strong]:font-semibold [&_strong]:text-rc-text">
                    <ReactMarkdown>{s.evidence}</ReactMarkdown>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`grid grid-cols-1 gap-4 mt-4 ${data.market_context ? "md:grid-cols-2" : ""}`}>
            {data.market_context && (
              <div className="bg-rc-surface border border-rc-border p-6">
                <h4 className="font-mono text-[12px] uppercase tracking-widest text-rc-amber mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-amber" />
                  {tr.marketContext}
                </h4>
                <div className="text-[16px] text-rc-text leading-[1.7] [&_strong]:font-semibold [&_ul]:mt-2 [&_ul]:space-y-1 [&_li]:ml-4 [&_li]:list-disc">
                  <ReactMarkdown>{data.market_context}</ReactMarkdown>
                </div>
              </div>
            )}
            <div className="bg-rc-surface border border-rc-border p-6">
              <h4 className="font-mono text-[12px] uppercase tracking-widest text-rc-red mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />
                {tr.senioritySig}
              </h4>
              <ul className="space-y-2">
                {data.seniority_signals.map((sig, i) => (
                  <li key={i} className="text-[16px] text-rc-muted flex items-start gap-2 leading-[1.7]">
                    <span className="text-rc-red mt-1 shrink-0">•</span>
                    <div className="[&_strong]:font-semibold [&_strong]:text-rc-text">
                      <ReactMarkdown>{sig}</ReactMarkdown>
                    </div>
                  </li>
                ))}
                {data.seniority_signals.length === 0 && (
                  <li className="text-sm text-rc-hint italic text-rc-muted">{tr.noGaps}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
