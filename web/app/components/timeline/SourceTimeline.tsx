"use client";

import { useMemo, useState } from "react";
import type { CrossProfileInconsistency, TimelineEntry } from "../types";

const SOURCE_ORDER: TimelineEntry["source"][] = ["cv", "linkedin", "portfolio", "github"];

const SOURCE_LABEL: Record<TimelineEntry["source"], string> = {
  cv: "CV", linkedin: "LinkedIn", portfolio: "Portfolio", github: "GitHub",
};

const SOURCE_COLORS: Record<TimelineEntry["source"], { bg: string; text: string; border?: string }> = {
  cv:        { bg: "#C0392B", text: "#fff" },
  linkedin:  { bg: "#0077B5", text: "#fff" },
  github:    { bg: "#24292e", text: "#fff" },
  portfolio: { bg: "transparent", text: "var(--rc-text)", border: "var(--rc-border)" },
};

const TRACK_H    = 58;
const BAR_H      = TRACK_H - 12;
const INCONS_H   = 36;   // dedicated inconsistencies row
const TICK_AREA  = 28;
const LABEL_W    = 120;

type Marker = {
  date: Date;
  severity: CrossProfileInconsistency["severity"];
  description?: string;
  field?: string;
  sources?: string[];
};

type TooltipState =
  | { kind: "entry";  entry: TimelineEntry; clientX: number; clientY: number }
  | { kind: "marker"; marker: Marker;       clientX: number; clientY: number };

// Greedy interval scheduling: assign each entry to the earliest available track.
function assignTracks(items: { start: Date; end: Date }[]): number[] {
  const trackEnds: number[] = [];
  return items.map(({ start, end }) => {
    const t = trackEnds.findIndex((te) => start.getTime() >= te);
    const track = t === -1 ? trackEnds.length : t;
    trackEnds[track] = end.getTime();
    return track;
  });
}

export function SourceTimeline({ entries, markers }: { entries: TimelineEntry[]; markers: Marker[] }) {
  const today = useMemo(() => new Date(), []);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const lanes = useMemo(() => {
    const present = new Set(entries.map((e) => e.source));
    return SOURCE_ORDER.filter((s) => present.has(s));
  }, [entries]);

  const range = useMemo(() => {
    if (!entries.length) return { start: today.getTime(), end: today.getTime(), span: 1 };
    const times = entries
      .flatMap((e) => [parseYearMonth(e.start), parseEndDate(e.end, today)])
      .filter((d): d is Date => d !== null)
      .map((d) => d.getTime());
    const pad = 1000 * 60 * 60 * 24 * 90;
    const start = Math.min(...times) - pad;
    const end   = Math.max(...times, today.getTime()) + pad;
    return { start, end, span: end - start };
  }, [entries, today]);

  const xFor = (d: Date) => ((d.getTime() - range.start) / range.span) * 100;

  // Per-source track layout
  const laneLayout = useMemo(() => {
    const result = new Map<TimelineEntry["source"], {
      entry: TimelineEntry; track: number; start: Date; end: Date;
    }[]>();
    for (const src of lanes) {
      const srcEntries = entries.filter((e) => e.source === src);
      const parsed = srcEntries
        .map((entry) => {
          const start = parseYearMonth(entry.start);
          const end   = parseEndDate(entry.end, today);
          return start && end ? { entry, start, end } : null;
        })
        .filter((x): x is { entry: TimelineEntry; start: Date; end: Date } => x !== null)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
      const tracks = assignTracks(parsed);
      result.set(src, parsed.map(({ entry, start, end }, i) => ({ entry, start, end, track: tracks[i] })));
    }
    return result;
  }, [entries, lanes, today]);

  const { trackCounts, laneOffsets, totalLaneH } = useMemo(() => {
    const trackCounts = new Map<TimelineEntry["source"], number>();
    const laneOffsets = new Map<TimelineEntry["source"], number>();
    // Inconsistencies row sits at the top
    let offset = markers.length > 0 ? INCONS_H : 0;
    for (const src of lanes) {
      const items = laneLayout.get(src) ?? [];
      const count = items.length ? Math.max(...items.map((i) => i.track)) + 1 : 1;
      trackCounts.set(src, count);
      laneOffsets.set(src, offset);
      offset += count * TRACK_H;
    }
    return { trackCounts, laneOffsets, totalLaneH: offset };
  }, [lanes, laneLayout, markers.length]);

  const chartHeight = totalLaneH + TICK_AREA;

  const yearTicks = useMemo(() => {
    const ticks: { year: number; x: number }[] = [];
    for (let y = new Date(range.start).getFullYear(); y <= new Date(range.end).getFullYear(); y++) {
      const d = new Date(y, 0, 1);
      if (d.getTime() >= range.start && d.getTime() <= range.end)
        ticks.push({ year: y, x: xFor(d) });
    }
    return ticks;
  }, [range]);

  if (!entries.length) return null;

  const todayX = xFor(today);
  const hasMarkers = markers.length > 0;

  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg shadow-[0_4px_40px_rgba(0,0,0,0.04)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center px-6 pt-5 pb-4 border-b border-rc-border/60">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-rc-hint">
          Career chronology · sources compared
        </span>
        <div className="flex-1" />
        <div className="flex gap-4">
          {lanes.map((src) => (
            <div key={src} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px]" style={{
                background: SOURCE_COLORS[src].border ? "transparent" : SOURCE_COLORS[src].bg,
                border: SOURCE_COLORS[src].border ? `1px solid ${SOURCE_COLORS[src].bg}` : "none",
              }} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-rc-muted">
                {SOURCE_LABEL[src]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex">

        {/* Pinned lane labels */}
        <div style={{ width: LABEL_W, flexShrink: 0, paddingTop: 8 }}>
          {hasMarkers && (
            <div
              className="font-mono text-[10px] tracking-[0.12em] uppercase font-medium whitespace-nowrap flex items-center"
              style={{ height: INCONS_H, paddingLeft: 24, color: "var(--rc-hint)" }}
            >
              ↕ Conflicts
            </div>
          )}
          {lanes.map((src) => {
            const trackCount = trackCounts.get(src) ?? 1;
            return (
              <div
                key={src}
                className="font-mono text-[10px] tracking-[0.16em] uppercase font-medium whitespace-nowrap flex items-center"
                style={{
                  height: trackCount * TRACK_H,
                  paddingLeft: 24,
                  color: SOURCE_COLORS[src].border ? "var(--rc-muted)" : SOURCE_COLORS[src].bg,
                }}
              >
                {SOURCE_LABEL[src]}
              </div>
            );
          })}
          <div style={{ height: TICK_AREA }} />
        </div>

        {/* Scrollable chart */}
        <div style={{ flex: 1, overflowX: "auto", scrollbarWidth: "thin", borderLeft: "1px solid var(--rc-border)" }}>
          <div className="relative" style={{ minWidth: 1600, height: chartHeight, padding: "8px 24px 0 0" }}>

            {/* Year grid */}
            {yearTicks.map((t) => (
              <div key={t.year}>
                <div className="absolute top-0 w-px bg-rc-border/60" style={{ left: `${t.x}%`, bottom: TICK_AREA - 4 }} />
                <div className="absolute font-mono text-[10px] tracking-[0.14em] text-rc-hint" style={{ left: `${t.x}%`, bottom: 4, transform: "translateX(-50%)" }}>
                  {t.year}
                </div>
              </div>
            ))}

            {/* Today line */}
            <div className="absolute top-0 w-px bg-rc-red/45 z-10" style={{ left: `${todayX}%`, bottom: TICK_AREA - 4 }} />
            <div className="absolute font-mono text-[9px] tracking-[0.18em] uppercase text-rc-red bg-rc-surface px-1 z-10" style={{ left: `${todayX}%`, top: -4, transform: "translateX(-50%)" }}>
              today
            </div>

            {/* ── Inconsistencies row ── */}
            {hasMarkers && (
              <>
                {/* baseline for the row */}
                <div className="absolute w-full border-b border-rc-border/50" style={{ top: INCONS_H }} />
                {markers.map((mk, idx) => {
                  const x = xFor(mk.date);
                  if (x < 0 || x > 100) return null;
                  const color =
                    mk.severity === "critical" ? "#C0392B" :
                    mk.severity === "major"    ? "#C0392B" : "#D97706";
                  const pinY = INCONS_H - 10; // pin sits just above baseline
                  return (
                    <div
                      key={idx}
                      className="absolute z-20"
                      style={{ left: `${x}%`, top: 0, height: INCONS_H, transform: "translateX(-50%)", cursor: "default", width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
                      onMouseEnter={(e) => setTooltip({ kind: "marker", marker: mk, clientX: e.clientX, clientY: e.clientY })}
                      onMouseMove={(e) => setTooltip((t) => t ? { ...t, clientX: e.clientX, clientY: e.clientY } : t)}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* pin head only — no stem */}
                      <div style={{
                        width: 10, height: 10, borderRadius: "50% 50% 50% 0",
                        transform: "rotate(-45deg)",
                        background: color,
                        flexShrink: 0,
                        boxShadow: `0 0 0 2px var(--rc-surface)`,
                      }} />
                    </div>
                  );
                })}
              </>
            )}

            {/* Lane separator lines */}
            {lanes.slice(0, -1).map((src) => {
              const offset = (laneOffsets.get(src) ?? 0) + (trackCounts.get(src) ?? 1) * TRACK_H;
              return <div key={src} className="absolute w-full border-t border-rc-border/40" style={{ top: offset }} />;
            })}

            {/* Bars */}
            {lanes.flatMap((src) =>
              (laneLayout.get(src) ?? []).map(({ entry, track, start, end }, idx) => {
                const laneOffset = laneOffsets.get(src) ?? 0;
                const x = xFor(start);
                const w = xFor(end) - x;
                const future = end.getTime() > today.getTime();
                const colors = SOURCE_COLORS[entry.source];
                const barTop = laneOffset + track * TRACK_H + (TRACK_H - BAR_H) / 2;
                return (
                  <div
                    key={`${src}-${idx}`}
                    className="absolute overflow-hidden rounded-[3px] px-2 flex flex-col justify-center gap-px"
                    style={{
                      left: `${x}%`, width: `${w}%`,
                      top: barTop, height: BAR_H,
                      cursor: "default",
                      background: future ? "transparent" : (colors.border ? "var(--rc-surface)" : colors.bg),
                      color: future ? "var(--rc-text)" : colors.text,
                      border: future ? "1px dashed var(--rc-red)" : colors.border ? `1px solid ${colors.border}` : "none",
                      opacity: future ? 0.7 : 1,
                      zIndex: 1,
                    }}
                    onMouseEnter={(e) => setTooltip({ kind: "entry", entry, clientX: e.clientX, clientY: e.clientY })}
                    onMouseMove={(e) => setTooltip((t) => t ? { ...t, clientX: e.clientX, clientY: e.clientY } : t)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <div className="text-[11px] font-medium leading-tight truncate">{entry.title}</div>
                    <div className="text-[10px] leading-tight truncate" style={{ opacity: 0.65 }}>{entry.company}</div>
                  </div>
                );
              })
            )}

          </div>
        </div>
      </div>

      {/* Tooltip — position: fixed escapes all overflow containers */}
      {tooltip && (
        <div style={{ position: "fixed", left: tooltip.clientX, top: tooltip.clientY - 12, transform: "translateX(-50%) translateY(-100%)", zIndex: 9999, pointerEvents: "none" }}>
          <div style={{ background: "var(--rc-text)", color: "var(--rc-bg)", borderRadius: 6, padding: "10px 14px", minWidth: 200, maxWidth: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" }}>
            {tooltip.kind === "entry" ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: SOURCE_COLORS[tooltip.entry.source].border ? "transparent" : SOURCE_COLORS[tooltip.entry.source].bg, border: SOURCE_COLORS[tooltip.entry.source].border ? `1px solid ${SOURCE_COLORS[tooltip.entry.source].bg}` : "none" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55 }}>{SOURCE_LABEL[tooltip.entry.source]}</span>
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{tooltip.entry.title}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, opacity: 0.65, marginBottom: 6 }}>{tooltip.entry.company}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", opacity: 0.5 }}>
                  {tooltip.entry.start} → {tooltip.entry.end === "present" ? "present" : tooltip.entry.end}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "1px 6px", borderRadius: 3,
                    background: tooltip.marker.severity === "minor" ? "#D97706" : "#C0392B",
                    color: "#fff",
                  }}>
                    {tooltip.marker.severity}
                  </span>
                  {tooltip.marker.field && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5 }}>
                      {tooltip.marker.field.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                {tooltip.marker.description && (
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.5, marginBottom: tooltip.marker.sources?.length ? 6 : 0 }}>
                    {tooltip.marker.description}
                  </div>
                )}
                {tooltip.marker.sources && tooltip.marker.sources.length > 0 && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", opacity: 0.5 }}>
                    {tooltip.marker.sources.join(" vs ")}
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 10, height: 6, background: "var(--rc-text)", clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
        </div>
      )}
    </div>
  );
}

function parseYearMonth(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const year = parseInt(m[1], 10), month = parseInt(m[2], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return new Date(year, month - 1, 15);
}

function parseEndDate(s: string, today: Date): Date | null {
  if (s === "present" || s === "now") return today;
  return parseYearMonth(s);
}
