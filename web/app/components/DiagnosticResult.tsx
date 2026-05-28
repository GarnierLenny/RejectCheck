"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AnalysisResult } from "./types";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../context/language";
import { SourceTimeline } from "./timeline/SourceTimeline";
import { GitBranch, PenLine, Mail, Mic, TrendingUp } from "lucide-react";
import { ImproveTab } from "./tabs/ImproveTab";
import { CoverLetterTab } from "./tabs/CoverLetterTab";
import { InterviewTab } from "./tabs/InterviewTab";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Main rejection-risk score: low = good (green/blue), high = bad (red)
function scoreColor(n: number): string {
  if (n >= 70) return "var(--rc-red)";
  if (n >= 40) return "var(--rc-amber)";
  return "var(--rc-green)";
}

// Skill score /10: high = good (blue), low = bad (red) — same gradient as landing page
function skillColor(n: number): string {
  // blue #3b82f6 → green #16a34a → orange #ea580c → red #C0392B
  const stops = [
    [0x3b, 0x82, 0xf6],
    [0x16, 0xa3, 0x4a],
    [0xea, 0x58, 0x0c],
    [0xC0, 0x39, 0x2B],
  ];
  // Invert: score 10 → t=0 (blue), score 0 → t=1 (red)
  const t = (1 - Math.max(0, Math.min(1, n / 10))) * (stops.length - 1);
  const lo = Math.floor(t), hi = Math.min(stops.length - 1, lo + 1);
  const u = t - lo;
  const [r, g, b] = stops[lo].map((c, i) => Math.round(c + (stops[hi][i] - c) * u));
  return `rgb(${r},${g},${b})`;
}

function verdictLabel(score: number): string {
  if (score >= 70) return "Critical · rejection likely";
  if (score >= 50) return "High risk · rejection likely";
  if (score >= 35) return "Moderate risk · some gaps";
  if (score >= 15) return "Low risk · strong match";
  return "Excellent match · apply now";
}

function sevClass(sev: string) {
  if (sev === "critical") return { color: "var(--rc-red)", bg: "var(--rc-red-bg)", border: "var(--rc-red-border)" };
  if (sev === "major")    return { color: "var(--rc-amber)", bg: "var(--rc-amber-bg)", border: "var(--rc-amber-border)" };
  return { color: "var(--rc-hint)", bg: "var(--rc-bg)", border: "var(--rc-border)" };
}

// ── Shared style constants ────────────────────────────────────────────────────

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
};

const SANS: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
};

const DISPLAY_ITALIC: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  fontWeight: 400,
  color: "var(--rc-red)",
};

const EYEBROW: React.CSSProperties = {
  ...MONO,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "var(--rc-hint)",
  fontWeight: 700,
};

const SEC_NUM: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  ...MONO,
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "var(--rc-hint)",
  marginBottom: 14,
};

function SecNumLine() {
  return <span style={{ width: 28, height: 1, background: "var(--rc-text)", display: "inline-block", flexShrink: 0 }} />;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  result: AnalysisResult;
  analysisId: number | null;
  cvBlobUrl: string | null;
  deepStatus: "pending" | "failed" | "ready";
  isPremium: boolean;
  userPlan?: "free" | "shortlisted" | "hired";
  onReset: () => void;
  onExportMd: () => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
  onShare?: () => void;
  isSharing: boolean;
  reconstructedCv?: string | null;
  isRewriting?: boolean;
  onRewrite?: () => void;
  email?: string | null;
  accessToken?: string | null;
};

// ── Main component ────────────────────────────────────────────────────────────

export function DiagnosticResult({
  result,
  analysisId,
  cvBlobUrl,
  deepStatus,
  isPremium,
  userPlan = "free",
  onReset,
  onExportMd,
  onExportPdf,
  isExportingPdf,
  onShare,
  isSharing,
  reconstructedCv = null,
  isRewriting = false,
  onRewrite,
  email = null,
  accessToken = null,
}: Props) {
  const { localePath } = useLanguage();

  const [cvOpen, setCvOpen] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [barGo, setBarGo] = useState(false);
  const [activeSection, setActiveSection] = useState("s1");
  const [skillsGo, setSkillsGo] = useState(false);
  const [proTier, setProTier] = useState<"shortlisted" | "hired">("shortlisted");
  const mainRef = useRef<HTMLElement>(null);

  // Score count-up
  useEffect(() => {
    const target = result.score;
    const dur = 1400;
    let start: number | null = null;
    let raf: number;
    function tick(t: number) {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setScoreDisplay(Math.round(target * e));
      if (p < 1) { raf = requestAnimationFrame(tick); }
    }
    raf = requestAnimationFrame(tick);
    const barTimer = setTimeout(() => setBarGo(true), 200);
    return () => { cancelAnimationFrame(raf); clearTimeout(barTimer); };
  }, [result.score]);

  // TOC active section on scroll — root is the main scroll container, not the window
  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;
    const sections = container.querySelectorAll<HTMLElement>("section[data-dr-sec]");
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.getAttribute("data-dr-sec") ?? "s1");
        });
      },
      { root: container, rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Skill bars animate on scroll
  const skillsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = skillsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSkillsGo(true); },
      { threshold: 0.2, root: mainRef.current },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const color = scoreColor(result.score);
  const sentence = result.confidence?.reason ?? verdictLabel(result.score);
  const role = result.job_details?.title ?? "Senior Role";
  const company = result.job_details?.company ?? "";

  // §01 — The one move
  const criticalIssue = result.audit.cv.issues.find((i) => i.severity === "critical") ?? result.audit.cv.issues[0];
  const noAts = result.ats_simulation && !result.ats_simulation.would_pass;
  const oneMoveTitle = noAts
    ? "Fix your ATS keyword coverage first"
    : (criticalIssue?.fix?.summary ?? criticalIssue?.what ?? "Address top CV issue");
  const oneMoveBody = noAts
    ? `Your CV would not pass the ATS filter (${result.ats_simulation?.score ?? 0}% vs ~${result.ats_simulation?.threshold ?? 70}% threshold). Add the missing keywords to your bullets before anything else.`
    : (criticalIssue?.why ?? "This is the highest-priority fix to improve your match.");
  const oneMoveImpact = noAts
    ? `+${Math.max(0, (result.ats_simulation?.threshold ?? 70) - (result.ats_simulation?.score ?? 0))} pts`
    : (criticalIssue?.severity === "critical" ? "−12 pts if ignored" : "−6 pts if ignored");

  // §02 — Skills
  const skills = result.technical_analysis?.skills ?? [];
  const gapCount = skills.filter((s) => s.current < s.expected * 0.85 && s.expected > 0).length;

  // §03 — ATS
  const foundSkills = result.audit.jd_match?.required_skills.filter((s) => s.found) ?? [];
  const missingSkills = result.audit.jd_match?.required_skills.filter((s) => !s.found) ?? [];
  const critMissing = result.ats_simulation?.critical_missing_keywords ?? [];

  // §06 — Roadmap (top actions)
  type RoadItem = { id: string; title: string; detail?: string; time: string; pts: string; now: boolean };
  const roadmap: RoadItem[] = [];
  result.audit.cv.issues.slice(0, 3).forEach((issue, i) => {
    roadmap.push({
      id: `cv${i}`,
      title: issue.fix?.summary ?? issue.what,
      detail: issue.fix?.steps?.[0],
      time: issue.fix?.time_required ?? (issue.severity === "critical" ? "45m" : "30m"),
      pts: issue.severity === "critical" ? "+12 pts" : issue.severity === "major" ? "+6 pts" : "+3 pts",
      now: i === 0,
    });
  });
  result.hidden_red_flags.slice(0, 2).forEach((flag, i) => {
    roadmap.push({
      id: `flag${i}`,
      title: flag.fix?.summary ?? flag.flag,
      time: flag.fix?.time_required ?? "20m",
      pts: "+9 pts",
      now: false,
    });
  });

  // TOC badge helpers
  const tocBadge = (content: string, variant: "crit" | "warn" | "ok" | "lock") => {
    const styles: Record<string, React.CSSProperties> = {
      crit: { color: "var(--rc-red)", background: "var(--rc-red-bg)", border: "1px solid var(--rc-red-border)" },
      warn: { color: "var(--rc-amber)", background: "var(--rc-amber-bg)", border: "1px solid var(--rc-amber-border)" },
      ok:   { color: "var(--rc-green)", background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)" },
      lock: { color: "var(--rc-hint)", background: "var(--rc-surface-hero)", border: "1px solid var(--rc-border)" },
    };
    return (
      <span style={{
        ...MONO, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
        letterSpacing: "0.06em", whiteSpace: "nowrap" as const,
        ...styles[variant],
      }}>
        {content}
      </span>
    );
  };

  const tocItem = (id: string, num: string, label: string, badge: React.ReactNode, locked = false) => {
    const isActive = activeSection === id;
    return (
      <a
        href={`#${id}`}
        onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}
        style={{
          display: "grid",
          gridTemplateColumns: "26px 1fr auto",
          alignItems: "center",
          gap: 10,
          padding: isActive ? "8px 10px 8px 12px" : "8px 10px 8px 8px",
          borderRadius: 4,
          color: locked ? "var(--rc-hint)" : isActive ? "var(--rc-red)" : "var(--rc-muted)",
          background: isActive ? "var(--rc-red-bg)" : "transparent",
          textDecoration: "none",
          cursor: "pointer",
          position: "relative" as const,
          transition: "all 150ms ease",
        }}
      >
        {isActive && (
          <span style={{
            position: "absolute", left: 0, top: 6, bottom: 6, width: 2,
            background: "var(--rc-red)", borderRadius: 99,
          }} />
        )}
        <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.08em", color: isActive ? "var(--rc-red)" : "var(--rc-hint)", fontWeight: 700 }}>{num}</span>
        <span style={{ ...SANS, fontSize: 13, fontWeight: isActive ? 600 : 500, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {badge}
      </a>
    );
  };

  // Button styles
  const iconBtn = (active = false, primary = false): React.CSSProperties => ({
    ...MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    padding: "7px 12px", border: `1px solid ${primary ? "var(--rc-text)" : active ? "var(--rc-red)" : "var(--rc-border)"}`,
    borderRadius: 4, cursor: "pointer",
    background: primary ? "var(--rc-text)" : active ? "var(--rc-red-bg)" : "var(--rc-surface)",
    color: primary ? "#fff" : active ? "var(--rc-red)" : "var(--rc-hint)",
    textTransform: "uppercase" as const,
    display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" as const,
    transition: "all 150ms ease",
  });

  const TOPBAR_H = 54;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--rc-bg)", color: "var(--rc-text)", fontFamily: "var(--font-sans)" }}>

      {/* ── Topbar ── */}
      <nav style={{
        flexShrink: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: TOPBAR_H,
        background: "rgba(247,245,242,0.85)",
        backdropFilter: "blur(14px)",
        borderBottom: "0.5px solid var(--rc-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href={localePath("/")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={24} height={24} />
            <span style={{ ...SANS, fontWeight: 600, fontSize: 14, color: "var(--rc-text)" }}>RejectCheck</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 18, borderLeft: "1px solid var(--rc-border)" }}>
            <span style={{ ...MONO, fontSize: 11, letterSpacing: "0.08em", color: "var(--rc-hint)", textTransform: "uppercase" }}>Diagnosis ·</span>
            <span style={{ ...SANS, fontSize: 13, fontWeight: 600, color: "var(--rc-text)" }}>
              {role}{company ? ` · ${company}` : ""}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {cvBlobUrl && (
            <button style={iconBtn(cvOpen)} onClick={() => setCvOpen((v) => !v)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="2" width="16" height="20" rx="1"/><path d="M8 6h8M8 10h8M8 14h5"/>
              </svg>
              {cvOpen ? "Hide CV" : "View CV"}
            </button>
          )}
          <button style={iconBtn()} onClick={onExportMd}>↓ .md</button>
          <button style={iconBtn(false, false)} onClick={onExportPdf} disabled={isExportingPdf}>
            {isExportingPdf ? "Exporting…" : "↓ PDF"}
          </button>
          {onShare && (
            <button style={iconBtn()} onClick={onShare} disabled={isSharing}>
              {isSharing ? "…" : "↗ Share"}
            </button>
          )}
          <button style={iconBtn(false, true)} onClick={onReset}>↻ New</button>
        </div>
      </nav>

      {/* ── Page grid ── */}
      <div style={{
        flex: 1,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: cvOpen ? "240px 1fr 420px" : "240px 1fr",
        maxWidth: 1380,
        margin: "0 auto",
        width: "100%",
      }}>

        {/* ── TOC ── */}
        <aside style={{
          height: "100%",
          padding: `48px 16px 0 24px`,
          borderRight: "1px solid var(--rc-border)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}>
          <div style={{ ...EYEBROW, marginBottom: 14, paddingLeft: 8 }}>Diagnosis</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {tocItem("s1", "01", "The one move", tocBadge("key", "crit"))}
            {tocItem("s2", "02", "Skill mapping", skills.length ? tocBadge(`${gapCount} gaps`, gapCount > 2 ? "crit" : "warn") : tocBadge("pending", "lock"))}
            {tocItem("s3", "03", "ATS filter", result.ats_simulation ? tocBadge(result.ats_simulation.would_pass ? "pass" : "fail", result.ats_simulation.would_pass ? "ok" : "crit") : tocBadge("—", "lock"))}
            {tocItem("s4", "04", "CV bullets", tocBadge(String(result.audit.cv.issues.length), result.audit.cv.issues.some(i => i.severity === "critical") ? "crit" : "warn"))}
            {tocItem("s5", "05", "Red flags", tocBadge(String(result.hidden_red_flags.length), result.hidden_red_flags.length >= 2 ? "crit" : "warn"))}

            <div style={{ margin: "12px 8px 6px", height: 1, background: "var(--rc-border)" }} />
            <div style={{ ...EYEBROW, fontSize: 9, padding: "6px 12px 4px" }}>Action</div>
            {tocItem("s6", "06", "Roadmap", tocBadge("~2h", "ok"))}

            <div style={{ margin: "12px 8px 6px", height: 1, background: "var(--rc-border)" }} />
            <div style={{ ...EYEBROW, fontSize: 9, padding: "6px 12px 4px" }}>Signals</div>
            {tocItem("s7", "07", "GitHub · LinkedIn", result.audit.github.score !== null || result.audit.linkedin.score !== null ? tocBadge(String((result.audit.github.issues.length + result.audit.linkedin.issues.length)), (result.audit.github.issues.length + result.audit.linkedin.issues.length) > 2 ? "warn" : "ok") : tocBadge("—", "lock"))}
            {tocItem("s8", "08", "Timeline", result.cross_profile_inconsistencies?.length ? tocBadge(String(result.cross_profile_inconsistencies.length), result.cross_profile_inconsistencies.some(i => i.severity === "critical") ? "crit" : "warn") : tocBadge("—", "lock"))}

            <div style={{ margin: "12px 8px 6px", height: 1, background: "var(--rc-border)" }} />
            <div style={{ ...EYEBROW, fontSize: 9, padding: "6px 12px 4px" }}>Premium</div>
            {(() => {
              const hasShortlisted = userPlan === "shortlisted" || userPlan === "hired";
              const hasHired = userPlan === "hired";
              return (<>
                {tocItem(hasShortlisted ? "s9"  : "s-pro", "09", "Bridge project", hasShortlisted ? tocBadge("✓", "ok") : tocBadge("◆", "lock"), !hasShortlisted)}
                {tocItem(hasShortlisted ? "s10" : "s-pro", "10", "CV rewrite",     hasShortlisted ? tocBadge("✓", "ok") : tocBadge("◆", "lock"), !hasShortlisted)}
                {tocItem(hasShortlisted ? "s11" : "s-pro", "11", "Cover letter",   hasShortlisted ? tocBadge("✓", "ok") : tocBadge("◆", "lock"), !hasShortlisted)}
                {tocItem(hasHired ? "s12" : "s-pro", "12", "AI interview",  hasHired ? tocBadge("✓", "ok") : tocBadge("◆", "lock"), !hasHired)}
                {tocItem(hasHired ? "s13" : "s-pro", "13", "Negotiation",   hasHired ? tocBadge("✓", "ok") : tocBadge("◆", "lock"), !hasHired)}
              </>);
            })()}
          </div>
        </aside>

        {/* ── Main ── */}
        <main ref={mainRef} style={{ padding: "48px 64px 120px", overflowY: "auto", height: "100%", scrollbarWidth: "none" }}>

          {/* ── Hero ── */}
          <section data-dr-sec="s1" style={{ paddingBottom: 32, borderBottom: `1px solid var(--rc-text)`, marginBottom: 56 }}>
            <div style={{
              display: "flex", gap: 14, alignItems: "center",
              ...MONO, fontSize: 11, letterSpacing: "0.08em",
              color: "var(--rc-hint)", textTransform: "uppercase",
              marginBottom: 18,
            }}>
              <span><strong style={{ color: "var(--rc-text)", fontWeight: 600 }}>vs {role}</strong></span>
              {company && <><span style={{ width: 1, height: 12, background: "var(--rc-border)", display: "inline-block" }} /><span>{company}</span></>}
              <span style={{ width: 1, height: 12, background: "var(--rc-border)", display: "inline-block" }} />
              <span style={{ color: "var(--rc-red)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span className="dr-blink" style={{ width: 6, height: 6, borderRadius: 99, background: "var(--rc-red)", display: "inline-block" }} />
                Just diagnosed
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,220px) 1fr", gap: 48, alignItems: "start" }}>
              <div>
                <div style={{
                  ...MONO, fontWeight: 700,
                  fontSize: 144, lineHeight: 0.84, letterSpacing: "-0.06em",
                  color, margin: 0,
                  display: "flex", alignItems: "baseline",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  <span>{scoreDisplay}</span>
                  <span style={{ fontSize: 56, opacity: 0.5, marginLeft: 12 }}>%</span>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
                  textTransform: "uppercase", color, marginTop: 16,
                }}>
                  <span className="dr-pulse-ring" style={{ width: 8, height: 8, borderRadius: 99, background: color, display: "inline-block" }} />
                  {verdictLabel(result.score)}
                </div>
                <div style={{ height: 4, background: "var(--rc-border)", borderRadius: 99, overflow: "hidden", marginTop: 28 }}>
                  <div style={{
                    height: "100%",
                    background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, black))`,
                    borderRadius: 99,
                    width: barGo ? `${result.score}%` : "0%",
                    transition: "width 1.4s cubic-bezier(0.25,0.46,0.45,0.94)",
                  }} />
                </div>
              </div>

              <h1 className="dr-fade-up" style={{
                ...{ fontFamily: "var(--font-display)" }, fontStyle: "italic", fontWeight: 400,
                fontSize: "clamp(28px, 3.5vw, 48px)", lineHeight: 1.08,
                letterSpacing: "-0.02em", color: "var(--rc-text)", margin: 0,
                textWrap: "balance" as React.CSSProperties["textWrap"],
              }}>
                {sentence}
              </h1>
            </div>
          </section>

          {/* ── §01 The one move ── */}
          <section data-dr-sec="s1" id="s1" style={{ paddingBottom: 64, paddingTop: 0 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 01 · The one move that matters</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                If you do <span style={DISPLAY_ITALIC}>one thing</span>, do this.
              </h2>
            </div>

            <div style={{
              background: "var(--rc-red-bg)",
              border: "1px solid var(--rc-red-border)",
              borderLeft: "3px solid var(--rc-red)",
              borderRadius: "0 6px 6px 0",
              padding: "24px 28px",
            }}>
              <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="dr-blink" style={{ width: 6, height: 6, borderRadius: 99, background: "var(--rc-red)", display: "inline-block" }} />
                Highest-impact fix
              </div>
              <p style={{ ...SANS, fontSize: 16, lineHeight: 1.55, color: "var(--rc-text)", margin: 0 }}>
                {oneMoveBody}
              </p>
              <div style={{
                marginTop: 14, paddingTop: 12,
                borderTop: "1px solid rgba(201,58,57,0.12)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-muted)" }}>Estimated score impact</span>
                <span style={{ ...MONO, fontWeight: 700, fontSize: 22, color: "var(--rc-red)", letterSpacing: "-0.02em" }}>{oneMoveImpact}</span>
              </div>
            </div>
          </section>

          {/* ── §02 Skill mapping ── */}
          <section data-dr-sec="s2" id="s2" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 02 · Skill mapping</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                {skills.length
                  ? <>{skills.length} skills the JD asks for. <span style={DISPLAY_ITALIC}>{gapCount > 0 ? `${gapCount} short.` : "All matched."}</span></>
                  : deepStatus === "pending"
                    ? <>Skill analysis <span style={DISPLAY_ITALIC}>loading…</span></>
                    : <>Skill mapping <span style={DISPLAY_ITALIC}>unavailable.</span></>
                }
              </h2>
              {skills.length > 0 && (
                <p style={{ ...SANS, fontSize: 15, lineHeight: 1.6, color: "var(--rc-muted)", marginTop: 14, maxWidth: 580 }}>
                  Hatched bars = level the JD expects. Solid fill = what we found in your CV + GitHub. The vertical line is the target.
                </p>
              )}
            </div>

            {skills.length > 0 && (
              <div ref={skillsRef} style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "22px 28px 18px", borderBottom: "1px solid var(--rc-border)" }}>
                  <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>Skill ↔ JD match</span>
                  <div style={{ display: "flex", gap: 16 }}>
                    {[
                      { swatch: <span style={{ width: 8, height: 8, borderRadius: 2, border: "1px solid var(--rc-border)", background: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,0.14) 3px,rgba(0,0,0,0.14) 5px)", display: "inline-block" }} />, label: "JD expects" },
                      { swatch: <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--rc-green)", display: "inline-block" }} />, label: "You have" },
                      { swatch: <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--rc-text)", display: "inline-block" }} />, label: "Target" },
                    ].map(({ swatch, label }) => (
                      <span key={label} style={{ ...MONO, fontSize: 10, letterSpacing: "0.06em", color: "var(--rc-hint)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                        {swatch}{label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "10px 28px 28px" }}>
                  {skills.map((skill, idx) => {
                    const gap = skill.current < skill.expected * 0.85;
                    const color = skillColor(skill.current);
                    return (
                      <div key={idx} style={{ padding: "16px 0", display: "grid", gridTemplateColumns: "160px 1fr 70px", gap: 18, alignItems: "center", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)" }}>
                        <div>
                          <div style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)" }}>{skill.name}</div>
                          <div style={{ ...MONO, fontSize: 10, color: "var(--rc-hint)", marginTop: 3, fontWeight: 400, letterSpacing: "0.04em" }}>{skill.evidence}</div>
                        </div>
                        <div style={{ position: "relative", height: 14, background: "var(--rc-surface-hero)", borderRadius: 99 }}>
                          {/* hatched: JD expects */}
                          <div style={{
                            position: "absolute", left: 0, top: 0, height: "100%",
                            background: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 5px)",
                            border: "1px solid var(--rc-border)",
                            borderRadius: 99,
                            width: skillsGo ? `${skill.expected * 10}%` : "0%",
                            transition: "width 1.2s cubic-bezier(0.25,0.46,0.45,0.94)",
                          }} />
                          {/* solid: have */}
                          <div style={{
                            position: "absolute", left: 0, top: 1, height: "calc(100% - 2px)",
                            background: color,
                            borderRadius: 99,
                            width: skillsGo ? `${skill.current * 10}%` : "0%",
                            transition: `width 1.4s cubic-bezier(0.25,0.46,0.45,0.94) ${0.15 + idx * 0.05}s`,
                          }} />
                          {/* target marker */}
                          <div style={{
                            position: "absolute", top: -6, bottom: -6, width: 2,
                            background: "var(--rc-text)",
                            left: `${skill.expected * 10}%`,
                            transform: "translateX(-1px)",
                            opacity: skillsGo ? 1 : 0,
                            transition: "opacity 300ms ease 1.2s",
                          }} />
                        </div>
                        <div style={{ ...MONO, fontSize: 14, fontWeight: 700, textAlign: "right", color: color, letterSpacing: "-0.02em" }}>
                          {skill.current}
                          <small style={{ display: "block", fontSize: 10, color: "var(--rc-hint)", fontWeight: 400, letterSpacing: "0.04em", marginTop: 2 }}>
                            / 10
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {skills.length === 0 && deepStatus === "pending" && (
              <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: 32, textAlign: "center" }}>
                <div style={{ ...MONO, fontSize: 11, color: "var(--rc-hint)", letterSpacing: "0.12em", textTransform: "uppercase", animation: "pulse 2s infinite" }}>
                  Generating skill analysis…
                </div>
              </div>
            )}
          </section>

          {/* ── §03 ATS filter ── */}
          {result.ats_simulation && (
            <section data-dr-sec="s3" id="s3" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
              <div style={{ marginBottom: 32 }}>
                <div style={SEC_NUM}><SecNumLine />§ 03 · ATS keyword filter</div>
                <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                  {result.ats_simulation.would_pass
                    ? <>You&apos;d <span style={DISPLAY_ITALIC}>pass</span> the keyword filter.</>
                    : <>You&apos;d <span style={DISPLAY_ITALIC}>fail</span> the ATS keyword filter.</>
                  }
                </h2>
                <p style={{ ...SANS, fontSize: 15, lineHeight: 1.6, color: "var(--rc-muted)", marginTop: 14, maxWidth: 580 }}>
                  Match rate is {result.ats_simulation.score}%. The threshold is typically {result.ats_simulation.threshold}%.
                  {!result.ats_simulation.would_pass && " Missing keywords must be added to bullets where they truthfully apply."}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 24 }}>
                {/* Found */}
                <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "22px 24px" }}>
                  <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Found in CV
                    <span style={{ color: "var(--rc-green)", fontWeight: 700, fontSize: 11 }}>{foundSkills.length}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {foundSkills.slice(0, 12).map((s, i) => (
                      <span key={i} style={{ ...MONO, fontSize: 12, letterSpacing: "0.02em", padding: "5px 10px", borderRadius: 4, border: "1px solid var(--rc-green-border)", color: "var(--rc-green)", background: "var(--rc-green-bg)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700 }}>✓</span>{s.skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing */}
                <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "22px 24px" }}>
                  <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Missing from CV
                    <span style={{ color: "var(--rc-red)", fontWeight: 700, fontSize: 11 }}>{missingSkills.length + critMissing.length}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {missingSkills.slice(0, 6).map((s, i) => (
                      <span key={`ms${i}`} style={{ ...MONO, fontSize: 12, letterSpacing: "0.02em", padding: "5px 10px", borderRadius: 4, border: "1px solid var(--rc-red-border)", color: "var(--rc-red)", background: "var(--rc-red-bg)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700 }}>×</span>{s.skill}
                      </span>
                    ))}
                    {critMissing.filter(k => !missingSkills.some(s => s.skill.toLowerCase() === k.keyword.toLowerCase())).slice(0, 4).map((k, i) => (
                      <span key={`ck${i}`} style={{ ...MONO, fontSize: 12, letterSpacing: "0.02em", padding: "5px 10px", borderRadius: 4, border: "1px solid var(--rc-amber-border)", color: "var(--rc-amber)", background: "var(--rc-amber-bg)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700 }}>!</span>{k.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verdict row */}
              <div style={{
                marginTop: 24, padding: "16px 20px",
                background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 6,
                    background: result.ats_simulation.would_pass ? "var(--rc-green-bg)" : "var(--rc-red-bg)",
                    color: result.ats_simulation.would_pass ? "var(--rc-green)" : "var(--rc-red)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...MONO, fontWeight: 700, fontSize: 18,
                  }}>
                    {result.ats_simulation.would_pass ? "✓" : "×"}
                  </div>
                  <div>
                    <div style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)" }}>
                      {result.ats_simulation.would_pass ? "Would pass the ATS filter" : "Would not pass the ATS filter"}
                    </div>
                    <div style={{ ...MONO, fontSize: 11, color: "var(--rc-hint)", letterSpacing: "0.04em" }}>
                      Match rate {result.ats_simulation.score}% · threshold ≈ {result.ats_simulation.threshold}%
                    </div>
                  </div>
                </div>
                <div style={{ ...MONO, fontWeight: 700, fontSize: 28, color: result.ats_simulation.would_pass ? "var(--rc-green)" : "var(--rc-red)", letterSpacing: "-0.02em" }}>
                  {result.ats_simulation.score}%
                </div>
              </div>
            </section>
          )}

          {/* ── §04 CV bullets ── */}
          <section data-dr-sec="s4" id="s4" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 04 · CV analysis · bullet by bullet</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                {result.audit.cv.issues.length > 0
                  ? <>Your bullets describe <span style={DISPLAY_ITALIC}>activity</span>, not impact.</>
                  : <>Your CV bullets <span style={DISPLAY_ITALIC}>read well.</span></>
                }
              </h2>
              <p style={{ ...SANS, fontSize: 15, lineHeight: 1.6, color: "var(--rc-muted)", marginTop: 14, maxWidth: 580 }}>
                {result.audit.cv.issues.length} issue{result.audit.cv.issues.length !== 1 ? "s" : ""} found. Below: what's wrong and what would land instead.
              </p>
            </div>

            {result.audit.cv.issues.slice(0, 6).map((issue, idx) => {
              const sev = sevClass(issue.severity);
              return (
                <div key={idx} style={{ padding: "22px 0", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)", display: "grid", gridTemplateColumns: "24px 1fr", gap: 18 }}>
                  <div style={{ ...MONO, fontSize: 11, color: "var(--rc-hint)", letterSpacing: "0.06em", paddingTop: 4, fontWeight: 700 }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 6 }}>
                      {issue.category} issue
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 12, alignItems: "start" }}>
                        <span style={{
                          ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                          padding: "2px 7px", borderRadius: 4, alignSelf: "start",
                          color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`,
                          display: "inline-flex", alignItems: "center", gap: 5,
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: 99, background: "currentColor", display: "inline-block" }} />
                          {issue.severity}
                        </span>
                        <span style={{ ...SANS, fontSize: 13, lineHeight: 1.5, color: "var(--rc-muted)" }}>
                          <strong style={{ color: "var(--rc-text)" }}>{issue.what}</strong> — {issue.why}
                        </span>
                      </div>
                    </div>
                    {issue.fix?.example && (
                      <div style={{ padding: "12px 16px", background: "var(--rc-green-bg)", borderLeft: "2px solid var(--rc-green)", ...SANS, fontSize: 13, lineHeight: 1.55 }}>
                        <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-green)", fontWeight: 700, display: "block", marginBottom: 4 }}>
                          Coach rewrite
                        </span>
                        {issue.fix.example.after}
                      </div>
                    )}
                    {!issue.fix && deepStatus === "pending" && (
                      <div style={{ height: 36, background: "var(--rc-surface-hero)", borderRadius: 4, animation: "pulse 2s infinite", marginTop: 4 }} />
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* ── §05 Red flags ── */}
          <section data-dr-sec="s5" id="s5" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 05 · Red flags</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                Things a recruiter <span style={DISPLAY_ITALIC}>would silently mark</span>.
              </h2>
            </div>

            {result.hidden_red_flags.map((flag, idx) => (
              <div key={idx} style={{
                padding: "18px 0", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)",
                display: "grid", gridTemplateColumns: "92px 1fr auto", gap: 16, alignItems: "start",
              }}>
                <span style={{
                  ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 4, alignSelf: "start",
                  color: "var(--rc-red)", background: "var(--rc-red-bg)", border: "1px solid var(--rc-red-border)",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: 99, background: "currentColor", display: "inline-block" }} />
                  Red flag
                </span>
                <div>
                  <h4 style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)", margin: "0 0 4px" }}>{flag.flag}</h4>
                  <p style={{ ...SANS, fontSize: 13, lineHeight: 1.55, color: "var(--rc-muted)", margin: 0 }}>{flag.perception}</p>
                </div>
                <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.06em", color: "var(--rc-hint)", textTransform: "uppercase", textAlign: "right", whiteSpace: "nowrap" as const }}>
                  Impact
                  <strong style={{ display: "block", ...MONO, fontWeight: 700, fontSize: 16, color: "var(--rc-red)", marginTop: 2 }}>
                    −{(idx + 1) <= 1 ? 9 : idx <= 2 ? 7 : 5}
                  </strong>
                </div>
              </div>
            ))}
          </section>

          {/* ── §06 Roadmap ── */}
          <section data-dr-sec="s6" id="s6" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 06 · Roadmap</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                In <span style={DISPLAY_ITALIC}>a few hours</span>, this CV is shortlist-ready.
              </h2>
              <p style={{ ...SANS, fontSize: 15, lineHeight: 1.6, color: "var(--rc-muted)", marginTop: 14, maxWidth: 580 }}>
                Prioritized order. Each step shows estimated time and score gain.
              </p>
            </div>

            {roadmap.map((item, idx) => (
              <div key={item.id} style={{
                padding: "18px 0", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)",
                display: "grid", gridTemplateColumns: "36px 1fr 100px", gap: 16, alignItems: "center",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 99,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...MONO, fontSize: 11, fontWeight: 700,
                  background: item.now ? "var(--rc-red)" : "var(--rc-surface-hero)",
                  color: item.now ? "#fff" : "var(--rc-hint)",
                  border: `1px solid ${item.now ? "var(--rc-red)" : "var(--rc-border)"}`,
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </div>
                <div>
                  <div style={{ ...SANS, fontSize: 14, color: "var(--rc-text)" }}>{item.title}</div>
                  {item.detail && <div style={{ ...SANS, fontSize: 12, color: "var(--rc-hint)", marginTop: 3 }}>{item.detail}</div>}
                </div>
                <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: item.now ? "var(--rc-red)" : "var(--rc-hint)", textAlign: "right" }}>
                  {item.time}
                  <span style={{ display: "block", color: "var(--rc-green)", fontWeight: 700 }}>{item.pts}</span>
                </div>
              </div>
            ))}
          </section>

          {/* ── §07 Signals ── */}
          <section data-dr-sec="s7" id="s7" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 07 · GitHub &amp; LinkedIn signals</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                {result.audit.github.score === null && result.audit.linkedin.score === null
                  ? <>No external profiles <span style={DISPLAY_ITALIC}>analysed.</span></>
                  : (result.audit.github.issues.length + result.audit.linkedin.issues.length) === 0
                    ? <>External signals <span style={DISPLAY_ITALIC}>look solid.</span></>
                    : <>{result.audit.github.issues.length + result.audit.linkedin.issues.length} signal{(result.audit.github.issues.length + result.audit.linkedin.issues.length) !== 1 ? "s" : ""} to <span style={DISPLAY_ITALIC}>fix.</span></>
                }
              </h2>
            </div>

            {(result.audit.github.score !== null || result.audit.github.issues.length > 0) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ ...EYEBROW }}>GitHub</div>
                  {result.audit.github.score !== null && (
                    <span style={{ ...MONO, fontWeight: 700, fontSize: 18, color: skillColor(result.audit.github.score / 10), letterSpacing: "-0.02em" }}>
                      {result.audit.github.score}<small style={{ fontSize: 11, fontWeight: 400, color: "var(--rc-hint)", marginLeft: 2 }}>/100</small>
                    </span>
                  )}
                </div>
                {result.audit.github.issues.map((issue, idx) => {
                  const sev = sevClass(issue.severity);
                  return (
                    <div key={idx} style={{ padding: "14px 0", borderTop: "1px solid var(--rc-border)", display: "grid", gridTemplateColumns: "80px 1fr", gap: 14, alignItems: "start" }}>
                      <span style={{ ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, alignSelf: "start", justifySelf: "center" }}>
                        <span style={{ width: 4, height: 4, borderRadius: 99, background: "currentColor", display: "inline-block" }} />{issue.severity}
                      </span>
                      <div>
                        <div style={{ ...SANS, fontSize: 13, fontWeight: 600, color: "var(--rc-text)", marginBottom: 2 }}>{issue.what}</div>
                        <div style={{ ...SANS, fontSize: 13, lineHeight: 1.5, color: "var(--rc-muted)" }}>{issue.why}</div>
                        {issue.fix?.example && (
                          <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--rc-green-bg)", borderLeft: "2px solid var(--rc-green)", ...SANS, fontSize: 12, lineHeight: 1.5 }}>
                            <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-green)", fontWeight: 700, display: "block", marginBottom: 3 }}>Fix</span>
                            {issue.fix.example.after}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {result.audit.github.score !== null && result.audit.github.issues.length === 0 && (
                  <div style={{ ...SANS, fontSize: 14, color: "var(--rc-muted)", padding: "12px 0" }}>No issues detected.</div>
                )}
              </div>
            )}

            {(result.audit.linkedin.score !== null || result.audit.linkedin.issues.length > 0) && (
              <div style={{ borderTop: result.audit.github.score !== null ? "1px solid var(--rc-border)" : "none", paddingTop: result.audit.github.score !== null ? 24 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ ...EYEBROW }}>LinkedIn</div>
                  {result.audit.linkedin.score !== null && (
                    <span style={{ ...MONO, fontWeight: 700, fontSize: 18, color: skillColor(result.audit.linkedin.score / 10), letterSpacing: "-0.02em" }}>
                      {result.audit.linkedin.score}<small style={{ fontSize: 11, fontWeight: 400, color: "var(--rc-hint)", marginLeft: 2 }}>/100</small>
                    </span>
                  )}
                </div>
                {result.audit.linkedin.issues.map((issue, idx) => {
                  const sev = sevClass(issue.severity);
                  return (
                    <div key={idx} style={{ padding: "14px 0", borderTop: "1px solid var(--rc-border)", display: "grid", gridTemplateColumns: "80px 1fr", gap: 14, alignItems: "start" }}>
                      <span style={{ ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, alignSelf: "start", justifySelf: "center" }}>
                        <span style={{ width: 4, height: 4, borderRadius: 99, background: "currentColor", display: "inline-block" }} />{issue.severity}
                      </span>
                      <div>
                        <div style={{ ...SANS, fontSize: 13, fontWeight: 600, color: "var(--rc-text)", marginBottom: 2 }}>{issue.what}</div>
                        <div style={{ ...SANS, fontSize: 13, lineHeight: 1.5, color: "var(--rc-muted)" }}>{issue.why}</div>
                        {issue.fix?.example && (
                          <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--rc-green-bg)", borderLeft: "2px solid var(--rc-green)", ...SANS, fontSize: 12, lineHeight: 1.5 }}>
                            <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-green)", fontWeight: 700, display: "block", marginBottom: 3 }}>Fix</span>
                            {issue.fix.example.after}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {result.audit.linkedin.score !== null && result.audit.linkedin.issues.length === 0 && (
                  <div style={{ ...SANS, fontSize: 14, color: "var(--rc-muted)", padding: "12px 0" }}>No issues detected.</div>
                )}
              </div>
            )}

            {result.audit.github.score === null && result.audit.linkedin.score === null && (
              <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "24px 28px", color: "var(--rc-muted)", ...SANS, fontSize: 14 }}>
                No GitHub username or LinkedIn profile was submitted. Re-run the analysis with your profiles to unlock signal scoring.
              </div>
            )}
          </section>

          {/* ── §08 Timeline / Consistency ── */}
          <section data-dr-sec="s8" id="s8" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 08 · Timeline &amp; consistency</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                {result.timeline_entries?.length
                  ? <>{result.timeline_entries.length} entr{result.timeline_entries.length !== 1 ? "ies" : "y"} <span style={DISPLAY_ITALIC}>across your profiles.</span></>
                  : <>Career timeline <span style={DISPLAY_ITALIC}>unavailable.</span></>
                }
              </h2>
            </div>

            {/* Timeline first */}
            {result.timeline_entries && result.timeline_entries.length > 0 && (() => {
              const markers = (result.cross_profile_inconsistencies ?? [])
                .map((inc) => {
                  if (!inc.anchor_date) return null;
                  const m = inc.anchor_date.match(/^(\d{4})-(\d{1,2})$/);
                  if (!m) return null;
                  const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, 15);
                  return { date: d, severity: inc.severity, description: inc.description, field: inc.field, sources: inc.sources };
                })
                .filter((x): x is NonNullable<typeof x> => x !== null);
              return <SourceTimeline entries={result.timeline_entries} markers={markers} />;
            })()}

            {/* Inconsistencies after */}
            {result.cross_profile_inconsistencies && result.cross_profile_inconsistencies.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: "0 0 24px", maxWidth: 720 }}>
                  {result.cross_profile_inconsistencies.length} inconsistenc{result.cross_profile_inconsistencies.length !== 1 ? "ies" : "y"} <span style={DISPLAY_ITALIC}>across profiles.</span>
                </h2>
                {result.cross_profile_inconsistencies.map((inc, idx) => {
                  const sev = sevClass(inc.severity);
                  return (
                    <div key={idx} style={{ padding: "16px 0", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)", display: "grid", gridTemplateColumns: "80px 1fr", gap: 14, alignItems: "start" }}>
                      <span style={{ ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, alignSelf: "start", justifySelf: "center" }}>
                        <span style={{ width: 4, height: 4, borderRadius: 99, background: "currentColor", display: "inline-block" }} />{inc.severity}
                      </span>
                      <div>
                        <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 4 }}>
                          {inc.field.replace(/_/g, " ")} · {inc.sources.join(" vs ")}
                        </div>
                        <div style={{ ...SANS, fontSize: 13, fontWeight: 600, color: "var(--rc-text)", marginBottom: 3 }}>{inc.description}</div>
                        <div style={{ ...SANS, fontSize: 13, lineHeight: 1.5, color: "var(--rc-muted)" }}>{inc.recruiter_perception}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!result.cross_profile_inconsistencies?.length && !result.timeline_entries?.length && (
              <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "24px 28px", color: "var(--rc-muted)", ...SANS, fontSize: 14 }}>
                No timeline or consistency data available.
              </div>
            )}
          </section>

          {/* ── §09–13 Premium sections ── */}
          {(() => {
            const hasShortlisted = userPlan === "shortlisted" || userPlan === "hired";
            const hasHired = userPlan === "hired";

            // Reusable launch card for features that require separate generation
            const launchCard = (icon: React.ReactNode, title: string, desc: string, bullets: string[]) => (
              <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 8, padding: "28px 32px", display: "flex", gap: 28, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(201,58,57,0.08)", border: "1px solid rgba(201,58,57,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(201,58,57,0.25)" }}>
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...SANS, fontWeight: 600, fontSize: 15, color: "var(--rc-text)", marginBottom: 6, letterSpacing: "-0.01em" }}>{title}</div>
                  <div style={{ ...SANS, fontSize: 13, lineHeight: 1.6, color: "var(--rc-muted)", marginBottom: 14 }}>{desc}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 18 }}>
                    {bullets.map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--rc-red)", display: "inline-block", flexShrink: 0, marginTop: 6 }} />
                        <span style={{ ...SANS, fontSize: 12, color: "var(--rc-muted)" }}>{b}</span>
                      </div>
                    ))}
                  </div>
                  <span style={{ ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--rc-hint)" }}>Available in your workspace →</span>
                </div>
              </div>
            );

            return (<>

              {/* §09 Bridge project */}
              {hasShortlisted && (
                <section data-dr-sec="s9" id="s9" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
                  <div style={SEC_NUM}><SecNumLine />§ 09 · Bridge project</div>
                  {result.project_recommendation ? (() => {
                    const p = result.project_recommendation;
                    const diffColor = p.difficulty_level === "Expert" ? "var(--rc-red)" : p.difficulty_level === "Advanced" ? "var(--rc-amber)" : "var(--rc-hint)";
                    return (<>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 20 }}>
                        <h3 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(22px,2.4vw,32px)", letterSpacing: "-0.025em", margin: 0, lineHeight: 1.1 }}>
                          <span style={DISPLAY_ITALIC}>{p.name}</span>
                        </h3>
                        <span style={{ ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: diffColor, padding: "2px 7px", border: `1px solid ${diffColor}33`, borderRadius: 4, flexShrink: 0 }}>{p.difficulty_level}</span>
                      </div>
                      <p style={{ ...SANS, fontSize: 14, lineHeight: 1.65, color: "var(--rc-muted)", margin: "0 0 24px", maxWidth: 680 }}>{p.why_it_matters}</p>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 28 }}>
                        {p.technologies.map((t) => (
                          <span key={t} style={{ ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--rc-text)", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 4, padding: "3px 8px" }}>{t}</span>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {p.key_features.slice(0, 4).map((f, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 16px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6 }}>
                            <span style={{ ...MONO, fontSize: 10, color: "var(--rc-red)", fontWeight: 700, flexShrink: 0, paddingTop: 1 }}>{String(i + 1).padStart(2, "0")}</span>
                            <span style={{ ...SANS, fontSize: 13, lineHeight: 1.5, color: "var(--rc-text)" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </>);
                  })() : launchCard(
                    <GitBranch size={22} strokeWidth={1.5} color="#C93A39" />,
                    "Bridge project",
                    "A 5-day side project scoped to your exact skill gaps.",
                    ["Tech stack, repo structure, day-by-day milestones", "README template ready to publish", "Built around the keywords this JD expects"]
                  )}
                </section>
              )}

              {/* §10 CV rewrite */}
              {hasShortlisted && (
                <section data-dr-sec="s10" id="s10" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
                  <div style={{ ...SEC_NUM, marginBottom: 32 }}><SecNumLine />§ 10 · CV rewrite</div>
                  <ImproveTab
                    reconstructedCv={reconstructedCv}
                    isLoading={isRewriting}
                    isPremium={true}
                    hasAnalysisId={!!analysisId}
                    onRewrite={onRewrite ?? (() => {})}
                  />
                </section>
              )}

              {/* §11 Cover letter */}
              {hasShortlisted && (
                <section data-dr-sec="s11" id="s11" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
                  <div style={{ ...SEC_NUM, marginBottom: 32 }}><SecNumLine />§ 11 · Cover letter</div>
                  <CoverLetterTab
                    analysisId={analysisId}
                    isPremium={true}
                    company={result.job_details?.company ?? null}
                    candidateName={null}
                    savedCoverLetter={null}
                  />
                </section>
              )}

              {/* §12 AI mock interview */}
              {hasHired && (
                <section data-dr-sec="s12" id="s12" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
                  <div style={{ ...SEC_NUM, marginBottom: 32 }}><SecNumLine />§ 12 · AI mock interview</div>
                  <InterviewTab
                    isPremium={true}
                    analysisId={analysisId}
                    email={email}
                    accessToken={accessToken}
                    defaultInterviewId={null}
                  />
                </section>
              )}

              {/* §13 Negotiation */}
              {hasHired && (
                <section data-dr-sec="s13" id="s13" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
                  <div style={SEC_NUM}><SecNumLine />§ 13 · Negotiation</div>
                  {result.negotiation_analysis ? (() => {
                    const n = result.negotiation_analysis!;
                    const glyph = n.market_range.currency === "USD" ? "$" : n.market_range.currency === "GBP" ? "£" : "€";
                    const fmt = (v: number) => `${glyph}${Math.round(v / 1000)}k`;
                    const leverageColors: Record<string, string> = { high: "var(--rc-green)", medium: "var(--rc-amber)", watch: "var(--rc-red)" };
                    return (<>
                      <h3 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(22px,2.4vw,32px)", letterSpacing: "-0.025em", margin: "0 0 28px", lineHeight: 1.1 }}>
                        Your <span style={DISPLAY_ITALIC}>negotiation playbook.</span>
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
                        <div style={{ padding: "20px 24px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 8 }}>
                          <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--rc-hint)", fontWeight: 700, marginBottom: 8 }}>Market range</div>
                          <div style={{ ...SANS, fontWeight: 600, fontSize: 22, color: "var(--rc-text)", letterSpacing: "-0.02em" }}>{fmt(n.market_range.min)} – {fmt(n.market_range.max)}</div>
                          <div style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)", marginTop: 4 }}>per {n.period === "daily" ? "day" : "year"}</div>
                        </div>
                        <div style={{ padding: "20px 24px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 8 }}>
                          <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--rc-hint)", fontWeight: 700, marginBottom: 8 }}>Your anchor</div>
                          <div style={{ ...SANS, fontWeight: 600, fontSize: 22, color: "var(--rc-red)", letterSpacing: "-0.02em" }}>{fmt(n.anchoring_strategy.anchor_amount)}</div>
                          <div style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)", marginTop: 4 }}>opening ask</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {n.leverage_points.slice(0, 4).map((lp, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 12, alignItems: "start", padding: "12px 16px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6 }}>
                            <span style={{ ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: leverageColors[lp.level], padding: "2px 0" }}>{lp.level}</span>
                            <div>
                              <div style={{ ...SANS, fontSize: 13, fontWeight: 600, color: "var(--rc-text)", marginBottom: 2 }}>{lp.label}</div>
                              <div style={{ ...SANS, fontSize: 12, lineHeight: 1.5, color: "var(--rc-muted)" }}>{lp.evidence}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 16, ...MONO, fontSize: 10, letterSpacing: "0.08em", color: "var(--rc-hint)" }}>Full counter-offer email and talking points available in your workspace →</div>
                    </>);
                  })() : launchCard(
                    <TrendingUp size={22} strokeWidth={1.5} color="#C93A39" />,
                    "Negotiation playbook",
                    "Counter-offer email, market salary chart, leverage points — generated from your analysis.",
                    ["Market range vs your current position", "Leverage points ranked by impact", "Ready-to-send counter-offer email"]
                  )}
                </section>
              )}

              {/* Upsell — only for features the user doesn't have yet */}
              {userPlan !== "hired" && (() => {
                type ProFeature = { num: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>; name: string; desc: string };
                const ALL_FEATURES: ProFeature[] = [
                  { num: "§ 09", Icon: GitBranch,  name: "Bridge project",    desc: "Ship a working repo in 5 days. Built around the exact stack and keywords this JD expects." },
                  { num: "§ 10", Icon: PenLine,    name: "CV rewrite",        desc: "Paste-ready bullets. Metrics added, passive voice killed, seniority signals injected." },
                  { num: "§ 11", Icon: Mail,       name: "Cover letter",      desc: "Addresses the JD point by point. Sounds like you wrote it — because the analysis did." },
                  { num: "§ 12", Icon: Mic,        name: "AI mock interview", desc: "Voice, in your browser. 10 minutes. Harder on your weak spots — scored debrief at the end." },
                  { num: "§ 13", Icon: TrendingUp, name: "Negotiation",       desc: "Counter-offer email, market chart, leverage points. Ready to send before the offer call." },
                ];
                // shortlisted users only see hired-only features in upsell
                const upsellFeatures = hasShortlisted ? ALL_FEATURES.slice(3) : ALL_FEATURES;
                const isHired = hasShortlisted ? true : proTier === "hired";
                const cols = upsellFeatures.length;
                const gridCols = cols === 2 ? "repeat(2, 1fr)" : cols === 3 ? "repeat(3, 1fr)" : "repeat(6, 1fr)";

                const featureCard = (f: ProFeature, i: number, total: number, topBorder = false) => (
                  <div key={f.num} style={{
                    gridColumn: total === 5 ? `span ${i < 3 ? 2 : 3}` : "span 1",
                    padding: "48px 32px",
                    borderRight: (total === 5 ? [0,1,3] : Array.from({length: total - 1}, (_, k) => k)).includes(i) ? "1px solid rgba(255,255,255,0.07)" : "none",
                    borderTop: topBorder || (total === 5 && i >= 3) ? "1px solid rgba(255,255,255,0.07)" : "none",
                    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18,
                  }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(201,58,57,0.1)", border: "1px solid rgba(201,58,57,0.18)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(201,58,57,0.4), 0 0 48px rgba(201,58,57,0.18)" }}>
                      <f.Icon size={28} strokeWidth={1.5} color="#C93A39" />
                    </div>
                    <div>
                      <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)", fontWeight: 700, marginBottom: 7 }}>{f.num}</div>
                      <div style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginBottom: 8, letterSpacing: "-0.01em" }}>{f.name}</div>
                      <div style={{ ...SANS, fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>{f.desc}</div>
                    </div>
                  </div>
                );

                return (
                  <section data-dr-sec="s-pro" id="s-pro" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 32 }}>
                      <div>
                        <div style={SEC_NUM}><SecNumLine />{hasShortlisted ? "§ 12–13 · Hired features" : "§ 09–13 · Pro features"}</div>
                        <h3 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(26px,2.8vw,36px)", letterSpacing: "-0.025em", margin: 0, lineHeight: 1.05 }}>
                          {result.score >= 50
                            ? <>{`You scored ${result.score}.`} <span style={DISPLAY_ITALIC}>Here&apos;s how to flip it.</span></>
                            : result.score >= 25
                            ? <>{`You scored ${result.score}.`} <span style={DISPLAY_ITALIC}>Close the remaining gaps.</span></>
                            : <>Strong match. <span style={DISPLAY_ITALIC}>Make it unrejectable.</span></>
                          }
                        </h3>
                      </div>
                      {!hasShortlisted && (
                        <div style={{ display: "flex", flexShrink: 0, border: "1px solid var(--rc-border)", borderRadius: 6, overflow: "hidden" }}>
                          {(["shortlisted", "hired"] as const).map((tier) => {
                            const active = proTier === tier;
                            return (
                              <button key={tier} onClick={() => setProTier(tier)} style={{ ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, padding: "8px 16px", border: "none", borderLeft: tier === "hired" ? "1px solid var(--rc-border)" : "none", cursor: "pointer", background: active ? "var(--rc-text)" : "var(--rc-bg)", color: active ? "var(--rc-bg)" : "var(--rc-hint)", transition: "all 150ms ease", whiteSpace: "nowrap" as const }}>
                                {tier === "shortlisted" ? "Shortlisted · €7.99" : "Hired · €11.99"}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--rc-border)" }}>
                      <div style={{ background: "#111", display: "grid", gridTemplateColumns: gridCols }}>
                        {cols === 5 ? (
                          <>
                            <div style={{ display: "contents" }}>
                              {upsellFeatures.slice(0, 3).map((f, i) => featureCard(f, i, 5))}
                            </div>
                            <div style={{ display: "grid", gridColumn: "span 6", gridTemplateColumns: "repeat(6, 1fr)" }}>
                              {/* animated row 2 for free users */}
                              <div style={{ gridColumn: "span 6", display: "grid", gridTemplateRows: isHired ? "1fr" : "0fr", transition: "grid-template-rows 380ms ease" }}>
                                <div style={{ overflow: "hidden" }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", opacity: isHired ? 1 : 0, transform: isHired ? "translateY(0)" : "translateY(-8px)", transition: "opacity 280ms ease 80ms, transform 280ms ease 80ms" }}>
                                    {upsellFeatures.slice(3).map((f, i) => featureCard(f, i, 2, true))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          upsellFeatures.map((f, i) => featureCard(f, i, cols))
                        )}
                      </div>
                      <div style={{ background: "var(--rc-bg)", borderTop: "1px solid var(--rc-border)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                        <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.06em", color: "var(--rc-hint)" }}>Cancel anytime · no commitment</span>
                        <Link href="/pricing" style={{ ...SANS, fontWeight: 700, fontSize: 14, padding: "12px 26px", borderRadius: 6, background: "linear-gradient(180deg, var(--rc-red), #A32A29)", color: "#fff", boxShadow: "0 8px 28px rgba(201,58,57,0.32)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "-0.01em", flexShrink: 0 }}>
                          {isHired || hasShortlisted ? "Get Hired →" : proTier === "hired" ? "Get Hired →" : "Get Shortlisted →"}
                        </Link>
                      </div>
                    </div>
                  </section>
                );
              })()}

            </>);
          })()}

        </main>

        {/* ── CV pane ── */}
        {cvOpen && cvBlobUrl && (
          <aside style={{
            height: "100%", overflowY: "auto",
            padding: "32px 24px",
            borderLeft: "1px solid var(--rc-border)",
            background: "var(--rc-bg)",
            scrollbarWidth: "thin",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>Your CV</span>
              <button style={{ background: "none", border: 0, color: "var(--rc-hint)", ...MONO, fontSize: 14, cursor: "pointer" }} onClick={() => setCvOpen(false)}>close ×</button>
            </div>
            <iframe src={cvBlobUrl} style={{ width: "100%", height: "calc(100% - 48px)", border: "none", borderRadius: 4 }} title="CV preview" />
          </aside>
        )}

      </div>
    </div>
  );
}

