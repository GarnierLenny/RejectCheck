"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { AnalysisResult } from "../types";
import { SectionHeader } from "../SectionHeader";
import { getSeverityStyles } from "../types";
import { useLanguage } from "../../../context/language";

type Props = {
  result: AnalysisResult;
};

type PriorityItem = {
  id: string;
  severity: "critical" | "major" | "minor";
  source: string;
  title: string;
  fixSummary: string;
};

const SEV_ORDER = { critical: 0, major: 1, minor: 2 };

function stripMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1").trim();
}

export function RoadmapTab({ result }: Props) {
  const { t } = useLanguage();
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setDone(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Build unified priority list from all issue sources
  const items: PriorityItem[] = [];

  result.audit.cv.issues.forEach((issue, i) => {
    if (!issue.fix?.summary) return;
    items.push({
      id: `cv-${i}`,
      severity: issue.severity as PriorityItem["severity"],
      source: `CV · ${issue.category}`,
      title: stripMd(issue.what),
      fixSummary: issue.fix.summary,
    });
  });

  result.audit.github.issues.forEach((issue, i) => {
    if (!issue.fix?.summary) return;
    items.push({
      id: `gh-${i}`,
      severity: issue.severity as PriorityItem["severity"],
      source: `GitHub · ${issue.category}`,
      title: stripMd(issue.what),
      fixSummary: issue.fix.summary,
    });
  });

  result.audit.linkedin.issues.forEach((issue, i) => {
    if (!issue.fix?.summary) return;
    items.push({
      id: `li-${i}`,
      severity: issue.severity as PriorityItem["severity"],
      source: `LinkedIn · ${issue.category}`,
      title: stripMd(issue.what),
      fixSummary: issue.fix.summary,
    });
  });

  result.hidden_red_flags.forEach((flag, i) => {
    if (!flag.fix?.summary) return;
    items.push({
      id: `flag-${i}`,
      severity: "major",
      source: "Red Flags",
      title: stripMd(flag.flag),
      fixSummary: flag.fix.summary,
    });
  });

  if (result.seniority_analysis.detected !== result.seniority_analysis.expected && result.seniority_analysis.fix?.summary) {
    items.push({
      id: "seniority",
      severity: "major",
      source: "Profile · Seniority",
      title: `Seniority mismatch - expected ${result.seniority_analysis.expected}, CV signals ${result.seniority_analysis.detected}`,
      fixSummary: result.seniority_analysis.fix.summary,
    });
  }

  if (result.cv_tone.detected !== "active" && result.cv_tone.fix?.summary) {
    items.push({
      id: "tone",
      severity: result.cv_tone.detected === "passive" ? "major" : "minor",
      source: "Profile · Writing",
      title: `${result.cv_tone.detected === "passive" ? "Passive" : "Mixed"} writing tone detected across CV bullet points`,
      fixSummary: result.cv_tone.fix.summary,
    });
  }

  items.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const completion = items.length > 0 ? Math.round((done.size / items.length) * 100) : 100;

  const groups: { key: PriorityItem["severity"]; label: string; desc: string; color: string; dot: string; border: string; bg: string }[] = [
    { key: "critical", label: t.roadmapTab.groups.critical.label, desc: t.roadmapTab.groups.critical.desc, color: "text-rc-red",  dot: "bg-rc-red",  border: "border-rc-red/20",   bg: "bg-rc-red/5"       },
    { key: "major",    label: t.roadmapTab.groups.major.label,    desc: t.roadmapTab.groups.major.desc,    color: "text-rc-amber",dot: "bg-rc-amber",border: "border-rc-amber/20", bg: "bg-rc-amber/5"     },
    { key: "minor",    label: t.roadmapTab.groups.minor.label,    desc: t.roadmapTab.groups.minor.desc,    color: "text-rc-hint", dot: "bg-rc-hint", border: "border-rc-border/30",bg: "bg-rc-surface/10"  },
  ];

  return (
    <div className="space-y-12">
      <SectionHeader
        label={t.roadmapTab.yourRoadmap}
        title={t.roadmapTab.actionPlan}
        subtitle={t.roadmapTab.actionPlanSubtitle}
        meta={
          items.length > 0 ? (
            <div className="text-right">
              <span className="font-mono text-[11px] uppercase tracking-widest text-rc-hint block mb-1">{t.roadmapTab.done}</span>
              <span className={`font-mono font-bold text-[22px] ${completion === 100 ? "text-rc-green" : "text-rc-red"}`}>
                {completion}%
              </span>
            </div>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <div className="p-12 text-center bg-rc-surface border border-rc-border border-dashed">
          <CheckCircle2 className="w-12 h-12 text-rc-green mx-auto mb-4 opacity-20" />
          <h3 className="font-sans font-bold text-[22px] tracking-tight uppercase mb-2">{t.roadmapTab.noIssues.title}</h3>
          <p className="text-rc-muted text-[15px] mx-auto max-w-[300px] leading-relaxed">
            {t.roadmapTab.noIssues.desc}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => {
            const groupItems = items.filter(i => i.severity === group.key);
            if (groupItems.length === 0) return null;
            return (
              <div key={group.key}>
                <div className={`flex items-center gap-2.5 px-5 py-3 border ${group.border} ${group.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${group.dot}`} />
                  <span className={`font-mono text-[11px] uppercase tracking-[0.15em] font-bold ${group.color}`}>
                    {group.label}
                  </span>
                  <span className="font-mono text-[11px] text-rc-hint">
                    - {groupItems.length} {groupItems.length !== 1 ? t.roadmapTab.items : t.roadmapTab.item} {t.roadmapTab.that} {group.desc}
                  </span>
                </div>

                <div className="bg-rc-surface border border-rc-border border-t-0 divide-y divide-rc-border/20">
                  {groupItems.map(item => {
                    const isDone = done.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className="flex items-start gap-4 px-6 py-5 hover:bg-rc-surface-raised transition-colors cursor-pointer group"
                      >
                        <div className="mt-0.5 shrink-0">
                          {isDone
                            ? <CheckCircle2 className="w-[18px] h-[18px] text-rc-green" />
                            : <Circle className="w-[18px] h-[18px] text-rc-hint group-hover:text-rc-red transition-colors" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${getSeverityStyles(item.severity)}`}>
                              {item.severity}
                            </span>
                            <span className="font-mono text-[11px] text-rc-hint bg-rc-bg border border-rc-border/40 px-2 py-0.5">
                              {item.source}
                            </span>
                          </div>
                          <p className={`text-[17px] leading-[1.6] mb-1.5 transition-all ${isDone ? "text-rc-hint line-through" : "text-rc-text font-medium"}`}>
                            {item.title}
                          </p>
                          <p className={`text-[15px] leading-[1.6] ${isDone ? "text-rc-hint/60" : "text-rc-muted"}`}>
                            {item.fixSummary}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
