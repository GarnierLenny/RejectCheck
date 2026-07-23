"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { TIMELINE, type DiagramPoint } from "./useDiagramLayout";

type CenterNodeProps = {
  /** Scroll progress; absent in the mobile in-flow variant. */
  progress?: MotionValue<number>;
  /** Time-based processing pulse; off when reduced motion or off-screen. */
  pulse?: boolean;
  size?: number;
  /** Diagram anchor; absent = rendered in normal flow (mobile). */
  point?: DiagramPoint;
  /** Mobile shows the resolved state without a scroll to drive it. */
  resolved?: boolean;
};

/* The closing line of the whole sequence. Desktop anchors it in diagram
   coordinates below the engine; mobile drops it in flow under the resolved
   engine. Scroll-driven when `progress` is given, lit when `resolved`. */
export function VerdictChip({
  progress,
  resolved = false,
  children,
}: {
  progress?: MotionValue<number>;
  resolved?: boolean;
  children: React.ReactNode;
}) {
  const idle = useMotionValue(1);
  const p = progress ?? idle;
  const opacity = useTransform(p, [...TIMELINE.verdict], [0, 1]);
  const y = useTransform(p, [...TIMELINE.verdict], [8, 0]);
  return (
    <motion.div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 12px",
        borderRadius: 999,
        background: "linear-gradient(0deg, var(--rc-green-bg), var(--rc-green-bg)), var(--rc-surface)",
        border: "1px solid var(--rc-green-border)",
        color: "var(--rc-green)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        opacity: progress ? opacity : resolved ? 1 : 0,
        y: progress ? y : 0,
        willChange: "transform, opacity",
      }}
    >
      ✓ {children}
    </motion.div>
  );
}

const SHADOW_IDLE = "0 18px 50px -14px rgba(26,25,23,0.28)";
/* Warms through red as the engine cross-examines, then clears to green as
   the fixes land. */
const SHADOW_BUSY = "0 18px 60px -12px rgba(201,58,57,0.42)";
const SHADOW_DONE = "0 18px 60px -12px rgba(34,163,80,0.38)";

export function CenterNode({ progress, pulse = false, size = 112, point, resolved = false }: CenterNodeProps) {
  const idle = useMotionValue(1);
  const p = progress ?? idle;

  /* A kick on each scan it fires, then a bump as the verdict lands. */
  const scanKeyframes = TIMELINE.scan.flatMap(([s]) => [s, s + 0.018, s + 0.038]);
  const scanScales = TIMELINE.scan.flatMap(() => [1, 1.06, 1]);
  const emitScale = useTransform(
    p,
    [...scanKeyframes, ...TIMELINE.emit],
    [...scanScales, 1, 1.07, 1],
  );
  const boxShadow = useTransform(
    p,
    [0.33, 0.52, TIMELINE.centerClear[0], TIMELINE.centerClear[1]],
    [SHADOW_IDLE, SHADOW_BUSY, SHADOW_BUSY, SHADOW_DONE],
  );
  const borderColor = useTransform(
    p,
    [0.33, 0.52, TIMELINE.centerClear[0], TIMELINE.centerClear[1]],
    ["rgba(212,207,201,1)", "rgba(201,58,57,0.55)", "rgba(201,58,57,0.55)", "rgba(34,163,80,0.5)"],
  );

  /* The all-clear: a green glow blooming out from behind the node as the
     last source reports back fixed. */
  const sparkOpacity = useTransform(p, [...TIMELINE.spark], [0, 1]);
  const sparkScale = useTransform(p, [...TIMELINE.spark], [0.55, 1.15]);

  const card = (
    <motion.div style={{ scale: progress ? emitScale : 1, position: "relative", willChange: "transform" }}>
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 2.6,
          height: size * 2.6,
          marginLeft: -size * 1.3,
          marginTop: -size * 1.3,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(34,163,80,0.30) 0%, rgba(34,163,80,0.12) 42%, rgba(34,163,80,0) 70%)",
          filter: "blur(10px)",
          pointerEvents: "none",
          opacity: progress ? sparkOpacity : resolved ? 1 : 0,
          scale: progress ? sparkScale : 1,
          willChange: "transform, opacity",
        }}
      />
      <motion.div
        animate={pulse ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={pulse ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: size * 0.19,
          background: "var(--rc-surface)",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: progress ? borderColor : resolved ? "rgba(34,163,80,0.5)" : "var(--rc-border)",
          display: "grid",
          placeItems: "center",
          boxShadow: progress ? boxShadow : resolved ? SHADOW_DONE : SHADOW_IDLE,
          willChange: "transform",
        }}
      >
        <Image
          src="/RejectCheck_500_bg_less.png"
          alt="RejectCheck"
          width={size}
          height={size}
          style={{ width: size * 0.56, height: "auto" }}
          priority={false}
        />
      </motion.div>
    </motion.div>
  );

  if (!point) return card;

  return (
    <div
      style={{
        position: "absolute",
        left: `${point.leftPct}%`,
        top: `${point.topPct}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      {card}
    </div>
  );
}
