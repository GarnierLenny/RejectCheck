export const CELL = 11;
export const GAP = 3;
export const WEEKS = 53;
export const DAY_LABEL_W = 24;

export type HeatmapCell = { date: string; score: number | null };

export const DAY_LABELS: { row: number; label: string }[] = [
  { row: 1, label: "Mon" },
  { row: 3, label: "Wed" },
  { row: 5, label: "Fri" },
];

function startOfWeekUTC(d: Date): Date {
  const day = d.getUTCDay();
  const out = new Date(d);
  out.setUTCDate(d.getUTCDate() - day);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

export function buildGrid(scores: Map<string, number>): HeatmapCell[][] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = startOfWeekUTC(today);
  start.setUTCDate(start.getUTCDate() - (WEEKS - 1) * 7);

  const grid: HeatmapCell[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: HeatmapCell[] = [];
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

export function cellClass(score: number | null): string {
  if (score === null) return "bg-transparent border-transparent";
  if (score === 0) return "bg-rc-bg border-rc-border";
  if (score < 40) return "bg-rc-red/15 border-rc-red/20";
  if (score < 70) return "bg-rc-red/35 border-rc-red/30";
  if (score < 90) return "bg-rc-red/65 border-rc-red/40";
  return "bg-rc-red border-rc-red";
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type ActivityEntry = { date: string; score: number };

export type HeatmapBuild = {
  grid: HeatmapCell[][];
  monthLabels: { col: number; label: string }[];
  total: number;
};

export function buildHeatmap(activity: ActivityEntry[] | undefined): HeatmapBuild {
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
}
