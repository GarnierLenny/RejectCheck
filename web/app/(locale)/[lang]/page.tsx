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
import { useLanguage } from "../../../context/language";
import {
  JsonLd,
  softwareApplicationSchema,
  faqPageSchema,
} from "../../components/JsonLd";

/* ─── Layout constants ───────────────────────────────────────────────── */
const WRAP: React.CSSProperties = { maxWidth: 1240, margin: "0 auto", padding: "0 32px" };
const NUM: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em",
  textTransform: "uppercase", color: "var(--rc-border)",
  borderTop: "1px solid var(--rc-border)", paddingTop: 10,
};
const IT: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, color: "#C0392B",
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

/* ─── DiagCard — hero animated diagnosis card ────────────────────────── */
function scoreColor(n: number): string {
  if (!Number.isFinite(n)) return "rgb(59,130,246)";
  // blue #3b82f6 → green #16a34a → orange #ea580c → red #C0392B
  const stops = [
    [0x3b, 0x82, 0xf6],
    [0x16, 0xa3, 0x4a],
    [0xea, 0x58, 0x0c],
    [0xC0, 0x39, 0x2B],
  ];
  const t = Math.max(0, Math.min(1, n / 100)) * (stops.length - 1);
  const lo = Math.floor(t), hi = Math.min(stops.length - 1, lo + 1);
  const u = t - lo;
  const [r, g, b] = stops[lo].map((c, i) => Math.round(c + (stops[hi][i] - c) * u));
  return `rgb(${r},${g},${b})`;
}

const DIAG_PROFILES = [
  {
    name: "Sarah K.", expYears: 4, targetRole: "Staff Backend Engineer", company: "Stripe",
    score: 74, riskLabel: "High risk · rejection likely",
    findings: [
      { mark: "×", color: "var(--rc-red)", text: <>3 keywords missing: <b>distributed systems</b>, <b>gRPC</b>, <b>observability</b>.</> },
      { mark: "!", color: "#d97706", text: "6-month employment gap not addressed in the timeline." },
      { mark: "✓", color: "var(--rc-green, #16a34a)", text: "TypeScript and React signal is strong - keep this section." },
    ],
  },
  {
    name: "Marcus R.", expYears: 7, targetRole: "Staff Engineer", company: "Vercel",
    score: 28, riskLabel: "Low risk · strong match",
    findings: [
      { mark: "✓", color: "var(--rc-green, #16a34a)", text: <>Next.js, Edge Runtime and monorepo experience directly match the JD.</> },
      { mark: "✓", color: "var(--rc-green, #16a34a)", text: "Seniority level and title align with the posted role." },
      { mark: "!", color: "#d97706", text: "No mention of on-call or incident-response ownership." },
    ],
  },
  {
    name: "Tom H.", expYears: 6, targetRole: "Senior Software Engineer", company: "Notion",
    score: 5, riskLabel: "Excellent match · apply now",
    findings: [
      { mark: "✓", color: "var(--rc-green, #16a34a)", text: <>Experience, stack and seniority are a near-perfect fit for the role.</> },
      { mark: "✓", color: "var(--rc-green, #16a34a)", text: "Leadership and cross-functional work align with Notion's eng culture." },
      { mark: "!", color: "#d97706", text: "Mobile experience absent - minor gap, not a blocker." },
    ],
  },
  {
    name: "Jade T.", expYears: 2, targetRole: "Senior Frontend Engineer", company: "Linear",
    score: 89, riskLabel: "Very high risk · tailor CV",
    findings: [
      { mark: "×", color: "var(--rc-red)", text: <>Role requires <b>5+ years</b> - seniority gap is the primary blocker.</> },
      { mark: "×", color: "var(--rc-red)", text: "No design-system ownership or Figma handoff mentioned." },
      { mark: "!", color: "#d97706", text: "Strong React skills but missing testing (Playwright, Vitest)." },
    ],
  },
  {
    name: "Priya M.", expYears: 5, targetRole: "Senior Data Engineer", company: "Databricks",
    score: 41, riskLabel: "Moderate risk · some gaps",
    findings: [
      { mark: "✓", color: "var(--rc-green, #16a34a)", text: "Spark and Airflow experience aligns well with the stack." },
      { mark: "!", color: "#d97706", text: <>Delta Lake not mentioned - add it, it&apos;s used daily here.</> },
      { mark: "×", color: "var(--rc-red)", text: "No ML pipeline or feature-store exposure listed." },
    ],
  },
];

function DiagCard() {
  const [profileIdx, setProfileIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const [score, setScore] = useState(0);
  const [expCount, setExpCount] = useState(DIAG_PROFILES[0].expYears);
  const [barGo, setBarGo] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [barKey, setBarKey] = useState(0);
  const profileIdxRef = useRef(0);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const profile = DIAG_PROFILES[profileIdx];

  function startInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setBarKey(k => k + 1);
      const next = (profileIdxRef.current + 1) % DIAG_PROFILES.length;
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      setPhase("leaving");
      leaveTimerRef.current = setTimeout(() => {
        profileIdxRef.current = next;
        setProfileIdx(next);
        setAnimKey(k => k + 1);
        setPhase("entering");
        requestAnimationFrame(() => requestAnimationFrame(() => setPhase("idle")));
      }, 420);
    }, 9000);
  }

  function advanceTo(next: number) {
    setBarKey(k => k + 1);
    startInterval();
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setPhase("leaving");
    leaveTimerRef.current = setTimeout(() => {
      profileIdxRef.current = next;
      setProfileIdx(next);
      setAnimKey(k => k + 1);
      setPhase("entering");
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase("idle")));
    }, 420);
  }

  useEffect(() => {
    let fromScore: number = 0, fromExp: number = 0;
    setScore(prev => { fromScore = prev; return prev; });
    setExpCount(prev => { fromExp = prev; return prev; });

    const targetScore = profile.score;
    const targetExp = profile.expYears;
    const dur = 1400;
    let start: number | null = null;
    let raf: number;

    function tick(t: number) {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(fromScore + (targetScore - fromScore) * eased));
      setExpCount(Math.round(fromExp + (targetExp - fromExp) * eased));
      if (p < 1) { raf = requestAnimationFrame(tick); }
    }

    raf = requestAnimationFrame(tick);
    setBarGo(true);

    return () => cancelAnimationFrame(raf);
  }, [profileIdx, profile.score, profile.expYears]);

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  return (
    <div style={{
      background: "var(--rc-surface)",
      border: "1px solid var(--rc-border)",
      borderRadius: 6,
      padding: "24px 26px 26px",
      boxShadow: "0 30px 80px -20px rgba(40,30,30,0.18), 0 1px 0 rgba(255,255,255,0.6) inset",
      position: "relative",
    }}>
      {/* Head */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: 14, marginBottom: 18,
        borderBottom: "1px solid var(--rc-border)",
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700,
      }}>
        <span>Sample diagnosis</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--rc-red)" }}>
          <span style={{
            width: 6, height: 6, borderRadius: 99, background: "var(--rc-red)",
            animation: "rc-blink 1.6s ease-in-out infinite",
          }} />
          Live
        </span>
      </div>

      {/* Candidate */}
      <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em", margin: 0 }}>
        <span style={{
          display: "inline-block",
          opacity: phase === "idle" ? 1 : 0,
          transform: phase === "leaving" ? "translateY(-6px)" : phase === "entering" ? "translateY(6px)" : "translateY(0)",
          transitionProperty: phase !== "entering" ? "opacity, transform" : "none",
          transitionDuration: "0.2s",
          transitionTimingFunction: "ease",
          transitionDelay: phase !== "entering" ? "0ms" : "0ms",
        }}>{profile.name}</span>
        {" · "}
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{expCount}</span>
        {" yrs exp."}
      </p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", margin: "4px 0 22px" }}>
        <span style={{ color: "var(--rc-border)", marginRight: 4 }}>Targeted position ·</span>
        <span style={{
          display: "inline-block",
          opacity: phase === "idle" ? 1 : 0,
          transform: phase === "leaving" ? "translateY(-6px)" : phase === "entering" ? "translateY(6px)" : "translateY(0)",
          transitionProperty: phase !== "entering" ? "opacity, transform" : "none",
          transitionDuration: "0.2s",
          transitionTimingFunction: "ease",
          transitionDelay: phase !== "entering" ? "40ms" : "0ms",
        }}>{profile.targetRole} @ {profile.company}</span>
      </p>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, fontFamily: "var(--font-mono)", fontWeight: 700, color: scoreColor(score), fontVariantNumeric: "tabular-nums" }}>
        <span style={{ fontSize: 96, lineHeight: 0.9, letterSpacing: "-0.055em" }}>{score}</span>
        <span style={{ fontSize: 36, opacity: 0.55, marginLeft: 12 }}>%</span>
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: scoreColor(profile.score), margin: "8px 0 18px", fontWeight: 700,
        opacity: phase === "idle" ? 1 : 0,
        transform: phase === "leaving" ? "translateY(-6px)" : phase === "entering" ? "translateY(6px)" : "translateY(0)",
        transitionProperty: phase !== "entering" ? "opacity, transform" : "none",
        transitionDuration: "0.2s",
        transitionTimingFunction: "ease",
        transitionDelay: phase !== "entering" ? "80ms" : "0ms",
      }}>
        {profile.riskLabel}
      </div>

      {/* Bar */}
      <div style={{ height: 4, background: "var(--rc-bg)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          display: "block", height: "100%",
          background: scoreColor(profile.score),
          borderRadius: 99,
          width: barGo ? `${profile.score}%` : "0%",
          transition: "width 1.4s cubic-bezier(.25,.46,.45,.94)",
        }} />
      </div>

      {/* Findings */}
      <ul style={{
        listStyle: "none", padding: "18px 0 0", margin: "18px 0 0",
        borderTop: "1px solid var(--rc-border)",
        display: "flex", flexDirection: "column", gap: 12,
        minHeight: 138,
      }}>
        {profile.findings.map((f, i) => (
          <li key={i} style={{
            display: "grid", gridTemplateColumns: "18px 1fr",
            gap: 10, fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5,
            color: "var(--rc-muted)",
            opacity: phase === "idle" ? 1 : 0,
            transform: phase === "leaving" ? "translateY(-6px)" : phase === "entering" ? "translateY(6px)" : "translateY(0)",
            transitionProperty: phase !== "entering" ? "opacity, transform" : "none",
            transitionDuration: "0.2s",
            transitionTimingFunction: "ease",
            transitionDelay: phase !== "entering" ? `${120 + i * 40}ms` : "0ms",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, flexShrink: 0, color: f.color }}>{f.mark}</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* Profile dots */}
      <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 18 }}>
        {DIAG_PROFILES.map((_, i) => (
          <button
            key={i}
            onClick={() => advanceTo(i)}
            style={{
              width: i === profileIdx ? 16 : 5, height: 5, borderRadius: 99, border: "none",
              background: i === profileIdx ? "var(--rc-red)" : "var(--rc-border)",
              cursor: "pointer", padding: 0,
              transition: "width 0.3s ease, background 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Timer bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, borderRadius: "0 0 6px 6px", overflow: "hidden", background: "var(--rc-border)" }}>
        <div key={barKey} style={{ height: "100%", background: "var(--rc-red)", animation: "rc-timer 9s linear forwards" }} />
      </div>

      <style>{`
        @keyframes rc-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes rc-rise { to { opacity: 1; transform: translateY(0); } }
        @keyframes rc-rise-text { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rc-timer { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}

/* ─── Landing page ───────────────────────────────────────────────────── */
export default function Home() {
  const { t, locale, localePath } = useLanguage();

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
      rc: { mark: "€7.99/mo", cls: "brand" },
      jobscan: { mark: "$50/mo", cls: "" },
      rw: { mark: "$49/mo", cls: "" },
      rezi: { mark: "$29/mo", cls: "" },
    },
  ];

  const testimonials = [
    { quote: "Best job search tool I've ever used. Went from 0 callbacks to 3 in a week.", name: "Raphael", role: "Fullstack Engineer", img: "/testimonials/raphael.png" },
    { quote: "Actual game changer. 3 interviews in 2 weeks after fixing the gaps it flagged.", name: "Arshiyaa Rai", role: "Co-Founder, RejectCheck", img: "/testimonials/arshiyaa.jpeg" },
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
          <div style={{ display: "grid", gridTemplateColumns: "80px 1.1fr 460px", gap: 32, alignItems: "start" }}>
            {/* Left — margin gutter (kept empty to align with the dropzone row below) */}
            <div aria-hidden />

            {/* Center — headline */}
            <div>
              <h1 style={{
                fontFamily: "var(--font-sans)", fontWeight: 500,
                fontSize: "clamp(48px, 6vw, 88px)", lineHeight: 0.98,
                letterSpacing: "-0.04em", margin: "0 0 32px",
              }}>
                {t.landing.s01.h1Part1} <em style={IT}>{t.landing.s01.h1Italic}</em><br />
                {t.landing.s01.h1Part2} <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, color: "var(--rc-hint)" }}>{t.landing.s01.h1Faded}</span>
              </h1>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.6, color: "var(--rc-muted)", maxWidth: 480, margin: "0 0 36px" }}>
                {t.landing.s01.subtitle}
              </p>
              <div style={{ display: "flex", gap: 24, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--rc-hint)" }}>
                <span><b style={{ color: "var(--rc-text)", fontWeight: 600 }}>{t.landing.s01.stat1Value}</b> {t.landing.s01.stat1Label}</span>
                <span style={{ width: 1, height: 12, background: "var(--rc-border)" }} />
                <span>{t.landing.s01.stat2Value} <b style={{ color: "var(--rc-text)", fontWeight: 600 }}>{t.landing.s01.stat2Label}</b></span>
                <span style={{ width: 1, height: 12, background: "var(--rc-border)" }} />
                <span><b style={{ color: "var(--rc-text)", fontWeight: 600 }}>{t.landing.s01.stat3Value}</b> {t.landing.s01.stat3Label}</span>
              </div>
            </div>

            {/* Right — DiagCard */}
            <DiagCard />
          </div>

          {/* Drop zone row */}
          <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, alignItems: "stretch" }}>
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
                      {t.landing.s01.dropLabel} <em style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, color: "#C0392B" }}>{t.landing.s01.dropItalic}</em>
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
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 56 }}>
            <div style={NUM}>
              § 02<small style={{ display: "block", color: "var(--rc-hint)", fontWeight: 400, marginTop: 4, textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-sans)" }}>{t.landing.s02.smallLabel}</small>
            </div>
            <h2 style={{
              fontFamily: "var(--font-sans)", fontWeight: 500,
              fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05,
              letterSpacing: "-0.025em", margin: 0, maxWidth: 800,
            }}>
              {t.landing.s02.h2Part1} <em style={IT}>{t.landing.s02.h2Italic}</em> {t.landing.s02.h2Part2}
            </h2>
          </div>

          {/* 2-col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 64px" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 32, alignItems: "end", marginBottom: 48 }}>
            <div style={NUM}>
              § 03<small style={{ display: "block", color: "var(--rc-hint)", fontWeight: 400, marginTop: 4, textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-sans)" }}>{t.landing.s03.smallLabel}</small>
            </div>
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
                rejectcheck.io/analyze/9k4f-stripe-backend
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--rc-hint)" }}>{t.landing.s03.browserSaved}</div>
            </div>

            {/* Browser body */}
            <div style={{ padding: "48px 56px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56 }}>
              {/* Left */}
              <div>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", margin: "0 0 12px", fontWeight: 700 }}>Candidate</h3>
                <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 22, letterSpacing: "-0.015em", margin: 0 }}>Sarah K.</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--rc-hint)", marginTop: 4 }}>Senior Backend Engineer · Stripe</p>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 144, lineHeight: 0.85, letterSpacing: "-0.06em", color: "var(--rc-red)", margin: "28px 0 6px", display: "flex", alignItems: "baseline", gap: 2, fontVariantNumeric: "tabular-nums" }}>
                  <span>74</span><span style={{ fontSize: 56, opacity: 0.5, marginLeft: 12 }}>%</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700, marginBottom: 28 }}>High risk · rejection likely</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", background: "rgba(192,57,43,0.06)",
                  border: "1px solid rgba(192,57,43,0.18)", borderRadius: 4, marginBottom: 24,
                }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--rc-red)", margin: 0 }}>{t.landing.s03.topFixTitle}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.45, margin: "4px 0 0" }}>
                      {t.landing.s03.topFixBody}
                    </p>
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
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 48 }}>
            <div style={NUM}>
              § 04<small style={{ display: "block", color: "var(--rc-hint)", fontWeight: 400, marginTop: 4, textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-sans)" }}>{t.landing.s04.smallLabel}</small>
            </div>
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 760 }}>
              {t.landing.s04.h2Part1} <em style={IT}>{t.landing.s04.h2Italic}</em>
            </h2>
          </div>

          {/* Comparison table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
      </section>

      {/* ═══ § 05 WALL OF LOVE ═══════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--rc-border)", padding: "120px 0 96px" }}>
        <div style={WRAP}>
          {/* Section head */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 48 }}>
            <div style={NUM}>
              § 05<small style={{ display: "block", color: "var(--rc-hint)", fontWeight: 400, marginTop: 4, textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-sans)" }}>{t.landing.s05.smallLabel}</small>
            </div>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 56 }}>
            <div style={NUM}>
              § 06<small style={{ display: "block", color: "var(--rc-hint)", fontWeight: 400, marginTop: 4, textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-sans)" }}>{t.landing.s06.smallLabel}</small>
            </div>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid var(--rc-text)" }}>
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
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 48, letterSpacing: "-0.03em", lineHeight: 1 }}>€7.99</span>
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
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 48, letterSpacing: "-0.03em", lineHeight: 1 }}>€11.99</span>
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
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, marginBottom: 48 }}>
            <div style={NUM}>§ 07</div>
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
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32 }}>
            <div style={NUM}>
              § 08<small style={{ display: "block", color: "var(--rc-hint)", fontWeight: 400, marginTop: 4, textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-sans)" }}>{t.landing.s07.smallLabel}</small>
            </div>
            <div>
              <p style={{
                fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400,
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
          <div style={{ display: "grid", gridTemplateColumns: "80px 1.6fr 1fr 1fr 1fr", gap: 32 }}>
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
              {locale === "en" && (
                <>
                  <Link href="/en/cv-review" style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>CV Review</Link>
                  <Link href="/en/ats-checker" style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>ATS Checker</Link>
                  <Link href="/en/resume-checker" style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>Resume Checker</Link>
                  <Link href="/en/software-engineer-cv" style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>Software Engineer CV</Link>
                  <Link href="/en/guides" style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.7)", padding: "4px 0", textDecoration: "none" }}>Guides</Link>
                </>
              )}
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
              <a href="https://github.com/rejectcheck" target="_blank" rel="noopener noreferrer" aria-label="GitHub" style={{ color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center" }}>
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
