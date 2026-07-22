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

const SHADOW_IDLE = "0 18px 50px -14px rgba(26,25,23,0.28)";
/* Warms through red as the engine cross-examines, then deepens as it lands. */
const SHADOW_BUSY = "0 18px 60px -12px rgba(201,58,57,0.42)";
const SHADOW_DONE = "0 18px 64px -10px rgba(201,58,57,0.55)";

export function CenterNode({ progress, pulse = false, size = 112, point, resolved = false }: CenterNodeProps) {
  const idle = useMotionValue(1);
  const p = progress ?? idle;

  /* A kick on each scan it fires, then a bump as the sources report back. */
  const scanKeyframes = TIMELINE.scan.flatMap(([s]) => [s, s + 0.018, s + 0.038]);
  const scanScales = TIMELINE.scan.flatMap(() => [1, 1.06, 1]);
  const emitScale = useTransform(
    p,
    [...scanKeyframes, ...TIMELINE.emit],
    [...scanScales, 1, 1.07, 1],
  );
  const boxShadow = useTransform(
    p,
    [0.33, 0.52, 0.7, TIMELINE.spark[1]],
    [SHADOW_IDLE, SHADOW_BUSY, SHADOW_BUSY, SHADOW_DONE],
  );
  const borderColor = useTransform(
    p,
    [0.68, TIMELINE.spark[1]],
    ["rgba(212,207,201,1)", "rgba(201,58,57,0.55)"],
  );

  /* The spark: a red glow that blooms out from behind the node as the last
     source reports in. */
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
            "radial-gradient(circle, rgba(201,58,57,0.42) 0%, rgba(201,58,57,0.18) 42%, rgba(201,58,57,0) 70%)",
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
          borderColor: progress ? borderColor : resolved ? "rgba(201,58,57,0.55)" : "var(--rc-border)",
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
