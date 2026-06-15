"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../context/language";

type Band = "low" | "mid" | "high";

/** 0–33 low (green) · 34–66 moderate (amber) · 67–100 high (red). */
export function riskBand(v: number): Band {
  return v <= 33 ? "low" : v <= 66 ? "mid" : "high";
}

const FG: Record<Band, string> = { low: "text-rc-green", mid: "text-rc-amber", high: "text-rc-red" };
const PILL: Record<Band, string> = {
  low: "text-rc-green bg-rc-green-bg border-rc-green-border",
  mid: "text-rc-amber bg-rc-amber-bg border-rc-amber-border",
  high: "text-rc-red bg-rc-red-bg border-rc-red-border",
};
const SOLID: Record<Band, string> = { low: "bg-rc-green", mid: "bg-rc-amber", high: "bg-rc-red" };

/**
 * Unified rejection-risk hero (design variant C). Used by both result screens.
 * `value` is the rejection-risk score (0 = low risk, 100 = high risk). For
 * cv-review the caller passes `100 − cv_quality.overall`.
 *
 * High = bad = red is made unmistakable by the 3-zone linear meter + the
 * needle landing in the matching zone — no more polarity confusion.
 */
export function RiskMeter({
  value,
  mode,
  context,
  lede,
  sectionNo = "01",
}: {
  value: number;
  /** Picks the default eyebrow context ("vs cette offre" / "ce CV en général"). */
  mode?: "vsjob" | "cv";
  /** Overrides the context string derived from `mode`. */
  context?: string;
  /** Verdict sentence; falls back to a generic per-band line. */
  lede?: React.ReactNode;
  sectionNo?: string;
}) {
  const { t } = useLanguage();
  const rm = t.riskMeter;
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const band = riskBand(v);
  const ledeText = lede ?? rm.lede[band];
  const ctx = context ?? (mode === "cv" ? rm.contextCv : mode === "vsjob" ? rm.contextVsJob : undefined);

  return (
    <section aria-label={`${rm.eyebrow}: ${v}% — ${rm.verdict[band]}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-[6px] w-[6px] rounded-full ${SOLID[band]}`} aria-hidden />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rc-hint">
          § {sectionNo} · {rm.eyebrow}
        </span>
        {ctx && (
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.12em] text-rc-hint">{ctx}</span>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        <div
          className={`font-mono font-bold leading-[0.82] tracking-[-0.05em] ${FG[band]}`}
          style={{ fontSize: "clamp(64px, 9vw, 92px)" }}
        >
          {v}
          <span className="opacity-40" style={{ fontSize: "0.4em" }}>%</span>
        </div>
        <div className="min-w-[180px] flex-1 pt-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] ${PILL[band]}`}
          >
            {rm.verdict[band]}
          </span>
          {ledeText && (
            <p
              className="mt-3 text-[18px] italic leading-[1.35] text-rc-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {ledeText}
            </p>
          )}
        </div>
      </div>

      {/* Linear meter — 3 zones + needle + value bubble */}
      <div className="mt-7">
        <div className="relative flex h-[13px] overflow-hidden rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="h-full bg-rc-green" style={{ flex: 33 }} />
          <div className="h-full bg-rc-amber" style={{ flex: 34 }} />
          <div className="h-full bg-rc-red" style={{ flex: 33 }} />
          <motion.div
            className="absolute -top-[8px] -bottom-[8px] w-[3px] -translate-x-1/2 rounded bg-rc-text"
            initial={reduce ? false : { left: "0%" }}
            animate={{ left: `${v}%` }}
            transition={{ duration: 0.6, ease: [0.3, 0.85, 0.3, 1] }}
            style={{ left: `${v}%` }}
          />
          <motion.div
            className={`absolute -top-[40px] -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-[3px] font-mono text-[10.5px] font-bold text-white ${SOLID[band]}`}
            initial={reduce ? false : { left: "0%" }}
            animate={{ left: `${v}%` }}
            transition={{ duration: 0.6, ease: [0.3, 0.85, 0.3, 1] }}
            style={{ left: `${v}%` }}
          >
            {v}%
            <span className={`absolute -bottom-[3px] left-1/2 h-[7px] w-[7px] -translate-x-1/2 rotate-45 ${SOLID[band]}`} />
          </motion.div>
        </div>
        <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.09em] text-rc-hint">
          <span>0</span>
          <div className="flex flex-1 justify-around">
            <span>{rm.bands.low}</span>
            <span>{rm.bands.mid}</span>
            <span>{rm.bands.high}</span>
          </div>
          <span>100</span>
        </div>
      </div>
    </section>
  );
}
