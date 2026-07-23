"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { FileText, Globe, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "../../SocialIcons";
import { type DiagramPoint, type SourceKey } from "./useDiagramLayout";

/* Mock visualization data, hardcoded like the hero's own mock content
   (HERO_DIVERGENCES et al. in the landing page). */
/* Scores track the contradiction count so a careful reader is not caught out:
   Portfolio is clean, LinkedIn and Cover letter carry one each, CV and GitHub
   two. `resolved` is where each lands once the contradictions are fixed in
   phase 3 — the climb mirrors the contradiction count too. */
export const SOURCES: Array<{ key: SourceKey; name: string; score: number; resolved: number; icon: ReactNode }> = [
  { key: "cv", name: "CV", score: 58, resolved: 91, icon: <FileText size={15} strokeWidth={1.8} /> },
  { key: "linkedin", name: "LinkedIn", score: 74, resolved: 93, icon: <LinkedinIcon size={14} /> },
  { key: "github", name: "GitHub", score: 43, resolved: 88, icon: <GithubIcon size={15} /> },
  { key: "portfolio", name: "Portfolio", score: 88, resolved: 95, icon: <Globe size={15} strokeWidth={1.8} /> },
  { key: "cover", name: "Cover letter", score: 69, resolved: 90, icon: <Mail size={15} strokeWidth={1.8} /> },
];

export const MISMATCHES: Array<{ from: SourceKey; to: SourceKey; bow: number; label: string }> = [
  { from: "cv", to: "linkedin", bow: 64, label: "Title mismatch" },
  { from: "cv", to: "github", bow: 110, label: "Claims ≠ activity" },
  { from: "cover", to: "github", bow: 120, label: "Go expert, 0 Go repos" },
];

export const sourceName = (key: SourceKey) => SOURCES.find((s) => s.key === key)?.name ?? key;

/* Framer interpolates literal colors, not CSS vars. Values mirror the
   --rc-border / --rc-surface-raised / --rc-hint / --rc-red tokens. */
const BORDER = "#d4cfc9";
const GUTTER = "#fafaf9";
const HINT = "#6b6860";
const INK = "#1a1917";
const RED = "#C93A39";
const RED_WASH = "rgba(201,58,57,0.07)";
const RED_RULE = "rgba(201,58,57,0.22)";
const GREEN = "#22a350";
const GREEN_WASH = "rgba(34,163,80,0.08)";
const GREEN_RULE = "rgba(34,163,80,0.3)";

/* ─── The plate ───────────────────────────────────────────────────────────
   A caption on a type-specimen sheet rather than a UI card: a tinted first
   column separated by a full-height column rule, tracked small caps, and a
   terminal tick at the right margin. Sized in em off one clamped font-size,
   so the whole plate scales down on narrow viewports without a transform
   (framer already owns transform here for the entry and the shake). */
const PLATE_FONT = "clamp(8.4px, 0.7vw, 10px)";

const plateShell: CSSProperties = {
  /* Wide enough for the longest label (COVER LETTER) plus a leader and the
     score, with slack so a fallback face rendering before Inter loads cannot
     clip against the plate's overflow: hidden. */
  fontSize: PLATE_FONT,
  position: "relative",
  width: "20.6em",
  height: "3.8em",
};

const plateSurface: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "stretch",
  background: "var(--rc-surface)",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 5,
  overflow: "hidden",
  boxShadow:
    "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(20,20,20,0.04), 0 10px 22px -14px rgba(40,30,30,0.18)",
};

const gutterStyle: CSSProperties = {
  flex: "0 0 3.2em",
  display: "grid",
  placeItems: "center",
  borderRightWidth: 1,
  borderRightStyle: "solid",
};

const fieldStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "0.8em",
  padding: "0 1em",
};

const labelStyle: CSSProperties = {
  flex: "0 0 auto",
  fontFamily: "var(--font-sans)",
  fontSize: "1em",
  lineHeight: 1,
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--rc-text)",
  whiteSpace: "nowrap",
};

/* The leader now carries the eye to an actual value, which is what a leader
   is for. It is also the one mark that stays red once a contradiction has
   been filed against this source: the red lives in the rules, the readout
   stays ink. */
const leaderStyle: CSSProperties = { flex: "1 1 auto", minWidth: "0.6em", height: 1 };

const scoreStyle: CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  alignItems: "baseline",
  gap: "0.15em",
  fontFamily: "var(--font-sans)",
  fontVariantNumeric: "tabular-nums",
  color: "var(--rc-text)",
};

const scoreNumStyle: CSSProperties = {
  fontSize: "1.2em",
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: "0.01em",
};

const scoreOutOfStyle: CSSProperties = {
  fontSize: "0.8em",
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: "0.04em",
  color: "var(--rc-hint)",
};

/** Static plate, used in the mobile fallback where nothing is scroll-driven. */
export function SourcePlate({
  icon,
  name,
  score,
  style,
}: {
  icon: ReactNode;
  name: string;
  score: number;
  style?: CSSProperties;
}) {
  return (
    <div style={{ ...plateShell, ...style }}>
      <div style={{ ...plateSurface, borderColor: BORDER }}>
        <div style={{ ...gutterStyle, background: GUTTER, borderRightColor: BORDER }}>
          <span style={{ color: HINT, display: "inline-flex" }}>{icon}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>{name}</span>
          <div style={{ ...leaderStyle, background: BORDER }} />
          <span style={scoreStyle}>
            <span style={scoreNumStyle}>{score}</span>
            <span style={scoreOutOfStyle}>/100</span>
          </span>
        </div>
      </div>
    </div>
  );
}

type SourceNodeProps = {
  name: string;
  icon: ReactNode;
  score: number;
  /** Score once the contradictions touching this source are fixed. */
  resolved: number;
  point: DiagramPoint;
  progress: MotionValue<number>;
  appear: [number, number];
  /** Window in which this source's score counts up, between phase 1 and 2. */
  scoreIn: [number, number];
  /** Phase-3 window in which the plate clears: green flash, score climbs. */
  clearIn: [number, number];
  /** Flash windows, one per contradiction line touching this node. */
  flashes: Array<[number, number]>;
};

export function SourceNode({ name, icon, score, resolved, point, progress, appear, scoreIn, clearIn, flashes }: SourceNodeProps) {
  /* Plates stay fully opaque once in: translucent, the spokes running
     underneath show through the plate's own text. */
  const opacity = useTransform(progress, appear, [0, 1]);
  const y = useTransform(progress, appear, [16, 0]);

  /* Everything about being accused is transient and returns to rest, so the
     diagram is not 80% red by the time the resolution lands. Exactly one
     property latches: the terminal tick goes red for good, leaving the plate
     with a filed record rather than a standing alarm. */
  const frames = {
    border: { at: [0] as number[], to: [BORDER] as string[] },
    gutterBg: { at: [0] as number[], to: [GUTTER] as string[] },
    gutterRule: { at: [0] as number[], to: [BORDER] as string[] },
    icon: { at: [0] as number[], to: [HINT] as string[] },
    frame: { at: [0] as number[], to: [0] as number[] },
    leader: { at: [0] as number[], to: [BORDER] as string[] },
    shakeAt: [0] as number[],
    shakeTo: [0] as number[],
  };

  for (const [s] of flashes) {
    frames.border.at.push(s, s + 0.004, s + 0.03, s + 0.042);
    frames.border.to.push(BORDER, RED, RED, BORDER);

    frames.gutterBg.at.push(s, s + 0.006, s + 0.03, s + 0.042);
    frames.gutterBg.to.push(GUTTER, RED_WASH, RED_WASH, GUTTER);

    frames.gutterRule.at.push(s, s + 0.006, s + 0.03, s + 0.042);
    frames.gutterRule.to.push(BORDER, RED_RULE, RED_RULE, BORDER);

    frames.icon.at.push(s, s + 0.006, s + 0.03, s + 0.042);
    frames.icon.to.push(HINT, RED, RED, HINT);

    // Registration mark, a print detail rather than a glow.
    frames.frame.at.push(s, s + 0.008, s + 0.03, s + 0.05);
    frames.frame.to.push(0, 1, 1, 0);

    // The one latched property.
    frames.leader.at.push(s, s + 0.008);
    frames.leader.to.push(BORDER, RED);

    frames.shakeAt.push(s, s + 0.007, s + 0.014, s + 0.021, s + 0.028, s + 0.035);
    frames.shakeTo.push(0, -1.5, 1.5, -1, 0.5, 0);
  }

  /* Phase 3: the clearing flash. Same grammar as the accusation flash, in
     green, and this time the leader latches green — the filed record flips
     from "contradiction found" to "contradiction fixed". */
  const c = clearIn[0];
  frames.border.at.push(c, c + 0.006, c + 0.035, c + 0.05);
  frames.border.to.push(BORDER, GREEN, GREEN, BORDER);
  frames.gutterBg.at.push(c, c + 0.006, c + 0.035, c + 0.05);
  frames.gutterBg.to.push(GUTTER, GREEN_WASH, GREEN_WASH, GUTTER);
  frames.gutterRule.at.push(c, c + 0.006, c + 0.035, c + 0.05);
  frames.gutterRule.to.push(BORDER, GREEN_RULE, GREEN_RULE, BORDER);
  frames.icon.at.push(c, c + 0.006, c + 0.035, c + 0.05);
  frames.icon.to.push(HINT, GREEN, GREEN, HINT);
  frames.leader.at.push(c, c + 0.01);
  frames.leader.to.push(flashes.length ? RED : BORDER, GREEN);

  const borderColor = useTransform(progress, frames.border.at, frames.border.to);
  const gutterBg = useTransform(progress, frames.gutterBg.at, frames.gutterBg.to);
  const gutterRule = useTransform(progress, frames.gutterRule.at, frames.gutterRule.to);
  const iconColor = useTransform(progress, frames.icon.at, frames.icon.to);
  const frameOpacity = useTransform(progress, frames.frame.at, frames.frame.to);
  const leaderColor = useTransform(progress, frames.leader.at, frames.leader.to);
  const x = useTransform(progress, frames.shakeAt, frames.shakeTo);

  /* Rendered as a MotionValue child so the count-up writes straight to the
     DOM node instead of re-rendering React on every scroll frame. Counts up
     to the audited score in phase 1, then climbs to the resolved score as
     the plate clears in phase 3, the number turning green as it moves. */
  const counted = useTransform(
    progress,
    [scoreIn[0], scoreIn[1], clearIn[0], clearIn[1]],
    [0, score, score, resolved],
    { clamp: true },
  );
  const scoreText = useTransform(counted, (v) => String(Math.round(v)));
  const scoreOpacity = useTransform(progress, [scoreIn[0], scoreIn[0] + 0.012], [0, 1]);
  const scoreColor = useTransform(progress, [clearIn[0], clearIn[0] + 0.02], [INK, GREEN]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${point.leftPct}%`,
        top: `${point.topPct}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      <motion.div style={{ ...plateShell, opacity, y, x, willChange: "transform, opacity" }}>
        {/* Outside the plate: the surface clips its own overflow. */}
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: -3,
            border: `1px solid ${RED_RULE}`,
            borderRadius: 8,
            opacity: frameOpacity,
            pointerEvents: "none",
          }}
        />
        <motion.div style={{ ...plateSurface, borderColor }}>
          <motion.div style={{ ...gutterStyle, backgroundColor: gutterBg, borderRightColor: gutterRule }}>
            <motion.span style={{ color: iconColor, display: "inline-flex" }}>{icon}</motion.span>
          </motion.div>
          <div style={fieldStyle}>
            <span style={labelStyle}>{name}</span>
            <motion.div style={{ ...leaderStyle, backgroundColor: leaderColor }} />
            <motion.span style={{ ...scoreStyle, opacity: scoreOpacity }}>
              <motion.span style={{ ...scoreNumStyle, color: scoreColor }}>{scoreText}</motion.span>
              <span style={scoreOutOfStyle}>/100</span>
            </motion.span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
