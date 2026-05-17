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

function scorePolygon(axes: SkillRadarAxis[]): string {
  return axes
    .map((ax, i) => polar(i, axes.length, (ax.score / 100) * R).join(","))
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

export function RadarChart({ axes }: { axes: SkillRadarAxis[] }) {
  const n = axes.length;
  const rings = [25, 50, 75, 100];

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* SVG */}
      <div className="shrink-0 mx-auto md:mx-0">
        <svg viewBox="0 0 300 300" width="280" height="280" aria-hidden="true">
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

          {/* Ring labels (25 / 50 / 75) */}
          {[25, 50, 75].map((pct) => (
            <text
              key={pct}
              x={CX + 3}
              y={CY - (pct / 100) * R - 3}
              fontSize="8"
              fontFamily="monospace"
              fill="var(--rc-border)"
            >
              {pct}
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

          {/* Score fill */}
          <polygon
            points={scorePolygon(axes)}
            fill="var(--rc-red)"
            fillOpacity="0.12"
            stroke="var(--rc-red)"
            strokeOpacity="0.65"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Score dots */}
          {axes.map((ax, i) => {
            const [x, y] = polar(i, n, (ax.score / 100) * R);
            return (
              <circle key={i} cx={x} cy={y} r={3.5} fill="var(--rc-red)" fillOpacity="0.85" />
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

          {/* Score values on dots */}
          {axes.map((ax, i) => {
            const [x, y] = polar(i, n, (ax.score / 100) * R);
            const a = angle(i, n);
            const offsetX = Math.cos(a) >= 0 ? 6 : -6;
            const offsetY = Math.sin(a) >= 0 ? -5 : 5;
            return (
              <text
                key={i}
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
            );
          })}
        </svg>
      </div>

      {/* Evidence list */}
      <div className="flex-1 space-y-3 pt-1">
        {axes.map((ax, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rc-text">
                {ax.label}
              </span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  ax.score >= 75
                    ? "text-rc-green"
                    : ax.score >= 50
                    ? "text-rc-amber"
                    : "text-rc-red"
                }`}
              >
                {ax.score}
              </span>
            </div>
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
            <p className="font-mono text-[10px] text-rc-hint leading-relaxed">
              {ax.evidence}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
