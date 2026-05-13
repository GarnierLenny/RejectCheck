"use client";

import { useMemo } from "react";
import type { CrossProfileInconsistency, TimelineEntry } from "../types";

const SOURCE_ORDER: TimelineEntry["source"][] = [
  "cv",
  "linkedin",
  "portfolio",
  "github",
];

const SOURCE_LABEL: Record<TimelineEntry["source"], string> = {
  cv: "CV",
  linkedin: "LinkedIn",
  portfolio: "Portfolio",
  github: "GitHub",
};

const LANE_HEIGHT = 38;
const BAR_HEIGHT = LANE_HEIGHT - 14;
const TICK_AREA = 28;

type Marker = {
  date: Date;
  severity: CrossProfileInconsistency["severity"];
  label?: string;
};

/**
 * Compares a candidate's career chronology across CV, LinkedIn, GitHub, and
 * portfolio by stacking them as parallel horizontal lanes. Same job in two
 * sources with different dates → two bars that don't line up → instant
 * visual proof of divergence.
 *
 * Pure CSS positioning on percentages (no charting library). The mockup in
 * `~/Downloads/v3-timeline.jsx` is the reference for visual specifics.
 *
 * Empty array of entries → returns null. The parent decides what to show
 * instead (compact list, empty state, etc.).
 */
export function SourceTimeline({
  entries,
  markers,
}: {
  entries: TimelineEntry[];
  markers: Marker[];
}) {
  const today = useMemo(() => new Date(), []);

  // Active lanes = sources that actually have entries, in our canonical order.
  const lanes = useMemo(() => {
    const presentSources = new Set(entries.map((e) => e.source));
    return SOURCE_ORDER.filter((s) => presentSources.has(s));
  }, [entries]);

  // Time range = min start → max end, with 3 months of padding on each side
  // so the first/last bars don't touch the edges.
  const range = useMemo(() => {
    if (entries.length === 0) {
      return { start: today.getTime(), end: today.getTime(), span: 1 };
    }
    const dates = entries
      .flatMap((e) => [parseYearMonth(e.start), parseEndDate(e.end, today)])
      .filter((d): d is Date => d !== null)
      .map((d) => d.getTime());
    const minT = Math.min(...dates);
    const maxT = Math.max(...dates, today.getTime());
    // 3-month padding
    const pad = 1000 * 60 * 60 * 24 * 90;
    const start = minT - pad;
    const end = maxT + pad;
    return { start, end, span: end - start };
  }, [entries, today]);

  const xFor = (date: Date) =>
    ((date.getTime() - range.start) / range.span) * 100;

  // Year ticks = every January 1 within the range.
  const yearTicks = useMemo(() => {
    const startYear = new Date(range.start).getFullYear();
    const endYear = new Date(range.end).getFullYear();
    const ticks: { year: number; x: number }[] = [];
    for (let y = startYear; y <= endYear; y++) {
      const tickDate = new Date(y, 0, 1);
      if (tickDate.getTime() >= range.start && tickDate.getTime() <= range.end) {
        ticks.push({ year: y, x: xFor(tickDate) });
      }
    }
    return ticks;
  }, [range.start, range.end]);

  const todayX = xFor(today);

  if (entries.length === 0) return null;

  const laneHeight = LANE_HEIGHT;
  const chartHeight = lanes.length * laneHeight + TICK_AREA;

  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg p-6 pl-[110px] relative shadow-[0_4px_40px_rgba(0,0,0,0.04)]">
      <div className="flex items-baseline mb-4 -ml-[80px] pl-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-rc-hint">
          Career chronology · sources compared
        </div>
        <div className="flex-1" />
        <div className="flex gap-4 text-[10px] font-mono uppercase tracking-wider text-rc-muted">
          {lanes.map((source, i) => (
            <div key={source} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5"
                style={{
                  background: source === "portfolio" ? "transparent" : "var(--rc-text, #1a1917)",
                  border: source === "portfolio" ? "1px solid var(--rc-border, #d4cfc9)" : "none",
                  opacity: i === 0 ? 1 : 0.55,
                }}
              />
              {SOURCE_LABEL[source]}
            </div>
          ))}
        </div>
      </div>

      <div className="relative" style={{ height: chartHeight }}>
        {/* Year grid lines */}
        {yearTicks.map((t) => (
          <div key={t.year}>
            <div
              className="absolute top-0 w-px bg-rc-border/60"
              style={{ left: `${t.x}%`, bottom: TICK_AREA - 4 }}
            />
            <div
              className="absolute font-mono text-[10px] tracking-[0.14em] text-rc-hint"
              style={{
                left: `${t.x}%`,
                bottom: 4,
                transform: "translateX(-50%)",
              }}
            >
              {t.year}
            </div>
          </div>
        ))}

        {/* Today line */}
        <div
          className="absolute top-0 w-px bg-rc-red/45 z-10"
          style={{ left: `${todayX}%`, bottom: TICK_AREA - 4 }}
        />
        <div
          className="absolute font-mono text-[9px] tracking-[0.18em] uppercase text-rc-red bg-rc-surface px-1 z-10"
          style={{
            left: `${todayX}%`,
            top: -4,
            transform: "translateX(-50%)",
          }}
        >
          today
        </div>

        {/* Lane labels */}
        {lanes.map((source, i) => (
          <div
            key={source}
            className="absolute right-full pr-3.5 font-mono text-[10px] tracking-[0.16em] uppercase text-rc-muted font-medium whitespace-nowrap"
            style={{
              top: i * laneHeight + laneHeight / 2 - 8,
              height: 16,
              lineHeight: "16px",
            }}
          >
            {SOURCE_LABEL[source]}
          </div>
        ))}

        {/* Job bars */}
        {entries.map((entry, idx) => {
          const laneIdx = lanes.indexOf(entry.source);
          if (laneIdx === -1) return null;
          const start = parseYearMonth(entry.start);
          const end = parseEndDate(entry.end, today);
          if (!start || !end) return null;
          const x = xFor(start);
          const w = xFor(end) - x;
          const future = end.getTime() > today.getTime();
          const isPortfolio = entry.source === "portfolio";

          return (
            <div
              key={`${entry.source}-${idx}-${entry.title}`}
              className={`absolute overflow-hidden whitespace-nowrap text-ellipsis flex items-center text-[11px] font-medium rounded-[3px] px-2 ${
                future
                  ? "bg-transparent border border-dashed border-rc-red text-rc-text"
                  : isPortfolio
                    ? "bg-rc-surface-hero border border-rc-border text-rc-text"
                    : "bg-rc-text text-rc-bg"
              }`}
              style={{
                left: `${x}%`,
                width: `${w}%`,
                top: laneIdx * laneHeight + (laneHeight - BAR_HEIGHT) / 2,
                height: BAR_HEIGHT,
              }}
              title={`${entry.title} @ ${entry.company} (${entry.start} → ${entry.end})`}
            >
              {entry.title}
            </div>
          );
        })}

        {/* Divergence markers */}
        {markers.map((mk, idx) => {
          const x = xFor(mk.date);
          if (x < 0 || x > 100) return null;
          const color =
            mk.severity === "critical"
              ? "var(--rc-red, #C93A39)"
              : mk.severity === "major"
                ? "var(--rc-amber, #8a5700)"
                : "var(--rc-hint, #6b6860)";
          return (
            <div
              key={idx}
              className="absolute pointer-events-none z-[5]"
              style={{
                left: `${x}%`,
                top: -8,
                height: lanes.length * laneHeight + 4,
                transform: "translateX(-50%)",
              }}
            >
              <div
                className="w-0.5 h-full"
                style={{ background: color, opacity: 0.4 }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  top: -2,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 8,
                  height: 8,
                  background: color,
                  border: "2px solid var(--rc-surface, #ffffff)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Parse "yyyy-mm" → Date (day 15). Returns null if malformed. */
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

/** Parse end-of-entry — either "yyyy-mm" or "present" (→ today). */
function parseEndDate(s: string, today: Date): Date | null {
  if (s === "present" || s === "now") return today;
  return parseYearMonth(s);
}
