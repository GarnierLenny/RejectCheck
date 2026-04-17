"use client";

import type { AnalysisResult } from "../types";
import { FixBlock } from "../FixBlock";
import { SectionHeader } from "../SectionHeader";
import { useLanguage } from "../../../context/language";

type Props = {
  flags: AnalysisResult["hidden_red_flags"];
  jdMatch: AnalysisResult["audit"]["jd_match"];
  score: AnalysisResult["score"];
  verdict: AnalysisResult["verdict"];
  confidence: AnalysisResult["confidence"];
  breakdown: AnalysisResult["breakdown"];
};

const VERDICT_CONFIG_KEYS = {
  High:   { color: "text-rc-green", bg: "bg-rc-green/5",   border: "border-rc-green/20" },
  Medium: { color: "text-rc-amber", bg: "bg-rc-amber/5",   border: "border-rc-amber/20" },
  Low:    { color: "text-rc-red",   bg: "bg-rc-red/5",     border: "border-rc-red/20" },
};

export function FlagsTab({ flags, jdMatch, score, verdict, confidence, breakdown }: Props) {
  const { t } = useLanguage();

  const VERDICT_CONFIG = {
    High:   { label: t.flagsTab.strongMatch,   ...VERDICT_CONFIG_KEYS.High },
    Medium: { label: t.flagsTab.partialMatch,  ...VERDICT_CONFIG_KEYS.Medium },
    Low:    { label: t.flagsTab.weakMatch,     ...VERDICT_CONFIG_KEYS.Low },
  };

  const bl = t.flagsTab.breakdownLabels;
  const BREAKDOWN_LABELS: Record<string, string> = {
    keyword_match:    bl.keyword_match,
    tech_stack_fit:   bl.tech_stack_fit,
    experience_level: bl.experience_level,
    github_signal:    bl.github_signal,
    linkedin_signal:  bl.linkedin_signal,
  };

  const sortedSkills = [...jdMatch.required_skills].sort((a, b) =>
    a.found === b.found ? 0 : a.found ? 1 : -1
  );

  const foundCount = sortedSkills.filter(s => s.found).length;
  const totalCount = sortedSkills.length;

  const verdictCfg = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.Low;
  const breakdownEntries = Object.entries(breakdown).filter(([, v]) => v !== null) as [string, number][];

  return (
    <div className="space-y-12">

      {/* ── SECTION 1: Recruiter View ─────────────────────── */}
      <div>
        <SectionHeader
          label={t.flagsTab.recruiterAssessment}
          labelColor={verdictCfg.color}
          title={verdictCfg.label}
          subtitle={confidence.reason}
          meta={
            <div className="text-right">
              <div className="text-[44px] font-mono font-medium leading-none text-rc-text">
                {score}<span className="text-[20px] text-rc-hint">/100</span>
              </div>
              <div className={`font-mono text-[12px] mt-1 font-semibold ${verdictCfg.color}`}>
                {confidence.score}% {t.flagsTab.confidenceLabel}
              </div>
            </div>
          }
        />

        <div className={`p-6 border ${verdictCfg.bg} ${verdictCfg.border}`}>
          <div className="space-y-4">
            {breakdownEntries.map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] uppercase tracking-wider text-rc-hint">
                    {BREAKDOWN_LABELS[key] ?? key}
                  </span>
                  <span className={`font-mono text-[12px] font-bold ${value >= 70 ? 'text-rc-green' : value >= 50 ? 'text-rc-amber' : 'text-rc-red'}`}>
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
      </div>

      {/* ── SECTION 2: Recruiter Intuition ───────────────── */}
      <div>
        <SectionHeader
          label={t.flagsTab.hiddenSignals}
          labelColor="text-rc-red"
          title={t.flagsTab.recruiterIntuition}
          subtitle={t.flagsTab.recruiterIntuitionSubtitle.replace('{count}', String(flags.length)).replace(/\{plural\}/g, flags.length !== 1 ? 's' : '')}
        />

        <div className="space-y-3">
          {flags.map((flag, idx) => (
            <div key={idx} className="border border-rc-border border-l-[3px] border-l-rc-red bg-rc-surface p-6 hover:bg-rc-surface-raised transition-colors">
              {/* Meta */}
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-rc-red block mb-2">{t.flagsTab.redFlag}</span>
              {/* Title */}
              <h4 className="text-[19px] font-semibold text-rc-text mb-3 leading-snug">{flag.flag}</h4>
              {/* Divider */}
              <div className="h-px bg-rc-border/40 mb-4" />
              {/* Body */}
              <div className="text-[17px] text-rc-muted leading-[1.7] mb-5">
                <span className="font-mono text-[11px] uppercase text-rc-amber font-bold mr-2">{t.flagsTab.recruiterPerception}</span>
                {flag.perception}
              </div>
              <FixBlock fix={flag.fix} />
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: Technical Requirements ────────────── */}
      <div>
        <SectionHeader
          label={t.flagsTab.skillsChecklist}
          title={t.flagsTab.technicalRequirements}
          subtitle={t.flagsTab.technicalSubtitle}
          meta={
            <div className="text-right">
              <span className={`font-mono text-[22px] font-bold ${foundCount === totalCount ? 'text-rc-green' : foundCount >= totalCount * 0.7 ? 'text-rc-amber' : 'text-rc-red'}`}>
                {foundCount}/{totalCount}
              </span>
              <span className="font-mono text-[11px] text-rc-hint uppercase block">{t.flagsTab.matched}</span>
            </div>
          }
        />

        <div className="bg-rc-surface border border-rc-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1 mb-6">
            {sortedSkills.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-rc-border/30">
                <span className="text-[17px] text-rc-text">{s.skill}</span>
                <div className="flex items-center gap-3">
                  {s.evidence && (
                    <span className="font-mono text-[11px] text-rc-hint">{s.evidence}</span>
                  )}
                  {s.found ? (
                    <span className="font-mono text-[12px] text-rc-green font-bold">✓</span>
                  ) : (
                    <span className="font-mono text-[13px] text-rc-red font-bold leading-none">×</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {jdMatch.experience_gap && (
            <div className="p-4 bg-rc-red/5 border-l-4 border-rc-red">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-rc-red block mb-1.5 font-bold">{t.flagsTab.crucialExperienceGap}</span>
              <p className="text-[17px] text-rc-muted italic leading-[1.7]">{jdMatch.experience_gap}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
