import {
  GAP,
  WEEKS,
  DAY_LABEL_W,
  DAY_LABELS,
  buildHeatmap,
  type ActivityEntry,
  formatDate,
} from "./heatmap-utils";

const CELL = 14;

type Props = {
  activity: ActivityEntry[];
  title: string;
  lastYearLabel: string;
};

function cellClass(score: number | null): string {
  if (score === null) return "bg-transparent";
  if (score === 0) return "bg-rc-border/60";
  if (score < 40) return "bg-rc-red/15";
  if (score < 70) return "bg-rc-red/35";
  if (score < 90) return "bg-rc-red/65";
  return "bg-rc-red";
}

export function PublicHeatmap({ activity, title, lastYearLabel }: Props) {
  const { grid, monthLabels, total } = buildHeatmap(activity);

  const gridWidth = WEEKS * CELL + (WEEKS - 1) * GAP;
  const gridHeight = 7 * CELL + 6 * GAP;

  return (
    <div className="py-8 border-b border-rc-border">
      <div className="mb-6">
        <h2 className="font-serif text-[32px] font-normal leading-none mb-1" style={{ letterSpacing: -0.5 }}>
          {title}
        </h2>
        <p className="font-mono text-[12px] text-rc-hint">
          <strong className="font-semibold text-rc-text">{total}</strong> {lastYearLabel}
        </p>
      </div>

      <div className="flex justify-center overflow-x-auto">
        <div style={{ width: DAY_LABEL_W + gridWidth }}>
          <div
            className="relative h-3 mb-2 font-mono text-[9px] text-rc-hint"
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
                    className={`rounded-[3px] ${cellClass(cell.score)}`}
                    style={{ width: CELL, height: CELL }}
                  />
                )),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
