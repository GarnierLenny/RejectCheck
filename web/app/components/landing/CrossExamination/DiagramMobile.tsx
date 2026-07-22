"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CenterNode } from "./CenterNode";
import { MISMATCHES, SOURCES, SourcePlate, sourceName } from "./SourceNode";

const riseProps = (reduce: boolean, delay = 0) => ({
  initial: reduce ? false : ({ opacity: 0, y: 18 } as const),
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] as const },
});

function MobileSourceCard({
  icon,
  name,
  score,
  reduce,
  delay,
}: {
  icon: ReactNode;
  name: string;
  score: number;
  reduce: boolean;
  delay: number;
}) {
  return (
    <motion.div {...riseProps(reduce, delay)} style={{ minWidth: 0 }}>
      <SourcePlate icon={icon} name={name} score={score} style={{ fontSize: 10.5, width: "100%" }} />
    </motion.div>
  );
}

function MobileMismatchCard({ pair, label, reduce }: { pair: string; label: string; reduce: boolean }) {
  return (
    <motion.div
      {...riseProps(reduce)}
      style={{
        background: "linear-gradient(0deg, var(--rc-red-bg), var(--rc-red-bg)), var(--rc-surface)",
        border: "1px solid var(--rc-red-border)",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 99, background: "var(--rc-red)", flexShrink: 0 }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--rc-text)",
        }}
      >
        {pair}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--rc-red)",
          marginLeft: "auto",
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

type DiagramMobileProps = {
  reduce: boolean;
  cx: { step3Num: string; step3Text: string };
};

/* Vertical fallback: the circular hub does not work under 768px. Nodes stack
   in a 2-up grid and each red line becomes a mismatch card between rows;
   the sequence closes on the same hand-back to the engine. */
export function DiagramMobile({ reduce, cx }: DiagramMobileProps) {
  const [cv, linkedin, github, portfolio, cover] = SOURCES;
  const rows: Array<{ cards: typeof SOURCES; mismatch: number }> = [
    { cards: [cv, linkedin], mismatch: 0 },
    { cards: [github, portfolio], mismatch: 1 },
    { cards: [cover], mismatch: 2 },
  ];

  return (
    <div style={{ display: "grid", gap: 10, marginTop: 40 }}>
      {rows.map(({ cards, mismatch }) => {
        const m = MISMATCHES[mismatch];
        return (
          <div key={m.label} style={{ display: "grid", gap: 10 }}>
            {/* Single column: the plate now carries a leader and a score, which
                needs the full width to stay readable at this type size. */}
            <div style={{ display: "grid", gap: 10 }}>
              {cards.map((s, i) => (
                <MobileSourceCard
                  key={s.key}
                  icon={s.icon}
                  name={s.name}
                  score={s.score}
                  reduce={reduce}
                  delay={i * 0.08}
                />
              ))}
            </div>
            <MobileMismatchCard
              pair={`${sourceName(m.from)} ↔ ${sourceName(m.to)}`}
              label={m.label}
              reduce={reduce}
            />
          </div>
        );
      })}

      {/* Every source reports back to the engine, resolved. */}
      <motion.div {...riseProps(reduce)} style={{ display: "grid", justifyItems: "center", gap: 14, marginTop: 22 }}>
        <div aria-hidden style={{ width: 1, height: 34, background: "linear-gradient(var(--rc-border), var(--rc-blue))" }} />
        <CenterNode size={92} resolved />
        <div
          style={{
            display: "inline-flex",
            gap: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "var(--rc-hint)",
            marginTop: 4,
          }}
        >
          <span style={{ color: "var(--rc-red)" }}>{cx.step3Num}</span>
          <span>{cx.step3Text}</span>
        </div>
      </motion.div>
    </div>
  );
}
