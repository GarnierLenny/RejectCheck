"use client";

import { CheckCircle2, AlertOctagon, Globe, FileText } from "lucide-react";
import type { CrossProfileInconsistency } from "../types";
import { GithubIcon, LinkedinIcon } from "../SocialIcons";
import { SectionHeader } from "../SectionHeader";

const SEVERITY_STYLE: Record<
  CrossProfileInconsistency["severity"],
  { badge: string; border: string; bg: string; label: string }
> = {
  critical: {
    badge: "bg-rc-red text-white",
    border: "border-rc-red/40",
    bg: "bg-rc-red/5",
    label: "Critical",
  },
  major: {
    badge: "bg-rc-amber text-white",
    border: "border-rc-amber/40",
    bg: "bg-rc-amber/5",
    label: "Major",
  },
  minor: {
    badge: "bg-rc-muted/20 text-rc-muted",
    border: "border-rc-border",
    bg: "bg-rc-surface",
    label: "Minor",
  },
};

function SourceIcon({
  source,
}: {
  source: CrossProfileInconsistency["sources"][number];
}) {
  if (source === "cv") return <FileText size={14} className="text-rc-muted" />;
  if (source === "linkedin")
    return <LinkedinIcon size={14} className="text-rc-muted" />;
  if (source === "github")
    return <GithubIcon size={14} className="text-rc-muted" />;
  return <Globe size={14} className="text-rc-muted" />;
}

/**
 * Tab that lists every cross-profile inconsistency detected by the user's
 * ProfileDigest. This is "what a senior recruiter would notice in 30
 * seconds" — concrete divergences between the candidate's CV, LinkedIn,
 * GitHub, and portfolio.
 *
 * Empty state when no inconsistencies exist — encouraging copy rather than
 * a void tab.
 */
export function ConsistencyTab({
  inconsistencies,
}: {
  inconsistencies: CrossProfileInconsistency[];
}) {
  if (inconsistencies.length === 0) {
    return (
      <div>
        <SectionHeader
          label="Consistency"
          title="Your sources are aligned"
          subtitle="No divergences detected between your CV, LinkedIn, GitHub, and portfolio."
        />
        <div className="flex items-center gap-4 p-8 bg-rc-green/5 border border-rc-green/20 rounded-xl">
          <CheckCircle2 size={32} className="text-rc-green shrink-0" />
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-rc-green font-bold mb-1">
              All clear
            </div>
            <p className="text-[14.5px] text-rc-muted leading-relaxed">
              Recruiters cross-check candidates across sources in seconds. Yours
              tell the same story — that&apos;s a real signal of credibility.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...inconsistencies].sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2 };
    return order[a.severity] - order[b.severity];
  });

  const counts = {
    critical: sorted.filter((i) => i.severity === "critical").length,
    major: sorted.filter((i) => i.severity === "major").length,
    minor: sorted.filter((i) => i.severity === "minor").length,
  };

  return (
    <div>
      <SectionHeader
        label="Consistency"
        title={`${sorted.length} mismatch${sorted.length === 1 ? "" : "es"} across your sources`}
        subtitle="A senior recruiter cross-checks candidates in 30 seconds. These are the divergences they would flag."
        meta={
          <div className="flex gap-3">
            {counts.critical > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-rc-red font-bold">
                  {counts.critical} critical
                </span>
              </div>
            )}
            {counts.major > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-amber" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-rc-amber font-bold">
                  {counts.major} major
                </span>
              </div>
            )}
            {counts.minor > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rc-muted/50" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-rc-muted">
                  {counts.minor} minor
                </span>
              </div>
            )}
          </div>
        }
      />

      <div className="border border-rc-border rounded-xl overflow-hidden divide-y divide-rc-border">
        {sorted.map((inc, i) => {
          const style = SEVERITY_STYLE[inc.severity];
          return (
            <div key={i} className={`px-5 py-4 ${style.bg}`}>
              <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 font-bold ${style.badge}`}
                >
                  {style.label}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-rc-hint">
                  {inc.field.replace(/_/g, " ")}
                </span>
                <span className="text-rc-border">·</span>
                <div className="flex items-center gap-1.5">
                  {inc.sources.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] text-rc-muted font-mono uppercase"
                    >
                      <SourceIcon source={s} />
                      {s}
                      {idx < inc.sources.length - 1 && (
                        <span className="ml-0.5 text-rc-border">↔</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-[15px] text-rc-text leading-relaxed mb-2.5">
                {inc.description}
              </div>
              <div className="flex items-start gap-2 text-[13px] text-rc-muted italic leading-snug border-l-2 border-rc-border pl-3">
                <AlertOctagon size={13} className="text-rc-muted mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold not-italic text-rc-hint font-mono text-[11px] uppercase tracking-wider mr-2">
                    Recruiter:
                  </span>
                  {inc.recruiter_perception}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
