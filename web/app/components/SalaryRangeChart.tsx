"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { SalaryRange, SalaryPeriod } from "./types";

type Props = {
  period: SalaryPeriod;
  marketRange: SalaryRange;
  candidateRange: SalaryRange;
  jdDisclosed?: SalaryRange | null;
  candidateLabel?: string;
  jdLabel?: string;
  marketLabel?: string;
  perDayLabel?: string;
  perYearLabel?: string;
};

const PAD_PCT = 0.08;

function currencyGlyph(c: string): string {
  return c === "USD" ? "$" : c === "GBP" ? "£" : "€";
}

function formatAmount(n: number, period: SalaryPeriod, glyph: string): string {
  if (period === "daily") {
    return `${glyph}${Math.round(n).toLocaleString("en-US")}`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    const rounded = Math.round(k * 10) / 10;
    return `${glyph}${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}k`;
  }
  return `${glyph}${Math.round(n)}`;
}

export function SalaryRangeChart({
  period,
  marketRange,
  candidateRange,
  jdDisclosed,
  candidateLabel = "You",
  jdLabel = "JD",
  marketLabel = "Market",
  perDayLabel = "/day",
  perYearLabel = "/year",
}: Props) {
  const ranges = [marketRange, candidateRange, ...(jdDisclosed ? [jdDisclosed] : [])];
  const lo = Math.min(...ranges.map((r) => r.min));
  const hi = Math.max(...ranges.map((r) => r.max));
  const span = Math.max(hi - lo, 1);
  const xMin = Math.max(0, lo - span * PAD_PCT);
  const xMax = hi + span * PAD_PCT;
  const glyph = currencyGlyph(marketRange.currency);
  const periodLabel = period === "daily" ? perDayLabel : perYearLabel;

  const candMid = (candidateRange.min + candidateRange.max) / 2;
  const candColor =
    candMid < marketRange.min
      ? "var(--rc-red)"
      : candMid > marketRange.max
        ? "var(--rc-green)"
        : "var(--rc-amber)";

  const candValueText = `${formatAmount(candidateRange.min, period, glyph)}–${formatAmount(candidateRange.max, period, glyph)}${periodLabel}`;
  const jdMid = jdDisclosed ? (jdDisclosed.min + jdDisclosed.max) / 2 : null;
  const jdValueText = jdDisclosed
    ? jdDisclosed.min === jdDisclosed.max
      ? `${formatAmount(jdDisclosed.min, period, glyph)}${periodLabel}`
      : `${formatAmount(jdDisclosed.min, period, glyph)}–${formatAmount(jdDisclosed.max, period, glyph)}${periodLabel}`
    : null;

  // Recharts requires at least one data series — invisible Line bridges the domain
  const data = [
    { x: xMin, y: 1 },
    { x: xMax, y: 1 },
  ];

  return (
    <div className="w-full">
      {/* Compact summary above the chart */}
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-wider font-bold"
            style={{ color: candColor }}
          >
            {candidateLabel}
          </span>
          <span
            className="text-[14px] font-bold"
            style={{ color: candColor }}
          >
            {candValueText}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-rc-amber">
            {marketLabel}
          </span>
          <span className="text-[14px] font-medium text-rc-amber">
            {formatAmount(marketRange.min, period, glyph)}–
            {formatAmount(marketRange.max, period, glyph)}
            {periodLabel}
          </span>
        </div>
        {jdDisclosed && jdValueText && (
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-rc-text">
              {jdLabel}
            </span>
            <span className="text-[14px] font-medium text-rc-text">
              {jdValueText}
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={90}>
        <ComposedChart
          data={data}
          margin={{ top: 14, right: 12, bottom: 24, left: 12 }}
        >
          {/* 3 colored zones */}
          <ReferenceArea
            x1={xMin}
            x2={marketRange.min}
            fill="var(--rc-red)"
            fillOpacity={0.12}
            ifOverflow="extendDomain"
          />
          <ReferenceArea
            x1={marketRange.min}
            x2={marketRange.max}
            fill="var(--rc-amber)"
            fillOpacity={0.2}
            ifOverflow="extendDomain"
          />
          <ReferenceArea
            x1={marketRange.max}
            x2={xMax}
            fill="var(--rc-green)"
            fillOpacity={0.12}
            ifOverflow="extendDomain"
          />

          {/* Boundary lines */}
          <ReferenceLine
            x={marketRange.min}
            stroke="var(--rc-amber)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <ReferenceLine
            x={marketRange.max}
            stroke="var(--rc-amber)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* Candidate marker */}
          <ReferenceLine
            x={candMid}
            stroke={candColor}
            strokeWidth={2.5}
            label={{
              value: "▼",
              position: "top",
              fill: candColor,
              fontSize: 12,
            }}
          />

          {/* JD marker (optional) */}
          {jdMid != null && (
            <ReferenceLine
              x={jdMid}
              stroke="var(--rc-text)"
              strokeWidth={2.5}
              label={{
                value: "◆",
                position: "top",
                fill: "var(--rc-text)",
                fontSize: 11,
              }}
            />
          )}

          <XAxis
            dataKey="x"
            type="number"
            domain={[xMin, xMax]}
            tickFormatter={(v) => formatAmount(v, period, glyph)}
            tick={{ fontSize: 10, fill: "var(--rc-hint)", fontFamily: "var(--font-mono)" }}
            axisLine={{ stroke: "var(--rc-border)" }}
            tickLine={{ stroke: "var(--rc-border)" }}
            tickCount={5}
          />
          <YAxis hide domain={[0, 2]} />

          {/* Invisible line to make the chart actually render the data domain */}
          <Line
            type="linear"
            dataKey="y"
            stroke="transparent"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
