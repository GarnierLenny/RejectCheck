"use client";

import { useMemo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { arcSegments, TIMELINE, VIEW_H, VIEW_W, type ArcGeometry } from "./useDiagramLayout";

type MismatchLineProps = {
  geometry: ArcGeometry;
  label: string;
  draw: [number, number];
  /** Phase-3 window in which this contradiction is fixed: the arc retracts
      and the pill flips to a green, struck-through record. */
  fix: [number, number];
  progress: MotionValue<number>;
};

const pillBase = {
  position: "absolute" as const,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  padding: "4px 10px",
  borderRadius: 999,
  whiteSpace: "nowrap" as const,
  willChange: "transform, opacity",
};

export function MismatchLine({ geometry, label, draw, fix, progress }: MismatchLineProps) {
  /* Draws in as the contradiction is found, then retracts as it is fixed:
     the same stroke, played backwards, reads as the line being taken away. */
  const pathLength = useTransform(progress, [draw[0], draw[1], fix[0], fix[1]], [0, 1, 1, 0]);
  const lineOpacity = useTransform(
    progress,
    [draw[0], draw[0] + 0.005, fix[0], fix[1]],
    [0, 1, 1, 0],
  );
  const [labelIn, labelInEnd] = TIMELINE.labelFor(draw);
  /* Stays opaque: the phase-3 spokes run underneath, and a translucent pill
     lets them show through its own text. */
  const labelOpacity = useTransform(
    progress,
    [labelIn, labelInEnd, fix[0] + 0.015, fix[0] + 0.04],
    [0, 1, 1, 0],
  );
  const labelScale = useTransform(progress, [labelIn, labelInEnd], [0.85, 1]);
  /* The resolved record replaces it with a small pop, slightly late, so the
     strike-through lands after the red version has left. */
  const fixedOpacity = useTransform(progress, [fix[0] + 0.03, fix[0] + 0.055], [0, 1]);
  const fixedScale = useTransform(
    progress,
    [fix[0] + 0.03, fix[0] + 0.055, fix[0] + 0.075],
    [0.8, 1.06, 1],
  );
  const segments = useMemo(() => arcSegments(geometry, label), [geometry, label]);

  return (
    /* zIndex auto on the wrapper: the svg keeps drawing under the node cards
       (z 1), while the pills sit above every node including the engine (z 4),
       so a finding is never clipped behind the center card on short
       viewports. */
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", zIndex: 1 }}
      >
        {[segments.fromA, segments.fromB].map((d) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke="var(--rc-red)"
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ pathLength, opacity: lineOpacity }}
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: `${geometry.labelPoint.leftPct}%`,
          top: `${geometry.labelPoint.topPct}%`,
          zIndex: 4,
        }}
      >
        <motion.div
          style={{
            ...pillBase,
            x: "-50%",
            y: "-50%",
            scale: labelScale,
            opacity: labelOpacity,
            background: "linear-gradient(0deg, var(--rc-red-bg), var(--rc-red-bg)), var(--rc-surface)",
            border: "1px solid var(--rc-red-border)",
            color: "var(--rc-red)",
          }}
        >
          {label}
        </motion.div>
        <motion.div
          style={{
            ...pillBase,
            x: "-50%",
            y: "-50%",
            scale: fixedScale,
            opacity: fixedOpacity,
            background: "linear-gradient(0deg, var(--rc-green-bg), var(--rc-green-bg)), var(--rc-surface)",
            border: "1px solid var(--rc-green-border)",
            color: "var(--rc-green)",
          }}
        >
          ✓ <s style={{ textDecorationThickness: "1.5px" }}>{label}</s>
        </motion.div>
      </div>
    </div>
  );
}
