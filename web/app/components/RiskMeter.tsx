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
 * Unified score hero (design variant C). Used by both result screens.
 *
 * Two polarities, one meter:
 *  - `metric="risk"` (default, vs-JD): `value` is the rejection-risk score
 *    (0 = low risk = green on the LEFT, 100 = high risk = red on the RIGHT).
 *  - `metric="strength"` (CV audit): `value` is the CV-strength score (higher =
 *    better). The colour polarity and the 3-zone track are flipped so a strong
 *    CV lands in green on the RIGHT — a "rejection risk" headline makes no sense
 *    with no job attached, so the audit shows the strength directly instead.
 *
 * Polarity is made unmistakable by colour + the needle landing in the matching
 * zone, so high-is-good and high-is-bad never get confused.
 */
export function RiskMeter({
  value,
  mode,
  metric = "risk",
  context,
  lede,
  sectionNo = "01",
  pending = false,
}: {
  value: number;
  /** Picks the default eyebrow context ("vs cette offre" / "ce CV en général"). */
  mode?: "vsjob" | "cv";
  /**
   * "risk" = high is bad (legacy vs-JD). "strength" = high is good (CV audit).
   * "competitiveness" = high is good (vs-JD, shown as 100 − rejection risk).
   */
  metric?: "risk" | "strength" | "competitiveness";
  /** Overrides the context string derived from `mode`. */
  context?: string;
  /** Verdict sentence; falls back to a generic per-band line. */
  lede?: React.ReactNode;
  sectionNo?: string;
  /**
   * While the analysis is still streaming, the only score we have is the model's
   * PROVISIONAL guess — the backend replaces it with the anchored composite in
   * the final payload. Rather than show a number we've decided not to trust and
   * then let it jump, we render a "computing" placeholder until the composite
   * lands. See domain/score/compose-score.ts.
   */
  pending?: boolean;
}) {
  const { t } = useLanguage();
  const rm = t.riskMeter;
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(100, Math.round(value)));
  // "risk" reads low-is-good; "strength" and "competitiveness" read high-is-good.
  const higherBetter = metric !== "risk";
  // High-is-better label set (same shape, different copy per metric).
  const hb = metric === "competitiveness" ? rm.competitiveness : rm.strength;

  // Shared competitiveness/quality bands: Strong >= 80, Decent >= 40, Weak < 40.
  const tier = v >= 80 ? "strong" : v >= 40 ? "decent" : "weak";
  const riskTier = riskBand(v);
  // Colour follows the tier when higher-is-better (green only at Strong), else
  // the risk band.
  const colorBand: Band = higherBetter
    ? tier === "strong"
      ? "low"
      : tier === "decent"
        ? "mid"
        : "high"
    : riskBand(v);

  const eyebrow = higherBetter ? hb.eyebrow : rm.eyebrow;
  const verdictText = higherBetter ? hb.verdict[tier] : rm.verdict[riskTier];
  const ledeText =
    lede ?? (higherBetter ? hb.lede[tier] : rm.lede[riskTier]);
  const ctx =
    context ??
    (higherBetter
      ? hb.context
      : mode === "cv"
        ? rm.contextCv
        : mode === "vsjob"
          ? rm.contextVsJob
          : undefined);
  // Track zones left→right. Risk: good→bad (green|amber|red). Else: bad→good.
  const zones = higherBetter
    ? ["bg-rc-red", "bg-rc-amber", "bg-rc-green"]
    : ["bg-rc-green", "bg-rc-amber", "bg-rc-red"];
  // Band labels under the track, left→right.
  const bandLabels = higherBetter
    ? [hb.bands.weak, hb.bands.decent, hb.bands.strong]
    : [rm.bands.low, rm.bands.mid, rm.bands.high];
  // Strength/competitiveness are 0–100 scores, not percentages — drop the "%".
  const unit = higherBetter ? "" : "%";

  if (pending) {
    return (
      <section aria-label={rm.computing} aria-busy="true">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-rc-hint" aria-hidden />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rc-hint">
            § {sectionNo} · {eyebrow}
          </span>
          {ctx && (
            <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.12em] text-rc-hint">{ctx}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div
            className="animate-pulse font-mono font-bold leading-[0.82] tracking-[-0.05em] text-rc-hint opacity-40"
            style={{ fontSize: "clamp(64px, 9vw, 92px)" }}
            aria-hidden
          >
            ··{unit && <span style={{ fontSize: "0.4em" }}>{unit}</span>}
          </div>
          <div className="min-w-[180px] flex-1 pt-2">
            <p
              className="mt-3 text-[16px] italic leading-[1.35] text-rc-hint"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {rm.computing}
            </p>
          </div>
        </div>

        {/* Neutral 3-zone track, no needle — the score isn't final yet. */}
        <div className="mt-7">
          <div className="relative flex h-[13px] overflow-hidden rounded-full opacity-40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
            <div className={`h-full ${zones[0]}`} style={{ flex: 33 }} />
            <div className={`h-full ${zones[1]}`} style={{ flex: 34 }} />
            <div className={`h-full ${zones[2]}`} style={{ flex: 33 }} />
          </div>
          <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.09em] text-rc-hint">
            <span>0</span>
            <div className="flex flex-1 justify-around">
              <span>{bandLabels[0]}</span>
              <span>{bandLabels[1]}</span>
              <span>{bandLabels[2]}</span>
            </div>
            <span>100</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={`${eyebrow}: ${v}${unit} — ${verdictText}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-[6px] w-[6px] rounded-full ${SOLID[colorBand]}`} aria-hidden />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rc-hint">
          § {sectionNo} · {eyebrow}
        </span>
        {ctx && (
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.12em] text-rc-hint">{ctx}</span>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        <div
          className={`font-mono font-bold leading-[0.82] tracking-[-0.05em] ${FG[colorBand]}`}
          style={{ fontSize: "clamp(64px, 9vw, 92px)" }}
        >
          {v}
          {unit && <span className="opacity-40" style={{ fontSize: "0.4em" }}>{unit}</span>}
        </div>
        <div className="min-w-[180px] flex-1 pt-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] ${PILL[colorBand]}`}
          >
            {verdictText}
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
          <div className={`h-full ${zones[0]}`} style={{ flex: 33 }} />
          <div className={`h-full ${zones[1]}`} style={{ flex: 34 }} />
          <div className={`h-full ${zones[2]}`} style={{ flex: 33 }} />
          <motion.div
            className="absolute -top-[8px] -bottom-[8px] w-[3px] -translate-x-1/2 rounded bg-rc-text"
            initial={reduce ? false : { left: "0%" }}
            animate={{ left: `${v}%` }}
            transition={{ duration: 0.6, ease: [0.3, 0.85, 0.3, 1] }}
            style={{ left: `${v}%` }}
          />
          <motion.div
            className={`absolute -top-[40px] -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-[3px] font-mono text-[10.5px] font-bold text-white ${SOLID[colorBand]}`}
            initial={reduce ? false : { left: "0%" }}
            animate={{ left: `${v}%` }}
            transition={{ duration: 0.6, ease: [0.3, 0.85, 0.3, 1] }}
            style={{ left: `${v}%` }}
          >
            {v}{unit}
            <span className={`absolute -bottom-[3px] left-1/2 h-[7px] w-[7px] -translate-x-1/2 rotate-45 ${SOLID[colorBand]}`} />
          </motion.div>
        </div>
        <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.09em] text-rc-hint">
          <span>0</span>
          <div className="flex flex-1 justify-around">
            <span>{bandLabels[0]}</span>
            <span>{bandLabels[1]}</span>
            <span>{bandLabels[2]}</span>
          </div>
          <span>100</span>
        </div>
      </div>
    </section>
  );
}
