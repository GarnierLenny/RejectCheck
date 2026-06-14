import React from "react";

/**
 * Shared atomic primitives for the result screens (AnalysisLayout, AnalysisShell,
 * and — as they converge — CvAuditResult). Kept identical to the previous local
 * definitions so consolidation is a pure dedup with no visual change.
 */

/** Mono uppercase micro-label. `color` defaults to rc-hint. */
export function Eyebrow({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: color ?? "var(--rc-hint)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Monospace span with tabular numerals — for scores/counters. */
export function Mono({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", ...style }}>
      {children}
    </span>
  );
}
