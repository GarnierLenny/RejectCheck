"use client";

import { bandFor } from "../lib/cv-quality-score";

/**
 * POLARITY, the one thing that is easy to get backwards here and has been got
 * backwards in this codebase before: the stored `result.score` is the rejection
 * RISK (higher = worse), while every headline the user sees is COMPETITIVENESS
 * (`100 - risk`, higher = better). The optimizer lowers risk, which must read as
 * the number going UP.
 *
 * Pure, and unit-tested (StickyScoreBar.spec.ts) precisely so this is verified
 * rather than re-reasoned every time someone touches the bar.
 */
export type StickyScoreView = {
  /** Competitiveness as displayed today. */
  current: number;
  /** Competitiveness the live draft projects, or null when nothing is edited. */
  projected: number | null;
  /** True when the draft genuinely improves the score. */
  improved: boolean;
  /** Points gained, in competitiveness terms. 0 when not improved. */
  delta: number;
};

export function stickyScoreView(
  currentRisk: number,
  projectedRisk: number | null,
): StickyScoreView {
  const current = 100 - currentRisk;
  if (projectedRisk == null || projectedRisk === currentRisk) {
    return { current, projected: null, improved: false, delta: 0 };
  }
  const projected = 100 - projectedRisk;
  const improved = projected > current;
  return { current, projected, improved, delta: improved ? projected - current : 0 };
}

function bandColor(value: number): string {
  const tier = bandFor("competitiveness", value);
  return tier === "strong"
    ? "var(--rc-green)"
    : tier === "decent"
      ? "var(--rc-amber)"
      : "var(--rc-red)";
}

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };

type Props = {
  /** Revealed once the §01 hero has scrolled out of the report's scrollport. */
  visible: boolean;
  currentRisk: number;
  projectedRisk: number | null;
  /** Number of uncommitted edits in the draft. */
  changes: number;
  onJump: () => void;
  labels: {
    eyebrow: string;
    change: string;
    changes: string;
    pts: string;
    jump: string;
  };
};

/**
 * Compact score header that takes over once the hero scrolls away, so the number
 * the user is moving stays on screen while they edit.
 *
 * Always mounted and always occupying its height, so revealing it never shifts
 * the report under the reader. Only its chrome and contents fade in.
 */
export function StickyScoreBar({
  visible,
  currentRisk,
  projectedRisk,
  changes,
  onJump,
  labels,
}: Props) {
  const v = stickyScoreView(currentRisk, projectedRisk);
  const live = v.projected != null;

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "sticky",
        // Sticks flush to the scrollport because <main> carries NO top padding:
        // a sticky element is clamped to its containing block's CONTENT box, so
        // any padding-top there would strand the bar that far down the screen
        // (which it did, at 44px) no matter what negative margin it was given.
        top: 0,
        zIndex: 20,
        // Full-bleed across <main>'s horizontal padding only.
        margin: "0 -48px",
        padding: "0 48px",
        height: 52,
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: visible ? "var(--rc-bg)" : "transparent",
        borderBottom: `1px solid ${visible ? "var(--rc-border)" : "transparent"}`,
        boxShadow: visible ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.16s ease, background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease",
      }}
    >
      <span
        style={{
          ...MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--rc-hint)",
          flexShrink: 0,
        }}
      >
        {labels.eyebrow}
      </span>

      <span style={{ display: "flex", alignItems: "baseline", gap: 7, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
        <b
          style={{
            ...MONO,
            fontSize: live ? 15 : 22,
            fontWeight: 700,
            lineHeight: 1,
            color: live ? "var(--rc-hint)" : bandColor(v.current),
            textDecoration: live ? "line-through" : "none",
          }}
        >
          {v.current}
        </b>
        {live && (
          <>
            <span style={{ ...MONO, fontSize: 12, color: "var(--rc-hint)" }}>&rarr;</span>
            <b style={{ ...MONO, fontSize: 22, fontWeight: 700, lineHeight: 1, color: bandColor(v.projected!) }}>
              {v.projected}
            </b>
          </>
        )}
      </span>

      {/* Mini gauge: the hero meter's own gradient, so the two read as one scale. */}
      <div style={{ position: "relative", flex: 1, minWidth: 90, maxWidth: 320, height: 6 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, var(--rc-red) 0%, var(--rc-amber) 50%, var(--rc-green) 100%)",
            opacity: 0.32,
          }}
        />
        {/* Filled span up to the live value. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${live ? v.projected! : v.current}%`,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, var(--rc-red) 0%, var(--rc-amber) 50%, var(--rc-green) 100%)",
            backgroundSize: `${100 / Math.max(1, live ? v.projected! : v.current) * 100}% 100%`,
            transition: "width 0.25s ease",
          }}
        />
        {/* Where the committed score sits, kept visible so the gain is legible. */}
        {live && (
          <span
            style={{
              position: "absolute",
              left: `${v.current}%`,
              top: -3,
              width: 2,
              height: 12,
              borderRadius: 1,
              background: "var(--rc-hint)",
              transform: "translateX(-1px)",
            }}
          />
        )}
        <span
          style={{
            position: "absolute",
            left: `${live ? v.projected! : v.current}%`,
            top: -4,
            width: 3,
            height: 14,
            borderRadius: 2,
            background: bandColor(live ? v.projected! : v.current),
            transform: "translateX(-1.5px)",
            transition: "left 0.25s ease",
          }}
        />
      </div>

      {v.improved && (
        <span style={{ ...MONO, fontSize: 11.5, fontWeight: 700, color: "var(--rc-green)", flexShrink: 0 }}>
          +{v.delta} {labels.pts}
        </span>
      )}

      {changes > 0 && (
        <span style={{ ...MONO, fontSize: 11, color: "var(--rc-hint)", flexShrink: 0 }}>
          {changes} {changes === 1 ? labels.change : labels.changes}
        </span>
      )}

      <button
        onClick={onJump}
        style={{
          ...MONO,
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "6px 12px",
          borderRadius: 5,
          cursor: "pointer",
          border: `1px solid ${changes > 0 ? "var(--rc-green-border)" : "var(--rc-border)"}`,
          background: changes > 0 ? "var(--rc-green-bg)" : "var(--rc-surface)",
          color: changes > 0 ? "var(--rc-green)" : "var(--rc-muted)",
        }}
      >
        {labels.jump}
      </button>
    </div>
  );
}
