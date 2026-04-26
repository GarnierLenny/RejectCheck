"use client";

import { useMemo } from "react";
import { useChallengeActivity, useChallengeStreak } from "../../lib/challenge";

const CELL = 11;
const GAP = 3;
const WEEKS = 53;
const DAY_LABEL_W = 24;

type Cell = { date: string; score: number | null };

function startOfWeekUTC(d: Date): Date {
  const day = d.getUTCDay();
  const out = new Date(d);
  out.setUTCDate(d.getUTCDate() - day);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function buildGrid(scores: Map<string, number>): Cell[][] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = startOfWeekUTC(today);
  start.setUTCDate(start.getUTCDate() - (WEEKS - 1) * 7);

  const grid: Cell[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setUTCDate(start.getUTCDate() + w * 7 + d);
      if (cur > today) {
        col.push({ date: cur.toISOString().slice(0, 10), score: null });
      } else {
        const key = cur.toISOString().slice(0, 10);
        col.push({ date: key, score: scores.get(key) ?? 0 });
      }
    }
    grid.push(col);
  }
  return grid;
}

function cellClass(score: number | null): string {
  if (score === null) return "bg-transparent border-transparent";
  if (score === 0) return "bg-rc-bg border-rc-border";
  if (score < 40) return "bg-rc-red/15 border-rc-red/20";
  if (score < 70) return "bg-rc-red/35 border-rc-red/30";
  if (score < 90) return "bg-rc-red/65 border-rc-red/40";
  return "bg-rc-red border-rc-red";
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DAY_LABELS: { row: number; label: string }[] = [
  { row: 1, label: "Mon" },
  { row: 3, label: "Wed" },
  { row: 5, label: "Fri" },
];

export function ChallengeHeatmap() {
  const { data: activity, isLoading } = useChallengeActivity();
  const { data: streak } = useChallengeStreak();

  const { grid, monthLabels, total } = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    for (const a of activity ?? []) {
      map.set(a.date, a.score);
      total += 1;
    }
    const grid = buildGrid(map);

    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    grid.forEach((col, idx) => {
      const first = col[0];
      if (!first) return;
      const m = new Date(first.date + "T00:00:00Z").getUTCMonth();
      if (m !== lastMonth) {
        monthLabels.push({
          col: idx,
          label: new Date(first.date + "T00:00:00Z").toLocaleString("en-US", {
            month: "short",
          }),
        });
        lastMonth = m;
      }
    });

    return { grid, monthLabels, total };
  }, [activity]);

  const gridWidth = WEEKS * CELL + (WEEKS - 1) * GAP;
  const gridHeight = 7 * CELL + 6 * GAP;

  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[9px] uppercase tracking-widest text-rc-hint">
          Daily challenge activity
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-rc-hint">
          <span>
            <span className="text-rc-text font-medium">{total}</span> last 365d
          </span>
          {streak && (
            <>
              <span className="text-rc-border">·</span>
              <span>
                streak <span className="text-rc-text font-medium">{streak.currentStreak}</span>
              </span>
              <span className="text-rc-border">·</span>
              <span>
                best <span className="text-rc-text font-medium">{streak.longestStreak}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div style={{ width: DAY_LABEL_W + gridWidth }}>
          {/* Month row */}
          <div
            className="relative h-3 mb-1 font-mono text-[9px] text-rc-hint"
            style={{ marginLeft: DAY_LABEL_W, width: gridWidth }}
          >
            {monthLabels.map(({ col, label }) => (
              <span
                key={`${col}-${label}`}
                className="absolute top-0"
                style={{ left: col * (CELL + GAP) }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex" style={{ gap: GAP }}>
            {/* Day labels */}
            <div
              className="relative font-mono text-[9px] text-rc-hint"
              style={{ width: DAY_LABEL_W - GAP, height: gridHeight }}
            >
              {DAY_LABELS.map(({ row, label }) => (
                <span
                  key={label}
                  className="absolute"
                  style={{ top: row * (CELL + GAP) - 1 }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Grid: 7 rows × 53 cols, fill column-by-column */}
            <div
              className="grid"
              style={{
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gridAutoColumns: `${CELL}px`,
                gridAutoFlow: "column",
                gap: `${GAP}px`,
                width: gridWidth,
                height: gridHeight,
              }}
              aria-busy={isLoading}
            >
              {grid.flatMap((col) =>
                col.map((cell) => (
                  <div
                    key={cell.date}
                    title={
                      cell.score === null
                        ? ""
                        : cell.score === 0
                          ? `No challenge on ${formatDate(cell.date)}`
                          : `Score ${cell.score}/100 on ${formatDate(cell.date)}`
                    }
                    className={`rounded-[2px] border ${cellClass(cell.score)}`}
                    style={{ width: CELL, height: CELL }}
                  />
                )),
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-3 mt-3 font-mono text-[9px] text-rc-hint">
            <span className="flex items-center gap-1.5">
              <span className="rounded-[2px] border bg-rc-bg border-rc-border" style={{ width: CELL, height: CELL }} />
              0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded-[2px] border bg-rc-red/15 border-rc-red/20" style={{ width: CELL, height: CELL }} />
              {"<"} 40
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded-[2px] border bg-rc-red/35 border-rc-red/30" style={{ width: CELL, height: CELL }} />
              {"<"} 70
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded-[2px] border bg-rc-red/65 border-rc-red/40" style={{ width: CELL, height: CELL }} />
              {"<"} 90
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded-[2px] border bg-rc-red border-rc-red" style={{ width: CELL, height: CELL }} />
              ≥ 90
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
