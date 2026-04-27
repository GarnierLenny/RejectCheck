import { Heading, Caption } from "./typography";
import {
  CELL,
  GAP,
  WEEKS,
  DAY_LABEL_W,
  DAY_LABELS,
  buildHeatmap,
  cellClass,
  formatDate,
  type ActivityEntry,
} from "./heatmap-utils";

type Props = {
  activity: ActivityEntry[];
  title: string;
  lastYearLabel: string;
};

export function PublicHeatmap({ activity, title, lastYearLabel }: Props) {
  const { grid, monthLabels, total } = buildHeatmap(activity);

  const gridWidth = WEEKS * CELL + (WEEKS - 1) * GAP;
  const gridHeight = 7 * CELL + 6 * GAP;

  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Heading as="h3">{title}</Heading>
        <Caption className="whitespace-nowrap">
          <strong className="font-semibold text-rc-text">{total}</strong> {lastYearLabel}
        </Caption>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div style={{ width: DAY_LABEL_W + gridWidth }}>
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
                    className={`rounded-[2px] border ${cellClass(cell.score)}`}
                    style={{ width: CELL, height: CELL }}
                  />
                )),
              )}
            </div>
          </div>

          <Caption className="flex items-center justify-end gap-3 mt-3">
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
          </Caption>
        </div>
      </div>
    </div>
  );
}
