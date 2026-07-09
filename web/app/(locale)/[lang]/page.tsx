"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setPendingCv } from "../../../lib/pending-cv";
import { SAMPLE_JDS } from "../../../lib/sample-jds";
import { Navbar } from "../../components/Navbar";
import { FadeInSection } from "../../components/FadeInSection";
import { BlueprintBackdrop } from "../../components/BlueprintBackdrop";
import { GithubIcon, LinkedinIcon } from "../../components/SocialIcons";
import { useLanguage } from "../../../context/language";
import { useFounderAvailability } from "../../../lib/queries";
import {
  JsonLd,
  softwareApplicationSchema,
  faqPageSchema,
} from "../../components/JsonLd";

/* ─── Layout constants ───────────────────────────────────────────────── */
const WRAP: React.CSSProperties = { maxWidth: 1240, margin: "0 auto", padding: "0 32px" };
const IT: React.CSSProperties = {
  fontWeight: 700, color: "#C0392B", fontStyle: "normal",
};
// Subtle emphasis for a phrase inside muted body copy: lifted color + faint brand underline.
const EMPH: React.CSSProperties = {
  color: "var(--rc-text)", fontWeight: 500,
  textDecoration: "underline", textDecorationColor: "var(--rc-red-border)",
  textDecorationThickness: "1.5px", textUnderlineOffset: "3px",
};

/* ─── Inline SVG icons ───────────────────────────────────────────────── */
const IconArrow = ({ size = 12, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M7.5 3l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 12 9 17 20 6" />
  </svg>
);

/* ─── Highlight helper ───────────────────────────────────────────────── */
function hl(text: string) {
  const m = text.match(/^([\s\S]*?)\{hl\}([\s\S]*?)\{\/hl\}([\s\S]*)$/);
  if (!m) return <>{text}</>;
  return <>{m[1]}<span style={{ color: "var(--rc-red)", fontWeight: 700 }}>{m[2]}</span>{m[3]}</>;
}

/* ─── HeroAnalysisScreen — tilted, auto-scrolling full-report mock ─────── */
/* A faithful miniature of a real RejectCheck analysis: score + signal
   breakdown, ATS check, skill radar, GitHub & LinkedIn reports, cross-profile
   timeline of inconsistencies, and the salary negotiation band. The
   illustrative content is intentionally hard-coded — this is a product
   screenshot, not a localized surface. */
function matchColor(pct: number): string {
  return pct >= 70 ? "var(--rc-green)" : pct >= 45 ? "var(--rc-amber)" : "var(--rc-red)";
}

/** Brand colors for each profile source — mirrors SourceTimeline. */
const SRC_COLOR = { cv: "#C0392B", linkedin: "#0077B5", github: "#24292e", portfolio: "#0d9488" } as const;

const HERO_SIGNALS = [
  { label: "Keyword match", pct: 48 },
  { label: "Tech-stack fit", pct: 65 },
  { label: "Experience level", pct: 85 },
  { label: "GitHub signal", pct: 72 },
  { label: "LinkedIn signal", pct: 58 },
];

const HERO_RADAR = [
  { label: "System",      score: 46, expected: 75 },
  { label: "Backend",     score: 82, expected: 70 },
  { label: "Testing",     score: 66, expected: 60 },
  { label: "Distributed", score: 34, expected: 72 },
  { label: "Cloud",       score: 40, expected: 65 },
  { label: "Ownership",   score: 55, expected: 70 },
];

const HERO_GH_LANGS = [
  { name: "TypeScript", pct: 58, color: "#3178c6" },
  { name: "Go",         pct: 24, color: "#00add8" },
  { name: "Python",     pct: 12, color: "#f4c15d" },
  { name: "Other",      pct: 6,  color: "var(--rc-border)" },
];

type Severity = "critical" | "major" | "minor";
const SEV_COLOR: Record<Severity, string> = {
  critical: "var(--rc-red)", major: "var(--rc-amber)", minor: "var(--rc-hint)",
};

/** Cross-profile inconsistencies — sorted critical → major → minor. `at` ties
    each one to its conflict pin on the timeline. */
const HERO_DIVERGENCES: {
  sev: Severity; field: string; sources: [string, string]; date: string; subject: string; perception: string;
}[] = [
  { sev: "critical", field: "seniority", sources: ["CV", "LinkedIn"], date: "Sep 2022", subject: "“Senior” on CV, “Backend Engineer” on LinkedIn (same Acme role)", perception: "Title inflation: I’d verify the real level in a screening call." },
  { sev: "major", field: "ownership", sources: ["CV", "GitHub"], date: "Mar 2023", subject: "“Led the payments rewrite (solo)” vs 14 contributors on the repo", perception: "Overstated ownership; the contribution graph says otherwise." },
  { sev: "minor", field: "dates", sources: ["CV", "LinkedIn"], date: "Feb 2021", subject: "DataCorp dates differ by ~4 months across CV and LinkedIn", perception: "Small mismatch. Tidy it up so nothing reads as sloppy." },
];

const HERO_ATS_MISSING = [
  { kw: "Kubernetes", freq: 4, required: true,  impact: 12 },
  { kw: "CI/CD",      freq: 3, required: true,  impact: 8 },
  { kw: "Terraform",  freq: 2, required: false, impact: 4 },
];

const HERO_PROJECT = {
  level: "Intermediate",
  time: "~2 weekends",
  name: "Rate-limited Payments API",
  pitch: "A production-grade payments gateway with idempotency keys, distributed rate limiting and full observability: the exact distributed-systems signal your target roles keep asking for.",
  tech: ["Go", "Redis", "gRPC", "Kubernetes"],
  proves: ["Distributed systems", "Service ownership"],
  bullet: "Built a rate-limited payments API handling 40k req/s at 99.9% uptime, with idempotent retries and Prometheus SLOs.",
};

const HERO_FINDINGS: { sev: string; color: string; text: React.ReactNode }[] = [
  { sev: "Critical", color: "var(--rc-red)",   text: <>No <b>distributed-systems ownership</b>. Required in 4 of 5 similar postings.</> },
  { sev: "Major",    color: "var(--rc-amber)", text: "8-month gap (2021–22) isn’t addressed anywhere on the CV." },
  { sev: "Good",     color: "var(--rc-green)", text: "Strong open-source track record: 12 repos, 400+ stars. Keep it featured." },
];

/* — Section heading — */
function HeroHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ margin: "26px 0 12px", paddingTop: 18, borderTop: "1px solid var(--rc-border)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>{children}</div>
      {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--rc-hint)", marginTop: 5, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

/* — Skill radar (current vs role-expected), geometry mirrors RadarChart — */
const RCX = 150, RCY = 104, RR = 74;
function rPolar(i: number, n: number, r: number): [number, number] {
  const a = (2 * Math.PI * i) / n - Math.PI / 2;
  return [RCX + r * Math.cos(a), RCY + r * Math.sin(a)];
}
function rPoly(n: number, r: number): string {
  return Array.from({ length: n }, (_, i) => rPolar(i, n, r).join(",")).join(" ");
}
function rScore(key: "score" | "expected"): string {
  return HERO_RADAR.map((ax, i) => rPolar(i, HERO_RADAR.length, (ax[key] / 100) * RR).join(",")).join(" ");
}
function HeroRadar() {
  const n = HERO_RADAR.length;
  const [hi, setHi] = useState<number | null>(null);
  return (
    <svg viewBox="0 0 300 214" width="100%" role="img" aria-label="Skill radar: your experience vs target role">
      {[33, 66, 100].map((p) => (
        <polygon key={p} points={rPoly(n, (p / 100) * RR)} fill="none" stroke="var(--rc-border)" strokeOpacity="0.6" strokeWidth="1" />
      ))}
      {HERO_RADAR.map((_, i) => {
        const [x, y] = rPolar(i, n, RR);
        return <line key={i} x1={RCX} y1={RCY} x2={x} y2={y} stroke="var(--rc-border)" strokeOpacity="0.4" strokeWidth="1" />;
      })}
      <polygon points={rScore("expected")} fill="var(--rc-amber)" fillOpacity="0.05" stroke="var(--rc-amber)" strokeOpacity="0.75" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" />
      <polygon points={rScore("score")} fill="var(--rc-red)" fillOpacity="0.13" stroke="var(--rc-red)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinejoin="round" />
      {HERO_RADAR.map((ax, i) => {
        const [ex, ey] = rPolar(i, n, (ax.expected / 100) * RR);
        return <circle key={`e${i}`} cx={ex} cy={ey} r={2.5} fill="var(--rc-amber)" opacity={hi === i ? 1 : 0.55} />;
      })}
      {HERO_RADAR.map((ax, i) => {
        const [x, y] = rPolar(i, n, (ax.score / 100) * RR);
        return <circle key={i} cx={x} cy={y} r={hi === i ? 4.5 : 3} fill="var(--rc-red)" />;
      })}
      {HERO_RADAR.map((ax, i) => {
        const [lx, ly] = rPolar(i, n, RR + 18);
        const cos = Math.cos((2 * Math.PI * i) / n - Math.PI / 2);
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="central" fontSize="9.5" fontFamily="var(--font-mono)" fontWeight={hi === i ? 700 : 600} fill={hi === i ? "var(--rc-text)" : "var(--rc-muted)"}>
            {ax.label}
          </text>
        );
      })}
      {/* Hover hit-areas (one per vertex) */}
      {HERO_RADAR.map((ax, i) => {
        const [vx, vy] = rPolar(i, n, (ax.score / 100) * RR);
        return (
          <circle key={`h${i}`} cx={vx} cy={vy} r={17} fill="transparent" style={{ cursor: "pointer" }}
            onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} />
        );
      })}
      {/* Tooltip */}
      {hi !== null && (() => {
        const ax = HERO_RADAR[hi];
        const [vx, vy] = rPolar(hi, n, (ax.score / 100) * RR);
        const boxW = 128, boxH = 48;
        let bx = vx + 12; if (bx + boxW > 300) bx = vx - 12 - boxW; if (bx < 2) bx = 2;
        let by = vy - boxH - 6; if (by < 2) by = vy + 10; if (by + boxH > 214) by = 214 - boxH;
        return (
          <g pointerEvents="none">
            <rect x={bx} y={by} width={boxW} height={boxH} rx={5} fill="var(--rc-text)" />
            <text x={bx + 10} y={by + 14} fontSize="9" fontFamily="var(--font-mono)" fontWeight="700" fill="var(--rc-bg)" letterSpacing="0.5">{ax.label.toUpperCase()}</text>
            <circle cx={bx + 12} cy={by + 26} r="3" fill="var(--rc-red)" />
            <text x={bx + 20} y={by + 29} fontSize="8.5" fontFamily="var(--font-sans)" fill="var(--rc-bg)">Your experience · {ax.score}</text>
            <circle cx={bx + 12} cy={by + 38} r="3" fill="var(--rc-amber)" />
            <text x={bx + 20} y={by + 41} fontSize="8.5" fontFamily="var(--font-sans)" fill="var(--rc-bg)">Target role · {ax.expected}</text>
          </g>
        );
      })()}
    </svg>
  );
}

/* — Portfolio globe glyph (matches the Globe icon used in ConsistencyTab) — */
function GlobeGlyph({ size = 15, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
    </svg>
  );
}

/* — GitHub / LinkedIn / Portfolio source report card — */
const SOURCE_NAME: Record<"github" | "linkedin" | "portfolio", string> = {
  github: "GitHub", linkedin: "LinkedIn", portfolio: "Portfolio",
};
function HeroSourceCard({
  kind, score, strengths, issue, langs,
}: {
  kind: "github" | "linkedin" | "portfolio";
  score: number;
  strengths: string[];
  issue: { sev: "critical" | "major" | "minor"; text: string };
  langs?: { name: string; pct: number; color: string }[];
}) {
  const Icon = kind === "github" ? GithubIcon : kind === "linkedin" ? LinkedinIcon : GlobeGlyph;
  const brand = SRC_COLOR[kind];
  const sc = matchColor(score);
  const sevColor = issue.sev === "critical" ? "var(--rc-red)" : issue.sev === "major" ? "var(--rc-amber)" : "var(--rc-hint)";
  return (
    <div style={{ border: "1px solid var(--rc-border)", borderRadius: 8, padding: "13px 14px", background: "var(--rc-surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={15} style={{ color: brand, flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--rc-text)" }}>
          {SOURCE_NAME[kind]}
        </span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: sc }}>
          {score}<span style={{ color: "var(--rc-hint)", fontWeight: 400 }}> / 100</span>
        </span>
      </div>

      {langs && (
        <>
          <div style={{ display: "flex", height: 5, borderRadius: 99, overflow: "hidden", marginTop: 11 }}>
            {langs.map((l) => <span key={l.name} style={{ width: `${l.pct}%`, background: l.color }} />)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", marginTop: 7 }}>
            {langs.map((l) => (
              <span key={l.name} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--rc-hint)" }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: l.color }} />{l.name} {l.pct}%
              </span>
            ))}
          </div>
        </>
      )}

      <ul style={{ listStyle: "none", margin: "11px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        {strengths.map((s) => (
          <li key={s} style={{ display: "flex", gap: 7, alignItems: "start", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.4 }}>
            <span style={{ color: "var(--rc-green)", flexShrink: 0, fontWeight: 700 }}>✓</span>{s}
          </li>
        ))}
        <li style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 7, alignItems: "start", marginTop: 2 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 5px", borderRadius: 3, color: sevColor, background: `color-mix(in srgb, ${sevColor} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${sevColor} 30%, transparent)`, height: "fit-content" }}>
            {issue.sev}
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.4 }}>{issue.text}</span>
        </li>
      </ul>
    </div>
  );
}

/* — Cross-profile chronology (parallel lanes + conflict pins) — */
const TL = {
  start: 2019, end: 2027, today: 2026.5,
  ticks: [2020, 2022, 2024, 2026],
  lanes: [
    { src: "cv" as const, label: "CV", bars: [
      { title: "Backend · DataCorp", s: 2020.0, e: 2021.67 },
      { title: "Senior Backend · Acme", s: 2022.25, e: 2026.5 },
    ]},
    { src: "linkedin" as const, label: "LinkedIn", bars: [
      { title: "Backend · DataCorp", s: 2020.5, e: 2021.95 },
      { title: "Backend Eng · Acme", s: 2022.0, e: 2026.5 },
    ]},
    { src: "portfolio" as const, label: "Portfolio", bars: [
      { title: "Payments API · case study", s: 2022.9, e: 2023.6 },
    ]},
  ],
  markers: [
    { at: 2021.08, sev: "minor" as const },
    { at: 2022.67, sev: "critical" as const },
    { at: 2023.17, sev: "major" as const },
  ],
};
const CONFLICT_H = 18, LANE_H = 26, BAR_H = 18, TICK_H = 16;
function tlx(y: number): number {
  return Math.max(0, Math.min(100, ((y - TL.start) / (TL.end - TL.start)) * 100));
}
function HeroTimeline() {
  const chartH = CONFLICT_H + TL.lanes.length * LANE_H + TICK_H;
  return (
    <div style={{ border: "1px solid var(--rc-border)", borderRadius: 8, overflow: "hidden", background: "var(--rc-surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderBottom: "1px solid var(--rc-border)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)" }}>Career chronology</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
          {TL.lanes.map((l) => (
            <span key={l.src} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--rc-muted)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: SRC_COLOR[l.src] }} />{l.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ width: 72, flexShrink: 0, paddingTop: CONFLICT_H }}>
          {TL.lanes.map((l) => (
            <div key={l.src} style={{ height: LANE_H, display: "flex", alignItems: "center", paddingLeft: 10, fontFamily: "var(--font-mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.1em", color: SRC_COLOR[l.src], fontWeight: 700 }}>
              {l.label}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, position: "relative", height: chartH, borderLeft: "1px solid var(--rc-border)" }}>
          {TL.ticks.map((y) => (
            <div key={y}>
              <div style={{ position: "absolute", top: 0, bottom: TICK_H, left: `${tlx(y)}%`, width: 1, background: "var(--rc-border)", opacity: 0.5 }} />
              <div style={{ position: "absolute", bottom: 1, left: `${tlx(y)}%`, transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: 8.5, color: "var(--rc-hint)" }}>{y}</div>
            </div>
          ))}
          <div style={{ position: "absolute", top: 0, bottom: TICK_H, left: `${tlx(TL.today)}%`, width: 0, borderLeft: "1px dashed var(--rc-red)", opacity: 0.55 }} />
          {TL.markers.map((m, i) => (
            <div key={i} style={{ position: "absolute", top: 5, left: `${tlx(m.at)}%`, width: 9, height: 9, transform: "translateX(-50%) rotate(-45deg)", borderRadius: "50% 50% 50% 0", background: m.sev === "minor" ? "var(--rc-amber)" : "var(--rc-red)", boxShadow: "0 0 0 2px var(--rc-surface)" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: CONFLICT_H, borderTop: "1px solid var(--rc-border)", opacity: 0.6 }} />
          {TL.lanes.map((l, li) =>
            l.bars.map((b, bi) => {
              const left = tlx(b.s), width = tlx(b.e) - tlx(b.s);
              return (
                <div key={`${li}-${bi}`} style={{
                  position: "absolute", top: CONFLICT_H + li * LANE_H + (LANE_H - BAR_H) / 2, height: BAR_H,
                  left: `${left}%`, width: `${width}%`,
                  background: SRC_COLOR[l.src], color: "#fff", borderRadius: 3,
                  padding: "0 6px", display: "flex", alignItems: "center", overflow: "hidden",
                }}>
                  <span style={{ fontSize: 9, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* — Salary negotiation band (candidate vs market vs offer) — */
function Marker({ left, color, glyph }: { left: number; color: string; glyph: string }) {
  return (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: `${left}%`, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
      <span style={{ fontSize: 9, lineHeight: 1, color, marginTop: 2 }}>{glyph}</span>
      <div style={{ flex: 1, width: 2, background: color }} />
    </div>
  );
}
function HeroNegotiation() {
  const dMin = 58000, dMax = 96000;
  const pct = (v: number) => ((v - dMin) / (dMax - dMin)) * 100;
  const market = { min: 62000, max: 82000 };
  const cand = { min: 74000, max: 92000, mid: 83000 };
  const offer = { min: 68000, max: 76000, mid: 72000 };
  const candColor = cand.mid > market.max ? "var(--rc-green)" : cand.mid < market.min ? "var(--rc-red)" : "var(--rc-amber)";
  const fmtK = (n: number) => `€${Math.round(n / 1000)}k`;
  const ticks = [60000, 70000, 80000, 90000];
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginBottom: 9 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}><b style={{ color: candColor }}>You</b> <span style={{ color: candColor }}>{fmtK(cand.min)}–{fmtK(cand.max)}</span></span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}><b style={{ color: "var(--rc-amber)" }}>Market</b> <span style={{ color: "var(--rc-amber)" }}>{fmtK(market.min)}–{fmtK(market.max)}</span></span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}><b style={{ color: "var(--rc-text)" }}>Offer</b> <span style={{ color: "var(--rc-muted)" }}>{fmtK(offer.min)}–{fmtK(offer.max)}</span></span>
      </div>
      <div style={{ position: "relative", height: 44, borderRadius: 5, overflow: "hidden", border: "1px solid var(--rc-border)" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <span style={{ width: `${pct(market.min)}%`, background: "var(--rc-red)", opacity: 0.12 }} />
          <span style={{ width: `${pct(market.max) - pct(market.min)}%`, background: "var(--rc-amber)", opacity: 0.2 }} />
          <span style={{ flex: 1, background: "var(--rc-green)", opacity: 0.12 }} />
        </div>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pct(market.min)}%`, borderLeft: "1px dashed var(--rc-amber)" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pct(market.max)}%`, borderLeft: "1px dashed var(--rc-amber)" }} />
        <div style={{ position: "absolute", top: 27, height: 5, left: `${pct(cand.min)}%`, width: `${pct(cand.max) - pct(cand.min)}%`, background: candColor, opacity: 0.35, borderRadius: 99 }} />
        <Marker left={pct(cand.mid)} color={candColor} glyph="▼" />
        <Marker left={pct(offer.mid)} color="var(--rc-text)" glyph="◆" />
      </div>
      <div style={{ position: "relative", height: 13, marginTop: 3 }}>
        {ticks.map((t) => (
          <span key={t} style={{ position: "absolute", left: `${pct(t)}%`, transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: 8.5, color: "var(--rc-hint)" }}>{fmtK(t)}</span>
        ))}
      </div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.45, margin: "10px 0 0" }}>
        <b style={{ color: "var(--rc-green)" }}>↑ €11k above market.</b> Their offer tops out at €76k. <b style={{ color: "var(--rc-text)" }}>Anchor at €92k</b>.
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "start", marginTop: 10, padding: "9px 11px", border: "1px solid var(--rc-border)", borderRadius: 6, background: "var(--rc-surface)" }}>
        <span style={{ marginTop: 4, width: 6, height: 6, borderRadius: 99, background: "var(--rc-green)", flexShrink: 0 }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rc-green)" }}>High leverage</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "1px 6px", borderRadius: 99, color: "var(--rc-green)", background: "var(--rc-green-bg)" }}>+€8k</span>
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-text)", margin: "3px 0 0", lineHeight: 1.4 }}>7 yrs distributed systems vs 5 required: “led monolith → 12 microservices at 40k req/s”.</p>
        </div>
      </div>
    </div>
  );
}

function HeroAnalysisScreen() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  /* Cursor parallax — the card leans a few degrees toward the pointer. */
  useEffect(() => {
    const stage = stageRef.current;
    const tilt = tiltRef.current;
    if (!stage || !tilt) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const BASE_RX = 4, BASE_RY = -9, RANGE_X = 3, RANGE_Y = 4.5;
    // Cache the stage centre so mousemove never triggers layout reads.
    let cx = 0, cy = 0;
    const measure = () => {
      const r = stage.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    };
    measure();
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onMove = (e: MouseEvent) => {
      const nx = clamp((e.clientX - cx) / (window.innerWidth / 2));
      const ny = clamp((e.clientY - cy) / (window.innerHeight / 2));
      tilt.style.transform = `rotateX(${(BASE_RX - ny * RANGE_X).toFixed(2)}deg) rotateY(${(BASE_RY + nx * RANGE_Y).toFixed(2)}deg)`;
    };
    const reset = () => { tilt.style.transform = `rotateX(${BASE_RX}deg) rotateY(${BASE_RY}deg)`; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    document.addEventListener("mouseleave", reset);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      document.removeEventListener("mouseleave", reset);
    };
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const SPEED = 52;          // px/s — calm, continuous drift
    const EDGE_PAUSE = 1600;   // ms hold at each end before reversing
    const START_DELAY = 2000;  // ms of stillness when the page first loads

    let dir: 1 | -1 = 1;
    let paused = false;
    let raf = 0;
    let prev = 0;
    let holdUntil = (typeof performance !== "undefined" ? performance.now() : 0) + START_DELAY;

    // rAF + delta-time gives frame-synced, sub-pixel scrolling (no stepping).
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = prev ? now - prev : 0;
      prev = now;
      if (paused || now < holdUntil) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      el.scrollTop += dir * SPEED * (dt / 1000);
      if (dir === 1 && el.scrollTop >= max - 0.5) {
        el.scrollTop = max; dir = -1; holdUntil = now + EDGE_PAUSE;
      } else if (dir === -1 && el.scrollTop <= 0.5) {
        el.scrollTop = 0; dir = 1; holdUntil = now + EDGE_PAUSE;
      }
    };
    raf = requestAnimationFrame(tick);

    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; prev = 0; };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={stageRef} style={{ padding: "16px 6px 34px", minWidth: 0, perspective: 1200, position: "relative" }}>
      {/* Soft red gradient glow bleeding out from behind the report card */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: "-16% -16% -18% -14%", zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(54% 48% at 52% 46%, rgba(201,58,57,0.60), rgba(201,58,57,0.28) 50%, transparent 76%)",
        filter: "blur(44px)",
      }} />
      <div ref={tiltRef} className="rc-hero-tilt" style={{ minWidth: 0, position: "relative", zIndex: 1 }}>
      <div className="rc-hero-float" style={{ position: "relative", minWidth: 0 }}>
        <div className="rc-hero-card" style={{
          background: "var(--rc-surface)",
          border: "1px solid var(--rc-border)",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 60px 120px -30px rgba(40,30,30,0.22), 0 1px 0 rgba(255,255,255,0.7) inset",
          minWidth: 0,
        }}>
        {/* Chrome bar */}
        <div style={{ background: "var(--rc-bg)", borderBottom: "1px solid var(--rc-border)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {[0, 1, 2].map((i) => <i key={i} style={{ width: 7, height: 7, borderRadius: 99, background: "var(--rc-border)", display: "block" }} />)}
          </div>
          <div style={{
            flex: 1, minWidth: 0,
            background: "var(--rc-surface)", border: "1px solid var(--rc-border)",
            borderRadius: 4, padding: "4px 10px",
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--rc-hint)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            rejectcheck.com/analyze/7g2k-owen-marsh
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700, flexShrink: 0 }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: "var(--rc-red)", animation: "rc-blink 1.6s ease-in-out infinite" }} />
            Live
          </span>
        </div>

        {/* Scrollable content viewport */}
        <div style={{ position: "relative" }}>
          <div ref={viewportRef} className="rc-hero-scroll" style={{ height: 520, overflowY: "auto", padding: "22px 24px 26px" }}>
            {/* Candidate header */}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 8 }}>
              Candidate
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em", margin: 0 }}>Owen Marsh</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", margin: "4px 0 0" }}>
              Target · Senior Backend Engineer @ Airbnb
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
              padding: "3px 8px", borderRadius: 4,
              background: "var(--rc-green-bg)",
              border: "1px solid var(--rc-green-border)",
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--rc-green)", fontWeight: 700,
            }}>
              ✓ CV · LinkedIn · GitHub cross-referenced
            </div>

            {/* Score */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--rc-amber)", fontVariantNumeric: "tabular-nums", marginTop: 22 }}>
              <span style={{ fontSize: 56, lineHeight: 0.9, letterSpacing: "-0.04em" }}>62</span>
              <span style={{ fontSize: 22, opacity: 0.55, marginLeft: 8 }}>%</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-amber)", margin: "6px 0 14px", fontWeight: 700 }}>
              Moderate risk · 3 blockers · 3 profile conflicts
            </div>
            <div style={{ height: 4, background: "var(--rc-bg)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "62%", background: "var(--rc-amber)", borderRadius: 99 }} />
            </div>

            {/* Signal breakdown */}
            <HeroHeading>Signal breakdown</HeroHeading>
            {HERO_SIGNALS.map((s) => (
              <div key={s.label} style={{ display: "grid", gridTemplateColumns: "1fr 90px 28px", gap: 10, alignItems: "center", padding: "7px 0" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--rc-muted)" }}>{s.label}</span>
                <div style={{ height: 4, background: "var(--rc-bg)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: matchColor(s.pct), borderRadius: 99 }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right", color: matchColor(s.pct), fontVariantNumeric: "tabular-nums" }}>{s.pct}</span>
              </div>
            ))}

            {/* ATS simulation */}
            <HeroHeading sub="How an applicant-tracking filter would score this résumé">ATS simulation</HeroHeading>
            <div style={{ borderRadius: 8, background: "var(--rc-red-bg)", border: "1px solid var(--rc-red-border)", padding: "12px 13px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", background: "var(--rc-red)", padding: "2px 6px", borderRadius: 3 }}>Would not pass</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--rc-red)" }}>58<span style={{ color: "var(--rc-hint)", fontWeight: 400 }}> / 70 to pass</span></span>
              </div>
              {/* score vs threshold bar */}
              <div style={{ position: "relative", height: 5, borderRadius: 99, background: "var(--rc-surface)", marginTop: 10 }}>
                <div style={{ position: "absolute", inset: 0, width: "58%", background: "var(--rc-red)", borderRadius: 99 }} />
                <div style={{ position: "absolute", top: -3, bottom: -3, left: "70%", borderLeft: "1px dashed var(--rc-text)" }} />
                <span style={{ position: "absolute", left: "70%", top: -14, transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--rc-hint)" }}>pass 70</span>
              </div>
              {/* critical missing keywords */}
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", margin: "16px 0 7px" }}>
                Critical missing keywords
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {HERO_ATS_MISSING.map((k) => (
                  <div key={k.kw} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", minWidth: 0 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--rc-text)" }}>{k.kw}</span>
                      {k.required && <span style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rc-red)", border: "1px solid var(--rc-red-border)", borderRadius: 3, padding: "1px 4px" }}>required</span>}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--rc-hint)" }}>×{k.freq} in JD</span>
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--rc-red)", whiteSpace: "nowrap" }}>−{k.impact} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill radar */}
            <HeroHeading sub="Your level vs what the role expects">Skill radar</HeroHeading>
            <div style={{ display: "flex", gap: 14, marginBottom: 4 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--rc-muted)" }}>
                <span style={{ width: 12, borderTop: "1.5px dashed var(--rc-amber)" }} /> Role expects
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--rc-muted)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--rc-red)" }} /> You
              </span>
            </div>
            <HeroRadar />

            {/* GitHub report */}
            <HeroHeading>GitHub report</HeroHeading>
            <HeroSourceCard
              kind="github"
              score={72}
              langs={HERO_GH_LANGS}
              strengths={["12 public repos · 400+ combined stars", "3-year commit streak, no gaps"]}
              issue={{ sev: "major", text: "Top repos ship no README. Recruiters can’t gauge impact." }}
            />

            {/* LinkedIn report */}
            <HeroHeading>LinkedIn report</HeroHeading>
            <HeroSourceCard
              kind="linkedin"
              score={58}
              strengths={[
                "Headline matches the target role",
                "Recommendations from 2 senior engineers",
                "Skills section endorsed 40+ times",
              ]}
              issue={{ sev: "major", text: "Title reads “Backend Engineer” (one band below the CV)." }}
            />

            {/* Portfolio report */}
            <HeroHeading>Portfolio report</HeroHeading>
            <HeroSourceCard
              kind="portfolio"
              score={64}
              strengths={[
                "Live demo + write-up for 2 flagship projects",
                "Fast, clean, mobile-friendly build",
              ]}
              issue={{ sev: "minor", text: "Case studies quote no metrics. Impact is hard to gauge." }}
            />

            {/* Cross-profile consistency */}
            <HeroHeading sub="What a senior recruiter spots in 30 seconds">Cross-profile consistency</HeroHeading>
            <HeroTimeline />

            {/* Inconsistencies — one per conflict pin above, grouped by severity */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "13px 0 9px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)" }}>3 inconsistencies</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                {([["critical", 1], ["major", 1], ["minor", 1]] as const).map(([s, cnt]) => (
                  <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", color: SEV_COLOR[s], fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: SEV_COLOR[s] }} />{cnt} {s}
                  </span>
                ))}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {HERO_DIVERGENCES.map((d, i) => {
                const c = SEV_COLOR[d.sev];
                return (
                  <div key={i} style={{ border: "1px solid var(--rc-border)", borderLeft: `3px solid ${c}`, borderRadius: 6, padding: "9px 11px", background: "var(--rc-surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: d.sev === "minor" ? "var(--rc-muted)" : "#fff", background: d.sev === "minor" ? "var(--rc-border)" : c, padding: "2px 5px", borderRadius: 3 }}>{d.sev}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--rc-text)" }}>Inconsistency · {d.field}</span>
                      <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--rc-muted)" }}>{d.sources[0]} ↔ {d.sources[1]}</span>
                    </div>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--rc-text)", fontWeight: 500, margin: "6px 0 4px", lineHeight: 1.4 }}>{d.subject}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, color: "var(--rc-hint)", whiteSpace: "nowrap" }}>{d.date}</span>
                      <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 12, color: "var(--rc-muted)", margin: 0, lineHeight: 1.45 }}>« {d.perception} »</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Salary & negotiation */}
            <HeroHeading sub="Where you sit vs the market, and vs their offer">Salary &amp; negotiation</HeroHeading>
            <HeroNegotiation />

            {/* Bridge the gap — recommended portfolio project */}
            <HeroHeading sub="A project that closes your biggest gap: distributed systems">Bridge the gap</HeroHeading>
            <div style={{ border: "1px solid var(--rc-border)", borderRadius: 8, overflow: "hidden", background: "var(--rc-surface)" }}>
              <div style={{ padding: "11px 14px", background: "var(--rc-red-bg)", borderBottom: "1px solid var(--rc-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", background: "var(--rc-red)", padding: "2px 6px", borderRadius: 3 }}>Recommended project</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--rc-hint)" }}>{HERO_PROJECT.level} · {HERO_PROJECT.time}</span>
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", margin: "8px 0 0" }}>{HERO_PROJECT.name}</p>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--rc-muted)", lineHeight: 1.5, margin: 0 }}>{HERO_PROJECT.pitch}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 11 }}>
                  {HERO_PROJECT.tech.map((tch) => (
                    <span key={tch} style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, padding: "3px 8px", borderRadius: 99, border: "1px solid var(--rc-border)", color: "var(--rc-muted)" }}>{tch}</span>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--rc-hint)" }}>Proves</span>
                  {HERO_PROJECT.proves.map((p) => (
                    <span key={p} style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, padding: "3px 8px", borderRadius: 99, color: "var(--rc-green)", background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)" }}>{p}</span>
                  ))}
                </div>
                <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--rc-border)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--rc-hint)", marginBottom: 5 }}>New CV bullet</div>
                  <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 12.5, color: "var(--rc-text)", lineHeight: 1.5, margin: 0 }}>“{HERO_PROJECT.bullet}”</p>
                </div>
              </div>
            </div>

            {/* Key findings */}
            <HeroHeading>Key findings</HeroHeading>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {HERO_FINDINGS.map((f, i) => (
                <li key={i} style={{ display: "grid", gridTemplateColumns: "62px 1fr", gap: 10, alignItems: "start" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                    padding: "2px 6px", borderRadius: 4, textAlign: "center", height: "fit-content",
                    color: f.color,
                    background: `color-mix(in srgb, ${f.color} 8%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${f.color} 30%, transparent)`,
                  }}>{f.sev}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--rc-muted)" }}>{f.text}</span>
                </li>
              ))}
            </ul>

            {/* Recruiter read */}
            <HeroHeading>Recruiter read</HeroHeading>
            <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 13.5, lineHeight: 1.55, color: "var(--rc-text)", margin: 0 }}>
              &ldquo;Solid engineer, but the CV, LinkedIn and GitHub don&apos;t tell the same story yet. I&apos;d clear up the title and the gap before I champion this one.&rdquo;
            </p>

            {/* Footer */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--rc-border)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--rc-hint)" }}>
              Full report · 42 checks · 6 sources cross-referenced
            </div>
          </div>

          {/* Fade masks — sell the scrollable depth */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 22, background: "linear-gradient(var(--rc-surface), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 34, background: "linear-gradient(transparent, var(--rc-surface))", pointerEvents: "none" }} />
        </div>
        </div>
      </div>
      </div>

      <style>{`
        @keyframes rc-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes rc-hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        /* Rotation layer — resting tilt; JS eases it toward the cursor. */
        .rc-hero-tilt {
          transform: rotateX(4deg) rotateY(-9deg);
          transition: transform 220ms ease-out;
          will-change: transform;
        }
        /* Float layer — gentle idle bob, independent of the cursor tilt. */
        .rc-hero-float { animation: rc-hero-float 7s ease-in-out infinite; }
        .rc-hero-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .rc-hero-scroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .rc-hero-float { animation: none; }
          .rc-hero-tilt { transition: none; transform: rotateX(4deg) rotateY(-9deg); }
        }
      `}</style>
    </div>
  );
}

/* ─── Landing page ───────────────────────────────────────────────────── */
export default function Home() {
  const { t, locale, localePath } = useLanguage();
  const { data: founder } = useFounderAvailability();

  /* hero upload widget */
  const router = useRouter();
  const [heroStep, setHeroStep] = useState<1 | 2>(1);
  const [heroCvFile, setHeroCvFile] = useState<File | null>(null);
  const [heroJd, setHeroJd] = useState("");
  const [heroDragging, setHeroDragging] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const [dropHover, setDropHover] = useState(false);

  function handleHeroDrop(e: React.DragEvent) {
    e.preventDefault();
    setHeroDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setHeroCvFile(file); setHeroStep(2); }
  }
  function handleHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setHeroCvFile(file); setHeroStep(2); }
  }
  function handleHeroSubmit() {
    if (!heroCvFile) return;
    setPendingCv(heroCvFile, heroJd);
    router.push(localePath("/analyze"));
  }

  /* Skill color helpers */
  const skillColor = (pct: number) => pct >= 70 ? "var(--rc-green, #16a34a)" : pct >= 45 ? "#d97706" : "var(--rc-red)";

  const skills = [
    { name: "TypeScript",      pct: 88 },
    { name: "React",           pct: 74 },
    { name: "PostgreSQL",      pct: 52 },
    { name: "Distributed sys.", pct: 30 },
    { name: "Kubernetes",      pct: 24 },
    { name: "Terraform",       pct: 12 },
  ];

  const compRows = [
    {
      feat: t.landing.s04.compRows[0].feat,
      sub: t.landing.s04.compRows[0].sub,
      rc: { mark: "✓", cls: "y" },
      jobscan: { mark: "×", cls: "n" },
      rw: { mark: "×", cls: "n" },
      rezi: { mark: "partial", cls: "m" },
    },
    {
      feat: t.landing.s04.compRows[1].feat,
      sub: t.landing.s04.compRows[1].sub,
      rc: { mark: "✓", cls: "y" },
      jobscan: { mark: "×", cls: "n" },
      rw: { mark: "×", cls: "n" },
      rezi: { mark: "×", cls: "n" },
    },
    {
      feat: t.landing.s04.compRows[2].feat,
      sub: t.landing.s04.compRows[2].sub,
      rc: { mark: "✓", cls: "y" },
      jobscan: { mark: "×", cls: "n" },
      rw: { mark: "×", cls: "n" },
      rezi: { mark: "×", cls: "n" },
    },
    {
      feat: t.landing.s04.compRows[3].feat,
      sub: t.landing.s04.compRows[3].sub,
      rc: { mark: "✓", cls: "y" },
      jobscan: { mark: "generic", cls: "m" },
      rw: { mark: "generic", cls: "m" },
      rezi: { mark: "✓", cls: "y" },
    },
    {
      feat: t.landing.s04.compRows[4].feat,
      sub: t.landing.s04.compRows[4].sub,
      rc: { mark: "✓", cls: "y" },
      jobscan: { mark: "paywall", cls: "n" },
      rw: { mark: "paywall", cls: "n" },
      rezi: { mark: "paywall", cls: "n" },
    },
    {
      feat: t.landing.s04.compRows[5].feat,
      sub: t.landing.s04.compRows[5].sub,
      rc: { mark: "€19.99/mo", cls: "brand" },
      jobscan: { mark: "$50/mo", cls: "" },
      rw: { mark: "$49/mo", cls: "" },
      rezi: { mark: "$29/mo", cls: "" },
    },
  ];

  const testimonials = [
    { quote: "Best job search tool I've ever used. Went from 0 callbacks to 3 in a week.", name: "Raphael", role: "Fullstack Engineer", img: "/testimonials/raphael.png" },
    { quote: "The advice is really good.", name: "Sheryll", role: "Software Eng. Student", initials: "S" },
    { quote: "This is a really great tool!", name: "Yasbira", role: "ISE Student", initials: "Y" },
  ] as const;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--rc-bg)", color: "var(--rc-text)" }}>
      <JsonLd id="ld-software-app" data={softwareApplicationSchema(locale)} />
      <JsonLd id="ld-faq" data={faqPageSchema(t.faq.items)} />
      <Navbar />

      {/* ═══ § 01 HERO ═══════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 0 72px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <BlueprintBackdrop variant="light" />
        <div style={{ ...WRAP, maxWidth: 1440, padding: "0 48px", position: "relative", zIndex: 1 }}>
          {/* 3-col top */}
          <div className="rc-mstack-lg" style={{ display: "grid", gridTemplateColumns: "80px 1fr 560px", gap: 32, alignItems: "start" }}>
            {/* Left — margin gutter (kept empty to align with the dropzone row below) */}
            <div aria-hidden />

            {/* Center — headline */}
            <div>
              <h1 style={{
                fontFamily: "var(--font-sans)", fontWeight: 500,
                fontSize: "clamp(42px, 5vw, 66px)", lineHeight: 1.0,
                letterSpacing: "-0.04em", margin: "0 0 30px",
              }}>
                {t.landing.s01.h1Part1} <em style={IT}>{t.landing.s01.h1Italic}</em><br />
                {t.landing.s01.h1Part2} <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, color: "var(--rc-hint)" }}>{t.landing.s01.h1Faded}</span>
              </h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.5, color: "var(--rc-muted)", maxWidth: 480, margin: "0 0 26px", display: "flex", flexDirection: "column", gap: "0.5em" }}>
                <span>{t.landing.s01.subtitleLine1}</span>
                <span>{t.landing.s01.subtitleLine2}</span>
                <span>{t.landing.s01.subtitleLine3}</span>
                <span>{t.landing.s01.subtitleLine4}<span style={EMPH}>{t.landing.s01.subtitleEmphasis}</span>.</span>
              </p>
              <Link
                href={localePath("/analyze")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 15,
                  padding: "13px 26px", borderRadius: 6,
                  background: "linear-gradient(180deg, #C0392B, #A93226)",
                  color: "#fff", textDecoration: "none",
                  boxShadow: "0 10px 28px rgba(192,57,43,0.28)",
                  marginBottom: 34,
                }}
              >
                {t.landing.s01.dropCta}
              </Link>
              {/* Founder scarcity encart — shown only while the deal is live and
                  has seats left; links to the pricing page for the full offer.
                  Wrapped in a block so it drops below the inline-flex CTA. */}
              {founder?.enabled && !founder.soldOut && (
                <div style={{ marginTop: -16, marginBottom: 30 }}>
                  <Link
                    href={localePath("/pricing")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.04em",
                      color: "#A93226", textDecoration: "none",
                      padding: "7px 13px", borderRadius: 999,
                      border: "1px solid var(--rc-red-border)", background: "#fbf1f0",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--rc-red)", flexShrink: 0, boxShadow: "0 0 0 3px rgba(192,57,43,0.15)" }} />
                    <span><b style={{ fontWeight: 700 }}>{founder.remaining}/{founder.cap}</b> {t.landing.s01.founderSeatsLabel} · Hired 19.99€</span>
                  </Link>
                </div>
              )}
              <div style={{ display: "flex", gap: 24, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--rc-hint)" }}>
                <span><b style={{ color: "var(--rc-text)", fontWeight: 600 }}>{t.landing.s01.stat1Value}</b> {t.landing.s01.stat1Label}</span>
                <span style={{ width: 1, height: 12, background: "var(--rc-border)" }} />
                <span>{t.landing.s01.stat2Value} <b style={{ color: "var(--rc-text)", fontWeight: 600 }}>{t.landing.s01.stat2Label}</b></span>
                <span style={{ width: 1, height: 12, background: "var(--rc-border)" }} />
                <span><b style={{ color: "var(--rc-text)", fontWeight: 600 }}>{t.landing.s01.stat3Value}</b> {t.landing.s01.stat3Label}</span>
              </div>
            </div>

            {/* Right — tilted, scrollable analysis mockup */}
            <HeroAnalysisScreen />
          </div>

          {/* Drop zone row */}
          <div className="rc-mstack" style={{ marginTop: 80, display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, alignItems: "stretch" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", paddingTop: 4 }}>
              → TRY YOURS
            </div>

            {/* Dropzone wrapper */}
            <div
              style={{
                border: `1.5px dashed ${dropHover ? "var(--rc-red)" : "var(--rc-border)"}`,
                borderRadius: 6,
                padding: "28px 32px",
                background: dropHover ? "#fbf1f0" : "var(--rc-surface)",
                transition: "all 200ms ease",
              }}
              onMouseEnter={() => setDropHover(true)}
              onMouseLeave={() => setDropHover(false)}
            >
              {heroStep === 1 && (
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, cursor: "pointer" }}
                  onDragOver={(e) => { e.preventDefault(); setHeroDragging(true); }}
                  onDragLeave={() => setHeroDragging(false)}
                  onDrop={handleHeroDrop}
                  onClick={() => heroFileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && heroFileRef.current?.click()}
                >
                  <input
                    ref={heroFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: "none" }}
                    onChange={handleHeroFile}
                  />
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 500, color: "var(--rc-text)" }}>
                      {t.landing.s01.dropLabel} <em style={{ fontWeight: 700, color: "#C0392B", fontStyle: "normal" }}>{t.landing.s01.dropItalic}</em>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rc-hint)", letterSpacing: "0.04em", marginTop: 4 }}>
                      {t.landing.s01.dropHint}
                    </div>
                  </div>
                  <button
                    style={{
                      fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 14,
                      padding: "11px 22px", borderRadius: 6,
                      background: "linear-gradient(180deg, #C0392B, #A93226)",
                      color: "#fff", border: "none", flexShrink: 0,
                      boxShadow: "0 8px 24px rgba(192,57,43,0.26)",
                      transition: "transform 150ms ease",
                      whiteSpace: "nowrap", cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    {t.landing.s01.dropCta}
                  </button>
                </div>
              )}

              {heroStep === 2 && (
                <>
                  <div className="hero-widget__file-ok" style={{ marginBottom: 12 }}>
                    <IconCheck size={12} />
                    <span>{heroCvFile?.name}</span>
                    <button onClick={() => { setHeroStep(1); setHeroCvFile(null); }}>{t.landing.hero.changeFile}</button>
                  </div>
                  <div className="hero-step2">
                    <div className="hero-step2__paste">
                      <div className="hero-step2__lab">{t.landing.hero.pasteLabel}</div>
                      <textarea
                        className="hero-jd"
                        placeholder={t.landing.hero.pastePlaceholder}
                        value={heroJd}
                        onChange={(e) => setHeroJd(e.target.value)}
                        rows={5}
                        autoFocus
                      />
                    </div>
                    <div className="hero-step2__or">{t.landing.hero.orDivider}</div>
                    <div className="hero-step2__samples">
                      <div className="hero-step2__lab">{t.landing.hero.sampleLabel}</div>
                      <div className="hero-step2__list">
                        {SAMPLE_JDS.map((cat) => (
                          <div key={cat.category}>
                            <div className="hero-step2__cat">{cat.category}</div>
                            {cat.roles.map((role) => (
                              <button
                                key={role.title}
                                className={"hero-step2__role" + (heroJd === role.jd ? " active" : "")}
                                onClick={() => setHeroJd(role.jd)}
                              >
                                {role.title}
                                {heroJd === role.jd && <IconCheck size={10} />}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
                    onClick={handleHeroSubmit}
                  >
                    {t.landing.hero.submitCta}
                    <IconArrow size={12} color="#fff" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ § 02 SIX DIMENSIONS ═════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--rc-border)", padding: "120px 0 96px" }}>
        <div style={WRAP}>
          {/* Section head */}
          <div className="rc-mstack" style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 56 }}>
            <div aria-hidden />
            <h2 style={{
              fontFamily: "var(--font-sans)", fontWeight: 500,
              fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05,
              letterSpacing: "-0.025em", margin: 0, maxWidth: 800,
            }}>
              {t.landing.s02.h2Part1} <em style={IT}>{t.landing.s02.h2Italic}</em> {t.landing.s02.h2Part2}
            </h2>
          </div>

          {/* 2-col grid */}
          <div className="rc-mstack" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 64px" }}>
            {t.landing.s02.items.map((item) => (
              <div key={item.n} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 24, padding: "28px 0", borderTop: "1px solid var(--rc-border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", color: "var(--rc-hint)", paddingTop: 4 }}>{item.n}</span>
                <div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 20, letterSpacing: "-0.015em", color: "var(--rc-text)", margin: "0 0 6px" }}>
                    {item.title} <em style={IT}>{item.it}</em>
                  </h3>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--rc-muted)", margin: 0, maxWidth: 380 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ § 03 THE REPORT ═════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--rc-border)", padding: "120px 0 96px", background: "var(--rc-surface)", position: "relative", overflow: "hidden" }}>
        {/* Grain accent */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5, backgroundImage: "radial-gradient(circle at 80% 20%, rgba(192,57,43,0.06), transparent 50%)" }} />
        <div style={{ ...WRAP, position: "relative" }}>
          {/* Section head — 3 cols */}
          <div className="rc-mstack-lg" style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 32, alignItems: "end", marginBottom: 48 }}>
            <div aria-hidden />
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>
              {t.landing.s03.h2Part1} <em style={IT}>{t.landing.s03.h2Italic}</em>
            </h2>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.55, color: "var(--rc-muted)", margin: 0, alignSelf: "end", maxWidth: 400 }}>
              {t.landing.s03.subtitle}
            </p>
          </div>

          {/* Mock browser */}
          <div style={{
            background: "var(--rc-bg)",
            border: "1px solid var(--rc-border)",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 60px 120px -30px rgba(40,30,30,0.18), 0 1px 0 rgba(255,255,255,0.7) inset",
          }}>
            {/* Browser bar */}
            <div style={{ background: "var(--rc-bg)", borderBottom: "1px solid var(--rc-border)", padding: "12px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((i) => <i key={i} style={{ width: 9, height: 9, borderRadius: 99, background: "var(--rc-border)", display: "block" }} />)}
              </div>
              <div style={{
                flex: 1, maxWidth: 360,
                background: "var(--rc-surface)", border: "1px solid var(--rc-border)",
                borderRadius: 4, padding: "5px 12px",
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rc-hint)",
              }}>
                rejectcheck.com/analyze/9k4f-stripe-backend
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--rc-hint)" }}>{t.landing.s03.browserSaved}</div>
            </div>

            {/* Browser body */}
            <div className="rc-mstack-lg" style={{ padding: "48px 56px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56 }}>
              {/* Left — the briefing itself. The score is demoted to a small
                  verdict chip so the actionable document leads, not the number. */}
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 30 }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", margin: "0 0 12px", fontWeight: 700 }}>{t.landing.s03.preparedFor}</h3>
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 20, letterSpacing: "-0.015em", margin: 0 }}>Sarah K.</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", color: "var(--rc-hint)", marginTop: 4 }}>Senior Backend Engineer · Stripe</p>
                  </div>
                  {/* Verdict chip — honest number, demoted */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 13px", border: "1px solid rgba(192,57,43,0.22)", background: "rgba(192,57,43,0.06)", borderRadius: 999, flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--rc-red)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>74%</span>
                    <span style={{ width: 1, height: 11, background: "rgba(192,57,43,0.3)" }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700 }}>{t.landing.s03.verdict}</span>
                  </div>
                </div>

                {/* Priority fix — the centerpiece */}
                <div style={{ borderLeft: "2px solid var(--rc-red)", paddingLeft: 18, marginBottom: 28 }}>
                  <h4 style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-red)", margin: "0 0 9px", fontWeight: 700 }}>{t.landing.s03.priorityFixLabel}</h4>
                  <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em", color: "var(--rc-text)", margin: "0 0 7px", lineHeight: 1.3 }}>{t.landing.s03.topFixTitle}</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-muted)", lineHeight: 1.55, margin: 0 }}>{t.landing.s03.topFixBody}</p>
                </div>

                {/* Briefing contents — signals a multi-section document */}
                <div>
                  <h4 style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", margin: "0 0 13px", fontWeight: 700 }}>{t.landing.s03.contentsLabel}</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {t.landing.s03.contents.map((c) => (
                      <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-muted)", padding: "5px 11px", border: "1px solid var(--rc-border)", borderRadius: 999, background: "var(--rc-surface)" }}>
                        <IconCheck size={11} />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div>
                <h4 style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", margin: "0 0 18px", fontWeight: 700 }}>{t.landing.s03.skillMapLabel}</h4>
                <div>
                  {skills.map((s) => (
                    <div key={s.name} style={{ padding: "12px 0", borderBottom: "1px solid var(--rc-border)", display: "grid", gridTemplateColumns: "140px 1fr 50px", gap: 14, alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                      <div style={{ height: 4, background: "var(--rc-bg)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ display: "block", height: "100%", borderRadius: 99, width: `${s.pct}%`, background: skillColor(s.pct) }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right", fontVariantNumeric: "tabular-nums", color: skillColor(s.pct) }}>{s.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ § 04 COMPARISON ═════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--rc-border)", padding: "120px 0 96px" }}>
        <div style={WRAP}>
          {/* Section head */}
          <div className="rc-mstack" style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 48 }}>
            <div aria-hidden />
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 760 }}>
              {t.landing.s04.h2Part1} <em style={IT}>{t.landing.s04.h2Italic}</em>
            </h2>
          </div>

          {/* Comparison table — scrolls horizontally on narrow screens */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "18px 16px", textAlign: "left", verticalAlign: "top", borderBottom: "1px solid var(--rc-text)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}></th>
                <th style={{ padding: "18px 16px", textAlign: "left", verticalAlign: "top", borderBottom: "1px solid var(--rc-text)", background: "var(--rc-surface)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700 }}>RejectCheck</th>
                <th style={{ padding: "18px 16px", textAlign: "left", verticalAlign: "top", borderBottom: "1px solid var(--rc-text)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>Jobscan</th>
                <th style={{ padding: "18px 16px", textAlign: "left", verticalAlign: "top", borderBottom: "1px solid var(--rc-text)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>ResumeWorded</th>
                <th style={{ padding: "18px 16px", textAlign: "left", verticalAlign: "top", borderBottom: "1px solid var(--rc-text)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>Rezi</th>
              </tr>
            </thead>
            <tbody>
              {compRows.map((row) => (
                <tr key={row.feat}>
                  <td style={{ padding: "18px 16px", borderTop: "1px solid var(--rc-border)" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--rc-text)", display: "block" }}>{row.feat}</span>
                    <small style={{ display: "block", color: "var(--rc-hint)", fontWeight: 400, marginTop: 3, fontSize: 12 }}>{row.sub}</small>
                  </td>
                  <td style={{ padding: "18px 16px", borderTop: "1px solid var(--rc-border)", background: "var(--rc-surface)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: row.rc.cls === "y" ? "var(--rc-green, #16a34a)" : row.rc.cls === "brand" ? "var(--rc-red)" : "var(--rc-red)" }}>{row.rc.mark}</span>
                  </td>
                  <td style={{ padding: "18px 16px", borderTop: "1px solid var(--rc-border)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: row.jobscan.cls === "y" ? "var(--rc-green, #16a34a)" : row.jobscan.cls === "n" ? "var(--rc-red)" : row.jobscan.cls === "m" ? "#d97706" : "var(--rc-text)" }}>{row.jobscan.mark}</span>
                  </td>
                  <td style={{ padding: "18px 16px", borderTop: "1px solid var(--rc-border)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: row.rw.cls === "y" ? "var(--rc-green, #16a34a)" : row.rw.cls === "n" ? "var(--rc-red)" : row.rw.cls === "m" ? "#d97706" : "var(--rc-text)" }}>{row.rw.mark}</span>
                  </td>
                  <td style={{ padding: "18px 16px", borderTop: "1px solid var(--rc-border)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: row.rezi.cls === "y" ? "var(--rc-green, #16a34a)" : row.rezi.cls === "n" ? "var(--rc-red)" : row.rezi.cls === "m" ? "#d97706" : "var(--rc-text)" }}>{row.rezi.mark}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {/* ═══ § 05 WALL OF LOVE ═══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--rc-border)", padding: "120px 0 96px" }}>
        <div style={WRAP}>
          {/* Section head */}
          <div className="rc-mstack" style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 48 }}>
            <div aria-hidden />
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>
              {t.landing.s05.h2Part1} <em style={IT}>{t.landing.s05.h2Italic}</em>
            </h2>
          </div>

          {/* Founder card */}
          <div style={{ border: "1px solid var(--rc-border)", padding: "28px 32px", display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
            <Image
              src="/testimonials/lenny.jpeg"
              alt="Lenny Garnier"
              width={52}
              height={52}
              style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--rc-border)" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--rc-red)" }}>{t.landing.sections.founderLabel}</div>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, lineHeight: 1.45, color: "var(--rc-text)", margin: 0 }}>
                &ldquo;{t.landing.s05.founderQuote}&rdquo;
              </p>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--rc-hint)", letterSpacing: "0.04em" }}>
                <span style={{ color: "var(--rc-muted)", fontWeight: 600 }}>Lenny Garnier</span> · Fullstack Engineer @ Witik
              </div>
            </div>
          </div>

          {/* 4-col testimonials */}
          <div className="rc-mstack-lg" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {testimonials.map((item, i) => (
              <div
                key={item.name}
                style={{
                  padding: "24px 28px",
                  borderTop: "1px solid var(--rc-text)",
                  borderRight: i < testimonials.length - 1 ? "1px solid var(--rc-border)" : "none",
                  display: "flex", flexDirection: "column", gap: 12,
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1, color: "var(--rc-red)", opacity: 0.6, fontFamily: "Georgia, serif" }}>&ldquo;</span>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--rc-text)", flex: 1, margin: 0 }}>{item.quote}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  {"img" in item ? (
                    <Image
                      src={item.img}
                      alt={item.name}
                      width={36}
                      height={36}
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--rc-border)" }}
                    />
                  ) : (
                    <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", background: "var(--rc-bg)", border: "1px solid var(--rc-border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--rc-muted)" }}>
                      {item.initials}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--rc-text)", letterSpacing: "0.04em" }}>{item.name}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--rc-hint)", letterSpacing: "0.04em" }}>{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ § 06 PRICING ════════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--rc-border)", padding: "120px 0 96px", background: "var(--rc-surface)" }}>
        <div style={WRAP}>
          {/* Section head */}
          <div className="rc-mstack" style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 56 }}>
            <div aria-hidden />
            <div>
              <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 700 }}>
                {t.pricing.title} <em style={IT}>{t.pricing.titleHighlight}</em>
              </h2>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--rc-muted)", margin: "16px 0 0", maxWidth: 540, lineHeight: 1.55 }}>
                {t.pricing.subtitle} {t.pricing.subtitleLine2}
              </p>
            </div>
          </div>

          {/* Pricing grid */}
          <div className="rc-mstack-lg" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid var(--rc-text)" }}>
            {/* Free */}
            <div style={{ padding: "36px 28px 32px", borderRight: "1px solid var(--rc-border)", display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 14 }}>{t.pricing.plans.free.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 48, letterSpacing: "-0.03em", lineHeight: 1 }}>€0</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rc-hint)" }}>{t.pricing.plans.free.period}</span>
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.5, marginBottom: 28 }}>{t.pricing.plans.free.description}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {t.pricing.plans.free.features.slice(0, 5).map((f) => (
                  <li key={f} style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--rc-text)", display: "flex", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--rc-text)", flexShrink: 0 }}>+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={localePath("/analyze")}
                style={{
                  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 14,
                  padding: "11px 18px", borderRadius: 6,
                  border: "1px solid var(--rc-text)", background: "transparent", color: "var(--rc-text)",
                  textAlign: "center", whiteSpace: "nowrap", display: "block",
                  textDecoration: "none",
                }}
              >
                {t.pricing.plans.free.cta}
              </Link>
            </div>

            {/* Shortlisted (Pro) */}
            <div style={{ padding: "36px 28px 32px", borderRight: "1px solid var(--rc-border)", display: "flex", flexDirection: "column", background: "rgba(192,57,43,0.04)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700, marginBottom: 14 }}>{t.pricing.plans.shortlisted.name} {t.landing.s06.recommendedSuffix}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 48, letterSpacing: "-0.03em", lineHeight: 1 }}>€19.99</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rc-hint)" }}>{t.pricing.plans.shortlisted.period}</span>
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.5, marginBottom: 28 }}>{t.pricing.plans.shortlisted.description}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {t.pricing.plans.shortlisted.features.slice(0, 6).map((f) => (
                  <li key={f} style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--rc-text)", display: "flex", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--rc-text)", flexShrink: 0 }}>+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={localePath("/pricing")}
                style={{
                  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 14,
                  padding: "11px 18px", borderRadius: 6,
                  background: "linear-gradient(180deg, #C0392B, #A93226)",
                  border: "1px solid var(--rc-red)", color: "#fff",
                  boxShadow: "0 8px 24px rgba(192,57,43,0.26)",
                  textAlign: "center", whiteSpace: "nowrap", display: "block",
                  textDecoration: "none",
                }}
              >
                {t.pricing.plans.shortlisted.cta}
              </Link>
            </div>

            {/* Hired */}
            <div style={{ padding: "36px 28px 32px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 14 }}>{t.pricing.plans.hired.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 48, letterSpacing: "-0.03em", lineHeight: 1 }}>€39.99</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rc-hint)" }}>{t.landing.s06.hiredPeriod}</span>
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.5, marginBottom: 28 }}>{t.pricing.plans.hired.description}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {t.pricing.plans.hired.features.slice(0, 5).map((f) => (
                  <li key={f} style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--rc-text)", display: "flex", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--rc-text)", flexShrink: 0 }}>+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={localePath("/pricing")}
                style={{
                  fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 14,
                  padding: "11px 18px", borderRadius: 6,
                  border: "1px solid var(--rc-text)", background: "transparent", color: "var(--rc-text)",
                  textAlign: "center", whiteSpace: "nowrap", display: "block",
                  textDecoration: "none",
                }}
              >
                {t.pricing.plans.hired.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ § 07 FAQ ════════════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--rc-border)", padding: "120px 0 96px", background: "var(--rc-surface)" }}>
        <div style={WRAP}>
          {/* Section head */}
          <div className="rc-mstack" style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 48 }}>
            <div aria-hidden />
            <div>
              <h2 style={{
                fontFamily: "var(--font-sans)", fontWeight: 500,
                fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05,
                letterSpacing: "-0.025em", margin: 0, maxWidth: 800,
              }}>
                {t.faq.title}
              </h2>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.6, color: "var(--rc-muted)", margin: "14px 0 0", maxWidth: 560 }}>
                {t.faq.subtitle}
              </p>
            </div>
          </div>

          {/* Accordion — native <details> keeps every answer in the DOM */}
          <div style={{ maxWidth: 920, margin: "0 auto" }}>
            {t.faq.items.map((item, i) => (
              <details key={i} className="rc-faq__item">
                <summary className="rc-faq__q">
                  <span>{item.question}</span>
                  <span className="rc-faq__icon" aria-hidden="true" />
                </summary>
                <p className="rc-faq__a">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ § 08 CLOSING MANIFESTO ══════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--rc-border)", padding: "140px 0 120px" }}>
        <div style={{ ...WRAP, maxWidth: 1440, padding: "0 48px" }}>
          <div className="rc-mstack" style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32 }}>
            <div aria-hidden />
            <div>
              <p style={{
                fontWeight: 700,
                fontSize: "clamp(40px, 5vw, 72px)", lineHeight: 1.1,
                letterSpacing: "-0.025em", color: "var(--rc-text)", margin: "0 0 32px",
                maxWidth: 880,
              }}>
                {t.landing.s07.quotePart1}<br />
                <span style={{ color: "var(--rc-red)" }}>{t.landing.s07.quoteRed}</span>
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", marginTop: 48 }}>
                {t.landing.s07.attribution}{" "}
                <a href="https://www.linkedin.com/in/lenny-garnier-2ab689199/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--rc-text)", fontWeight: 600, textDecoration: "none" }}>Lenny Garnier</a>
                {" "}&amp;{" "}
                <a href="https://www.linkedin.com/in/arshiyaa-rai-56aa342b5/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--rc-text)", fontWeight: 600, textDecoration: "none" }}>Arshiyaa Rai</a>
                {" "}· {t.landing.s07.coFounders}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DARK FOOTER ══════════════════════════════════════════════════ */}
      <footer style={{ background: "var(--rc-text)", color: "#f4f1ec", padding: "56px 0 32px", position: "relative", overflow: "hidden", isolation: "isolate" }}>
        <BlueprintBackdrop variant="dark" bloom={false} />
        <div style={{ ...WRAP, position: "relative", zIndex: 1 }}>
          <div className="rc-mstack-lg" style={{ display: "grid", gridTemplateColumns: "80px 1.6fr 1fr 1fr 1fr", gap: 32 }}>
            {/* END label */}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.5)", paddingTop: 10 }}>END</span>

            {/* Brand */}
            <div>
              <Image
                src="/RejectCheck_500_bg_less.png"
                alt="RejectCheck"
                width={28}
                height={28}
                style={{ width: 28, height: 28, marginBottom: 12 }}
              />
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.55)", maxWidth: 260, margin: 0 }}>
                {t.landing.footerBrand.tagline}
              </p>
            </div>

            {/* Product */}
            <div>
              <h6 style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 14px", fontWeight: 700 }}>Product</h6>
              <Link href={localePath("/analyze")} style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>
                {t.landing.hero.cta}
              </Link>
              <Link href={localePath("/pricing")} style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>
                {t.navbar.pricing}
              </Link>
              <Link href={localePath("/for-teams")} style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>
                {t.landing.footer.forTeams}
              </Link>
            </div>

            {/* Resources */}
            <div>
              <h6 style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 14px", fontWeight: 700 }}>Resources</h6>
              <Link href={localePath("/alternatives")} style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>
                {t.landing.footer.alternatives}
              </Link>
              {(locale === "fr"
                ? [
                    { href: "/cv-review", label: "Revue de CV" },
                    { href: "/ats-checker", label: "Checker ATS" },
                    { href: "/resume-checker", label: "Checker de CV" },
                    { href: "/software-engineer-cv", label: "CV ingénieur logiciel" },
                    { href: "/guides", label: "Guides" },
                  ]
                : [
                    { href: "/cv-review", label: "CV Review" },
                    { href: "/ats-checker", label: "ATS Checker" },
                    { href: "/resume-checker", label: "Resume Checker" },
                    { href: "/software-engineer-cv", label: "Software Engineer CV" },
                    { href: "/guides", label: "Guides" },
                  ]
              ).map((l) => (
                <Link key={l.href} href={localePath(l.href)} style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>{l.label}</Link>
              ))}
            </div>

            {/* Company */}
            <div>
              <h6 style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 14px", fontWeight: 700 }}>Company</h6>
              <Link href={localePath("/privacy")} style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>
                {t.landing.footer.privacy}
              </Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ marginTop: 56, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>
              {t.landing.footer.copyright}
            </span>
            <div style={{ display: "flex", gap: 14 }}>
              <a href="https://github.com/GarnierLenny/RejectCheck" target="_blank" rel="noopener noreferrer" aria-label="GitHub" style={{ color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center" }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a href="https://linkedin.com/company/rejectcheck" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center" }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
