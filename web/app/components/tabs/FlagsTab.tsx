"use client";

import type { AnalysisResult } from "../types";
import { FixBlock } from "../FixBlock";
import { FixBlockSkeleton } from "../skeletons/FixBlockSkeleton";
import { SectionHeader } from "../SectionHeader";
import { Md } from "../Md";
import { useLanguage } from "../../../context/language";

type Props = {
  flags: AnalysisResult["hidden_red_flags"];
  jdMatch?: AnalysisResult["audit"]["jd_match"];
  score: AnalysisResult["score"];
  verdict?: AnalysisResult["verdict"];
  confidence?: AnalysisResult["confidence"];
  breakdown?: AnalysisResult["breakdown"];
  fixesReady?: boolean;
};

export function FlagsTab({ flags, jdMatch, fixesReady = true }: Props) {
  const { t } = useLanguage();

  const sortedSkills = jdMatch ? [...jdMatch.required_skills].sort((a, b) =>
    a.found === b.found ? 0 : a.found ? 1 : -1
  ) : [];

  const foundCount = sortedSkills.filter(s => s.found).length;
  const totalCount = sortedSkills.length;

  return (
    <div className="space-y-12">

      {/* ── SECTION 1: Recruiter Intuition ───────────────── */}
      <div>
        <SectionHeader
          label={t.flagsTab.hiddenSignals}
          labelColor="text-rc-red"
          title={t.flagsTab.recruiterIntuition}
          subtitle={t.flagsTab.recruiterIntuitionSubtitle.replace('{count}', String(flags.length)).replace(/\{plural\}/g, flags.length !== 1 ? 's' : '')}
        />

        <div className="space-y-3">
          {flags.map((flag, idx) => (
            <div key={idx} className="border border-rc-border bg-rc-surface p-6 hover:bg-rc-surface-raised transition-colors">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-rc-red block mb-2">{t.flagsTab.redFlag}</span>
              <h4 className="text-[19px] font-semibold text-rc-text mb-3 leading-snug"><Md>{flag.flag}</Md></h4>
              <div className="h-px bg-rc-border/40 mb-4" />
              <div className="text-[17px] text-rc-muted leading-[1.7] mb-5">
                <span className="font-mono text-[11px] uppercase text-rc-amber font-bold mr-2">{t.flagsTab.recruiterPerception}</span>
                <Md>{flag.perception}</Md>
              </div>
              {flag.fix ? <FixBlock fix={flag.fix} /> : fixesReady ? <FixBlockSkeleton /> : null}
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: Technical Requirements — vs-job analyses only ── */}
      {jdMatch && (
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
              <div className="p-4 bg-rc-red/5">
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-rc-red block mb-1.5 font-bold">{t.flagsTab.crucialExperienceGap}</span>
                <p className="text-[17px] text-rc-muted italic leading-[1.7]"><Md>{jdMatch.experience_gap}</Md></p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
