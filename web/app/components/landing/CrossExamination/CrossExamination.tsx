"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLanguage } from "../../../../context/language";
import { DiagramDesktop } from "./DiagramDesktop";
import { DiagramMobile } from "./DiagramMobile";
import { TIMELINE } from "./useDiagramLayout";

const IT: React.CSSProperties = { fontWeight: 700, color: "#C0392B", fontStyle: "normal" };

/* Breakpoints + keyframes are scoped here, mirroring the landing page's
   inline <style> convention. rcx-blink is the hero LIVE-dot pulse. */
const RCX_CSS = `
.rcx-desktop { display: none; }
.rcx-mobile { display: block; }
@media (min-width: 768px) {
  .rcx-desktop { display: block; }
  .rcx-mobile { display: none; }
}
@keyframes rcx-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
/* Reduced motion: drop the pin in CSS rather than JS. The server can't know
   the preference, so a JS-driven height would ship 300vh and only correct
   itself after hydration; this is right from the first paint. */
@media (prefers-reduced-motion: reduce) {
  .rcx-blink-dot { animation: none !important; }
  .rcx-track { height: auto !important; }
  .rcx-pin { position: static !important; height: auto !important; padding: 110px 0 90px !important; }
}
`;

type CrossExamCopy = ReturnType<typeof useLanguage>["t"]["landing"]["crossExam"];

/* framer's useReducedMotion snapshots once via useState and never subscribes,
   so it stays false through hydration. Subscribe properly instead. */
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

function SectionHead({ cx, align }: { cx: CrossExamCopy; align: "center" | "left" }) {
  return (
    <div
      style={{
        textAlign: align,
        maxWidth: 900,
        margin: align === "center" ? "0 auto" : 0,
        padding: align === "center" ? "0 24px" : 0,
        flexShrink: 0,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          fontSize: "clamp(30px, 3.4vw, 46px)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          margin: 0,
          whiteSpace: "pre-line",
        }}
      >
        {cx.h2Part1} <em style={IT}>{cx.h2Italic}</em> {cx.h2Part2}
      </h2>
      <p
        style={{
          margin: "14px 0 0",
          fontSize: 14.5,
          lineHeight: 1.55,
          color: "var(--rc-hint)",
          whiteSpace: "pre-line",
        }}
      >
        {cx.sub1}
        {"\n"}
        {cx.sub2}
      </p>
    </div>
  );
}

const RAIL_ITEM: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: "var(--rc-hint)",
};

function StepRail({
  progress,
  cx,
  reduce,
}: {
  progress: MotionValue<number>;
  cx: CrossExamCopy;
  reduce: boolean;
}) {
  const o1 = useTransform(progress, [...TIMELINE.steps.oneOut], [1, 0]);
  const o2 = useTransform(progress, [...TIMELINE.steps.two], [0, 1, 1, 0]);
  const o3 = useTransform(progress, [...TIMELINE.steps.threeIn], [0, 1]);
  const steps: Array<[MotionValue<number>, string, string, string]> = [
    [o1, cx.step1Num, cx.step1Text, "var(--rc-red)"],
    [o2, cx.step2Num, cx.step2Text, "var(--rc-red)"],
    [o3, cx.step3Num, cx.step3Text, "var(--rc-red)"],
  ];

  /* Nothing cross-fades without scroll, so list the three steps at once. */
  if (reduce) {
    return (
      <div style={{ ...RAIL_ITEM, gap: 20, flexWrap: "wrap", marginTop: 24 }}>
        {steps.map(([, num, text, color]) => (
          <span key={num} style={{ display: "inline-flex", gap: 8 }}>
            <span style={{ color }}>{num}</span>
            <span>{text}</span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <div style={{ position: "relative", height: 40, marginTop: 8, flexShrink: 0 }}>
      {steps.map(([opacity, num, text, color]) => (
        <motion.div key={num} style={{ ...RAIL_ITEM, opacity, position: "absolute", inset: 0 }}>
          <span style={{ color }}>{num}</span>
          <span aria-hidden>·</span>
          <span>{text}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function CrossExamination() {
  const { t } = useLanguage();
  const cx = t.landing.crossExam;
  const reduce = usePrefersReducedMotion();

  const pinRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start start", "end end"] });
  /* Route through the function-transformer path: framer 12's "accelerate"
     fast-path otherwise registers native ScrollTimeline animations against
     page scroll, ignoring the target offsets (wrong timing for every
     downstream useTransform). */
  const trackedProgress = useTransform(scrollYProgress, (v: number) => v);
  /* Reduced motion: no pin, no drawing, just the resolved end state — every
     line drawn, the sources reporting back in green, the spark lit. */
  const staticProgress = useMotionValue(1);
  const progress = reduce ? staticProgress : trackedProgress;
  const nearViewport = useInView(pinRef, { margin: "600px 0px" });

  return (
    <section aria-label={cx.ariaLabel} style={{ borderTop: "1px solid var(--rc-border)" }}>
      <style>{RCX_CSS}</style>

      {/* Desktop / tablet: 300vh scroll track, viewport pinned via sticky.
          Both are unset by the reduced-motion rules in RCX_CSS. */}
      <div ref={pinRef} className="rcx-desktop rcx-track" style={{ height: "300vh", position: "relative" }}>
        <div
          className="rcx-pin"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "28px 0 12px",
          }}
        >
          <div style={{ marginBottom: "clamp(18px, 3vh, 36px)" }}>
            <SectionHead cx={cx} align="center" />
          </div>
          <DiagramDesktop progress={progress} ambient={nearViewport && !reduce} />
          <StepRail progress={progress} cx={cx} reduce={reduce} />
        </div>
      </div>

      {/* Mobile: natural scroll, vertical layout. */}
      <div className="rcx-mobile" style={{ padding: "88px 20px 72px", maxWidth: 560, margin: "0 auto" }}>
        <SectionHead cx={cx} align="left" />
        <DiagramMobile reduce={reduce} cx={cx} />
      </div>
    </section>
  );
}
