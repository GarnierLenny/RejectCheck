"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ReactMarkdown from "react-markdown";
import type { AnalysisResult } from "./types";
import { SectionHeader } from "./SectionHeader";

interface Props {
  data: AnalysisResult["technical_analysis"];
}

export function TechnicalRadarChart({ data }: Props) {
  const chartData = data.skills.map((s) => ({
    subject: s.name,
    current: s.current,
    expected: s.expected,
    fullMark: 10,
  }));

  const skillMap = Object.fromEntries(data.skills.map((s) => [s.name, s]));

  return (
    <div className="relative group py-4">
      <SectionHeader
        label="Skill Mapping"
        title="Skill Gap Analysis"
        subtitle="Your current level vs. what the job requires, measured across each key skill."
        meta={
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-rc-amber bg-rc-amber/10" />
              <span className="font-mono text-[12px] uppercase tracking-wider text-rc-muted">Target (JD)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rc-red" />
              <span className="font-mono text-[12px] uppercase tracking-wider text-rc-muted">Your Profile</span>
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-10">
        {/* Chart + Priority panel */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 h-[380px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid polarRadius={[]} stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#6b6b6b', fontSize: 10, fontWeight: 500, fontFamily: 'monospace' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="fullMark"
                  stroke="rgba(0,0,0,0.12)"
                  fill="none"
                  isAnimationActive={false}
                />
                <Radar
                  name="Target"
                  dataKey="expected"
                  stroke="#c47f00"
                  strokeWidth={2}
                  strokeOpacity={1}
                  strokeDasharray="4 4"
                  fill="#c47f00"
                  fillOpacity={0.05}
                />
                <Radar
                  name="Your Profile"
                  dataKey="current"
                  stroke="#C93A39"
                  strokeWidth={2.5}
                  fill="#C93A39"
                  fillOpacity={0.18}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#1a1917',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Priority sidebar */}
          <div className="w-[210px] shrink-0 bg-rc-surface border border-rc-border rounded p-5 flex flex-col gap-4">
            <div>
              <h4 className="font-mono text-[12px] uppercase tracking-widest text-rc-red font-bold flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />
                Job Priority
              </h4>
              <p className="font-mono text-[11px] text-rc-hint">Skills ranked by importance</p>
            </div>
            <ol className="flex flex-col gap-1.5">
              {(data.skill_priority ?? data.skills.map(s => s.name)).map((name, i) => {
                const skill = skillMap[name];
                const gap = skill ? skill.expected - skill.current : 0;
                const isOk = gap <= 0;
                const rankColors = ["text-rc-red", "text-rc-amber", "text-rc-muted", "text-rc-hint", "text-rc-hint"];
                return (
                  <li key={i} className="flex items-center gap-3 p-2.5 rounded bg-rc-bg border border-rc-border/50 hover:border-rc-border transition-colors">
                    <span className={`font-mono text-[13px] font-bold w-5 text-center shrink-0 ${rankColors[i]}`}>{i + 1}</span>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="font-mono text-[11px] text-rc-text leading-tight">{name}</span>
                      {skill && (
                        <span className={`font-mono text-[9px] font-bold ${isOk ? 'text-rc-green' : 'text-rc-amber'}`}>
                          {isOk ? '✓ target met' : `−${gap} pts gap`}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-rc-surface border border-rc-border rounded p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 2v20M2 12h20M12 2a10 10 0 0 1 10 10M12 2A10 10 0 0 0 2 12M22 12a10 10 0 0 1-10 10M2 12a10 10 0 0 0 10 10" />
              </svg>
            </div>
            <h3 className="font-mono text-[12px] uppercase tracking-[0.2em] text-rc-red mb-4 font-bold">Strategic Recommendation</h3>
            <div className="text-[17px] text-rc-text leading-[1.7] font-sans italic [&_strong]:font-semibold [&_strong]:not-italic [&_em]:italic [&_ul]:mt-2 [&_ul]:space-y-1 [&_li]:ml-4 [&_li]:list-disc">
              <ReactMarkdown>{data.recommendation}</ReactMarkdown>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.skills.map((s, idx) => {
              const gap = s.expected - s.current;
              const isOk = gap <= 0;
              return (
                <div key={idx} className="bg-rc-surface border border-rc-border rounded p-6 flex flex-col gap-4 hover:bg-rc-surface-raised transition-all cursor-default group/item">
                  <div className="flex items-center justify-between">
                    <span className="text-rc-text font-mono text-[11px] uppercase tracking-wider font-semibold">{s.name}</span>
                    <span className={`px-2.5 py-1 rounded text-[9px] font-bold ${isOk ? 'bg-rc-green/10 text-rc-green border border-rc-green/30' : 'bg-rc-amber/10 text-rc-amber border border-rc-amber/20'}`}>
                      {isOk ? 'TARGET MET' : 'GAP'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-rc-surface border border-rc-border rounded p-6">
              <h4 className="font-mono text-[12px] uppercase tracking-widest text-rc-amber mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-amber" />
                Market Context
              </h4>
              <div className="text-[16px] text-rc-text leading-[1.7] [&_strong]:font-semibold [&_ul]:mt-2 [&_ul]:space-y-1 [&_li]:ml-4 [&_li]:list-disc">
                <ReactMarkdown>{data.market_context}</ReactMarkdown>
              </div>
            </div>
            <div className="bg-rc-surface border border-rc-border rounded p-6">
              <h4 className="font-mono text-[12px] uppercase tracking-widest text-rc-red mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />
                Missing Seniority Signals
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
                  <li className="text-sm text-rc-hint italic text-rc-muted">No specific gaps identified for this level.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
