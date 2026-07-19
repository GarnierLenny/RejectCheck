"use client";

import { CheckCircle2, AlertOctagon, Globe, FileText } from "lucide-react";
import type { CrossProfileInconsistency, TimelineEntry } from "../types";
import { GithubIcon, LinkedinIcon } from "../SocialIcons";
import { SectionHeader } from "../SectionHeader";
import { SourceTimeline } from "../timeline/SourceTimeline";

const SEVERITY_STYLE: Record<
  CrossProfileInconsistency["severity"],
  { badge: string; label: string }
> = {
  critical: {
    badge: "bg-rc-red text-white",
    label: "Critical",
  },
  major: {
    badge: "bg-rc-amber text-white",
    label: "Major",
  },
  minor: {
    badge: "bg-rc-muted/20 text-rc-muted",
    label: "Minor",
  },
};

function SourceIcon({
  source,
}: {
  source: CrossProfileInconsistency["sources"][number];
}) {
  if (source === "cv") return <FileText size={12} className="text-rc-muted" />;
  if (source === "linkedin")
    return <LinkedinIcon size={12} className="text-rc-muted" />;
  if (source === "github")
    return <GithubIcon size={12} className="text-rc-muted" />;
  return <Globe size={12} className="text-rc-muted" />;
}

/**
 * Tab that visualises cross-profile inconsistencies detected by the user's
 * ProfileDigest.
 *
 * Layout (top to bottom):
 *  1. SectionHeader with severity counters
 *  2. SourceTimeline — parallel lanes per source, divergence markers anchored
 *     to dates (only rendered when `timeline_entries` is present)
 *  3. Compact 6-col list of each inconsistency with severity, field, source
 *     values, and a recruiter-perspective note
 *
 * Empty state when no inconsistencies → encouraging copy instead of a void
 * tab.
 */
export function ConsistencyTab({
  inconsistencies,
  timelineEntries,
}: {
  inconsistencies: CrossProfileInconsistency[];
  timelineEntries: TimelineEntry[];
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
              tell the same story, that&apos;s a real signal of credibility.
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

  // Markers for the timeline = inconsistencies with a parseable anchor_date.
  // We don't filter by severity — even minor mismatches deserve a dot.
  const markers = sorted
    .map((inc) => {
      if (!inc.anchor_date) return null;
      const date = parseYearMonth(inc.anchor_date);
      if (!date) return null;
      return { date, severity: inc.severity };
    })
    .filter((m): m is { date: Date; severity: CrossProfileInconsistency["severity"] } => m !== null);

  return (
    <div className="space-y-8">
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

      {timelineEntries.length > 0 && (
        <SourceTimeline entries={timelineEntries} markers={markers} />
      )}

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rc-hint mb-3">
          Divergences: detail
        </div>
        <div className="border border-rc-border rounded-lg overflow-hidden bg-rc-surface">
          {sorted.map((inc, i) => (
            <CompactRow
              key={i}
              inc={inc}
              last={i === sorted.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompactRow({
  inc,
  last,
}: {
  inc: CrossProfileInconsistency;
  last: boolean;
}) {
  const style = SEVERITY_STYLE[inc.severity];
  return (
    <div
      className={`grid items-center min-h-[52px] ${
        last ? "" : "border-b border-rc-border/60"
      }`}
      style={{
        gridTemplateColumns: "92px minmax(0, 1fr) 96px minmax(0, 1.4fr) minmax(0, 1.6fr)",
      }}
    >
      <div className="px-3.5 py-2.5">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 font-bold ${style.badge} inline-block`}
        >
          {style.label}
        </span>
      </div>
      <div className="px-3.5 py-2.5 text-[13.5px] font-semibold text-rc-text leading-snug">
        {extractSubject(inc.description)}
      </div>
      <div className="px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-rc-hint">
        {inc.field.replace(/_/g, " ")}
      </div>
      <div className="px-3.5 py-2.5 flex flex-wrap items-center gap-2">
        {inc.sources.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-rc-border font-mono text-[12px]">↔</span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-rc-muted font-mono uppercase tracking-wider">
              <SourceIcon source={s} />
              {s}
            </span>
          </span>
        ))}
      </div>
      <div className="px-4 py-2.5 border-l border-rc-border/60 font-serif italic text-[12.5px] text-rc-muted leading-snug">
        « {inc.recruiter_perception} »
      </div>
    </div>
  );
}

/** Pull the first phrase before a colon / em-dash / first "but" — a quick subject for the row. */
function extractSubject(description: string): string {
  const match = description.match(/^([^:.—]+?)(?:\s+(?:but|alors que|but the)\s|[:—]|\.|$)/i);
  if (match && match[1]) return match[1].trim();
  return description.slice(0, 50);
}

function parseYearMonth(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return null;
  }
  return new Date(year, month - 1, 15);
}
