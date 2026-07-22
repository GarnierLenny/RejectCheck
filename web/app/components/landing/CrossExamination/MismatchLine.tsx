"use client";

import { useMemo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { arcSegments, TIMELINE, VIEW_H, VIEW_W, type ArcGeometry } from "./useDiagramLayout";

type MismatchLineProps = {
  geometry: ArcGeometry;
  label: string;
  draw: [number, number];
  progress: MotionValue<number>;
};

export function MismatchLine({ geometry, label, draw, progress }: MismatchLineProps) {
  const pathLength = useTransform(progress, draw, [0, 1]);
  const lineOpacity = useTransform(
    progress,
    [draw[0], draw[0] + 0.005, TIMELINE.dim[0], TIMELINE.dim[1]],
    [0, 1, 1, 0.5],
  );
  const [labelIn, labelInEnd] = TIMELINE.labelFor(draw);
  /* Stays opaque: the phase-3 spokes run underneath, and a translucent pill
     lets them show through its own text. */
  const labelOpacity = useTransform(progress, [labelIn, labelInEnd], [0, 1]);
  const labelScale = useTransform(progress, [labelIn, labelInEnd], [0.85, 1]);
  const segments = useMemo(() => arcSegments(geometry, label), [geometry, label]);

  return (
    /* Lines render under the node cards (z 1) so endpoints tuck behind them;
       the pill never overlaps a node, so it can live in the same layer. */
    <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
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
      <motion.div
        style={{
          position: "absolute",
          left: `${geometry.labelPoint.leftPct}%`,
          top: `${geometry.labelPoint.topPct}%`,
          x: "-50%",
          y: "-50%",
          scale: labelScale,
          opacity: labelOpacity,
          background: "linear-gradient(0deg, var(--rc-red-bg), var(--rc-red-bg)), var(--rc-surface)",
          border: "1px solid var(--rc-red-border)",
          color: "var(--rc-red)",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "4px 10px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          willChange: "transform, opacity",
        }}
      >
        {label}
      </motion.div>
    </div>
  );
}
