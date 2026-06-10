"use client";

import type { SkillRadarAxis } from "./types";

const CX = 150;
const CY = 150;
const R = 100;
const LABEL_R = R + 26;

function angle(i: number, n: number): number {
  return (2 * Math.PI * i) / n - Math.PI / 2;
}

function polar(i: number, n: number, r: number): [number, number] {
  const a = angle(i, n);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function polygonPoints(n: number, r: number): string {
  return Array.from({ length: n }, (_, i) => polar(i, n, r).join(",")).join(" ");
}

function scorePolygon(axes: Axis[], getValue: (ax: Axis) => number, scale: number): string {
  return axes
    .map((ax, i) => polar(i, axes.length, (getValue(ax) / scale) * R).join(","))
    .join(" ");
}

function textAnchor(i: number, n: number): "middle" | "start" | "end" {
  const a = angle(i, n);
  const cos = Math.cos(a);
  if (Math.abs(cos) < 0.15) return "middle";
  return cos > 0 ? "start" : "end";
}

function labelOffset(i: number, n: number): [number, number] {
  const a = angle(i, n);
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  if (Math.abs(cos) < 0.15) {
    return [0, sin < 0 ? -6 : 6];
  }
  return [cos > 0 ? 4 : -4, 0];
}

type Axis = SkillRadarAxis & { expected?: number };

export function RadarChart({
  axes,
  size = 280,
  fluid = false,
  scale = 100,
  legend,
  showEvidence = true,
  evidenceHeader,
  evidenceFooter,
}: {
  axes: Axis[];
  size?: number;
  fluid?: boolean;
  /** Max value on the scale (100 for cv-review, 10 for vs-job) */
  scale?: number;
  legend?: { current: string; expected: string };
  showEvidence?: boolean;
  evidenceHeader?: { title: string; subtitle: string };
  evidenceFooter?: React.ReactNode;
}) {
  const n = axes.length;
  const hasExpected = axes.some((ax) => ax.expected !== undefined);
  const rings = [25, 50, 75, 100];

  return (
    <div className="flex flex-col md:flex-row gap-10 items-start">
      {/* SVG */}
      <div className={fluid ? "flex-[4] min-w-0 p-6" : "shrink-0 mx-auto md:mx-0"}>
        {hasExpected && legend && (
          <div className="flex gap-5 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-[var(--rc-amber)] bg-[var(--rc-amber)]/10" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-rc-muted">{legend.expected}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--rc-red)]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-rc-muted">{legend.current}</span>
            </div>
          </div>
        )}
        <svg
          viewBox="-80 -40 480 390"
          width={fluid ? "100%" : size}
          height={fluid ? undefined : size}
          aria-hidden="true"
        >
          {/* Background rings */}
          {rings.map((pct) => (
            <polygon
              key={pct}
              points={polygonPoints(n, (pct / 100) * R)}
              fill="none"
              stroke="var(--rc-border)"
              strokeOpacity="0.5"
              strokeWidth="1"
            />
          ))}

          {/* Ring labels */}
          {[25, 50, 75].map((pct) => (
            <text
              key={pct}
              x={CX + 3}
              y={CY - (pct / 100) * R - 3}
              fontSize="8"
              fontFamily="monospace"
              fill="var(--rc-border)"
            >
              {Math.round((pct / 100) * scale)}
            </text>
          ))}

          {/* Axis spokes */}
          {axes.map((_, i) => {
            const [x, y] = polar(i, n, R);
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke="var(--rc-border)"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
            );
          })}

          {/* Expected polygon (amber dashed) */}
          {hasExpected && (
            <polygon
              points={scorePolygon(axes, (ax) => ax.expected ?? 0, scale)}
              fill="var(--rc-amber)"
              fillOpacity="0.05"
              stroke="var(--rc-amber)"
              strokeOpacity="0.7"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeLinejoin="round"
            />
          )}

          {/* Current score fill */}
          <polygon
            points={scorePolygon(axes, (ax) => ax.score, scale)}
            fill="var(--rc-red)"
            fillOpacity="0.12"
            stroke="var(--rc-red)"
            strokeOpacity="0.65"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Score dots + values */}
          {axes.map((ax, i) => {
            const [x, y] = polar(i, n, (ax.score / scale) * R);
            const a = angle(i, n);
            const offsetX = Math.cos(a) >= 0 ? 6 : -6;
            const offsetY = Math.sin(a) >= 0 ? -5 : 5;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={3.5} fill="var(--rc-red)" fillOpacity="0.85" />
                <text
                  x={x + offsetX}
                  y={y + offsetY}
                  textAnchor={Math.cos(a) >= 0 ? "start" : "end"}
                  dominantBaseline="central"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                  fill="var(--rc-red)"
                >
                  {ax.score}
                </text>
              </g>
            );
          })}

          {/* Axis labels */}
          {axes.map((ax, i) => {
            const [lx, ly] = polar(i, n, LABEL_R);
            const [dx, dy] = labelOffset(i, n);
            return (
              <text
                key={i}
                x={lx + dx}
                y={ly + dy}
                textAnchor={textAnchor(i, n)}
                dominantBaseline="central"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="600"
                fill="var(--rc-text)"
              >
                {ax.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Evidence list */}
      {showEvidence && <div className={fluid ? "flex-[6] min-w-0 space-y-3 pt-1" : "flex-1 min-w-0 space-y-3 pt-1"}>
        {evidenceHeader && (
          <div className="mb-4">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-rc-text font-bold flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rc-border" />
              {evidenceHeader.title}
            </h4>
            <p className="font-mono text-[11px] text-rc-hint">{evidenceHeader.subtitle}</p>
          </div>
        )}
        {axes.map((ax, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rc-text">
                {ax.label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[11px] font-bold ${
                    ax.score / scale >= 0.75
                      ? "text-rc-green"
                      : ax.score / scale >= 0.5
                      ? "text-rc-amber"
                      : "text-rc-red"
                  }`}
                >
                  {ax.score}
                </span>
                {ax.expected !== undefined && (
                  <span className="font-mono text-[10px] text-rc-muted">/ {ax.expected}</span>
                )}
              </div>
            </div>
            {ax.expected !== undefined && (
              <div className="h-1 bg-rc-border/30 overflow-hidden relative">
                {/* Expected bar */}
                <div
                  className="absolute h-full bg-[var(--rc-amber)]/30"
                  style={{ width: `${(ax.expected / scale) * 100}%` }}
                />
                {/* Current bar */}
                <div
                  className={`absolute h-full ${
                    ax.score / scale >= 0.75
                      ? "bg-rc-green"
                      : ax.score / scale >= 0.5
                      ? "bg-rc-amber"
                      : "bg-rc-red"
                  }`}
                  style={{ width: `${(ax.score / scale) * 100}%` }}
                />
              </div>
            )}
            {ax.expected === undefined && (
              <div className="h-1 bg-rc-border/30 overflow-hidden">
                <div
                  className={`h-full ${
                    ax.score >= 75
                      ? "bg-rc-green"
                      : ax.score >= 50
                      ? "bg-rc-amber"
                      : "bg-rc-red"
                  }`}
                  style={{ width: `${ax.score}%` }}
                />
              </div>
            )}
            <p className="font-mono text-[10px] text-rc-hint leading-relaxed break-words">
              {ax.evidence}
            </p>
          </div>
        ))}
        {evidenceFooter && <div className="mt-6">{evidenceFooter}</div>}
      </div>}
    </div>
  );
}
