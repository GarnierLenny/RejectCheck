"use client";

import { useState, useEffect, useRef } from "react";
import type { AnalysisResult, Issue } from "./types";
import { Github, Linkedin } from "react-bootstrap-icons";
import { Md } from "./Md";
import { PenLine, Mail, Mic } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ImproveTab } from "./tabs/ImproveTab";
import { CoverLetterTab } from "./tabs/CoverLetterTab";
import { InterviewTab } from "./tabs/InterviewTab";
import { AI_INTERVIEW_ENABLED } from "../../lib/features";
import { SourceTimeline } from "./timeline/SourceTimeline";
import { AnalysisShell } from "./AnalysisShell";
import { RiskMeter } from "./RiskMeter";

// ── Helpers ───────────────────────────────────────────────────────────────────

function qualityColor(n: number): string {
  if (n >= 70) return "var(--rc-green)";
  if (n >= 50) return "var(--rc-amber)";
  return "var(--rc-red)";
}

function qualityBg(n: number): string {
  if (n >= 70) return "var(--rc-green-bg)";
  if (n >= 50) return "var(--rc-amber-bg)";
  return "var(--rc-red-bg)";
}

function qualityBorder(n: number): string {
  if (n >= 70) return "var(--rc-green-border)";
  if (n >= 50) return "var(--rc-amber-border)";
  return "var(--rc-red-border)";
}

function qualityLabel(n: number): string {
  if (n >= 80) return "strong";
  if (n >= 70) return "good";
  if (n >= 50) return "weak";
  return "poor";
}

function sourceVerdictLabel(score: number): string {
  if (score >= 70) return "Strong · good signal";
  if (score >= 50) return "Mid-tier · room to grow";
  return "Thin · undersells";
}

function sevClass(sev: string) {
  if (sev === "critical") return { color: "var(--rc-red)", bg: "var(--rc-red-bg)", border: "var(--rc-red-border)" };
  if (sev === "major")    return { color: "var(--rc-amber)", bg: "var(--rc-amber-bg)", border: "var(--rc-amber-border)" };
  return { color: "var(--rc-hint)", bg: "var(--rc-bg)", border: "var(--rc-border)" };
}

function impactFromSeverity(sev: string): string {
  if (sev === "critical") return "+18 pts";
  if (sev === "major")    return "+12 pts";
  return "+6 pts";
}

const SENIORITY_LEVELS = ["Junior", "Mid", "Senior", "Staff", "Lead", "Principal"];

function seniorityIndex(label: string): number {
  const l = label.toLowerCase();
  if (l.includes("principal")) return 5;
  if (l.includes("lead"))      return 4;
  if (l.includes("staff"))     return 3;
  if (l.includes("senior"))    return 2;
  if (l.includes("mid"))       return 1;
  return 0;
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

// ── Shared style constants ────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
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

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  result: AnalysisResult;
  analysisId: number | null;
  cvBlobUrl: string | null;
  liBlobUrl?: string | null;
  mlBlobUrl?: string | null;
  onReset: () => void;
  onExportMd: () => void;
  onShare?: () => void;
  isSharing: boolean;
  userPlan?: "free" | "shortlisted" | "hired";
  reconstructedCv?: string | null;
  liText?: string | null;
  isRewriting?: boolean;
  onRewrite?: () => void;
  email?: string | null;
  accessToken?: string | null;
};

// ── Main component ────────────────────────────────────────────────────────────

export function CvAuditResult({
  result,
  analysisId: _analysisId,
  cvBlobUrl,
  liBlobUrl = null,
  mlBlobUrl = null,
  onReset,
  onExportMd,
  onShare,
  isSharing,
  userPlan = "free",
  reconstructedCv = null,
  liText = null,
  isRewriting = false,
  onRewrite,
  email = null,
  accessToken = null,
}: Props) {
  const [barGo, setBarGo] = useState(false);
  const [activeSection, setActiveSection] = useState("s1");
  const [now] = useState(() => new Date());
  const [proTier, setProTier] = useState<"shortlisted" | "hired">("hired");
  const hasShortlisted = userPlan === "shortlisted" || userPlan === "hired";
  const hasHired = userPlan === "hired";
  const mainRef = useRef<HTMLElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const [qualityGo, setQualityGo] = useState(false);

  // Trigger bar animations on mount
  useEffect(() => {
    const t = setTimeout(() => setBarGo(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Quality bars animate on scroll into view
  useEffect(() => {
    const el = qualityRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setQualityGo(true); },
      { threshold: 0.2, root: mainRef.current },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // TOC scroll-spy
  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;
    const sections = container.querySelectorAll<HTMLElement>("section[data-ca-sec]");
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.getAttribute("data-ca-sec") ?? "s1");
        });
      },
      { root: container, rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    mainRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const seniority = result.projected_profile?.seniority ?? "Senior";
  const candidateName = `${seniority} Engineer`;
  const sourceCount = [
    result.audit.cv.score != null,
    result.audit.github.score != null,
    result.audit.linkedin.score != null,
  ].filter(Boolean).length;

  // Merged issues from all sources
  const mergedIssues: Array<Issue & { source: "cv" | "github" | "linkedin" }> = [
    ...result.audit.cv.issues.map((i) => ({ ...i, source: "cv" as const })),
    ...result.audit.github.issues.map((i) => ({ ...i, source: "github" as const })),
    ...result.audit.linkedin.issues.map((i) => ({ ...i, source: "linkedin" as const })),
  ].sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  // §01 one move
  const topIssue = mergedIssues.find((i) => i.severity === "critical") ?? mergedIssues[0];

  // §02 quality
  const q = result.cv_quality;
  const qualityDims = q ? [
    { key: "clarity",     label: "Clarity",      score: q.clarity,     desc: result.cv_quality_notes?.clarity     ?? "How easy it is to read your CV in 6 seconds." },
    { key: "impact",      label: "Impact",        score: q.impact,      desc: result.cv_quality_notes?.impact      ?? "Whether your bullets show outcomes, not just tasks." },
    { key: "hard_skills", label: "Hard skills",   score: q.hard_skills, desc: result.cv_quality_notes?.hard_skills ?? "Depth and breadth of technical competences shown." },
    { key: "soft_skills", label: "Soft skills",   score: q.soft_skills, desc: result.cv_quality_notes?.soft_skills ?? "Leadership, collaboration and communication signals." },
    { key: "consistency", label: "Consistency",   score: q.consistency, desc: result.cv_quality_notes?.consistency ?? "Dates, titles and formats align across your CV." },
    { key: "ats_format",  label: "ATS format",    score: q.ats_format,  desc: result.cv_quality_notes?.ats_format  ?? "Structural compatibility with Applicant Tracking Systems." },
  ] : [];
  const weakDimsCount = qualityDims.filter((d) => d.score < 70).length;

  // §03 seniority
  const detectedIdx = seniorityIndex(result.seniority_analysis.detected);
  const expectedIdx = seniorityIndex(result.seniority_analysis.expected);
  const hasGap = detectedIdx !== expectedIdx;

  // §04 cross-source
  const inconsistencies = result.cross_profile_inconsistencies ?? [];

  // §06 before/after
  const tone = result.cv_tone;
  const hasRewrites = tone.detected !== "active" && (tone.rewrites?.length ?? 0) > 0;

  // §07 roadmap
  type RoadItem = { id: string; title: string; detail?: string; time: string; pts: string; now: boolean };
  const roadmap: RoadItem[] = [];
  mergedIssues.slice(0, 4).forEach((issue, i) => {
    roadmap.push({
      id: `issue${i}`,
      title: issue.fix?.summary ?? issue.what,
      detail: issue.fix?.steps?.[0],
      time: issue.fix?.time_required ?? (issue.severity === "critical" ? "45m" : issue.severity === "major" ? "30m" : "15m"),
      pts: impactFromSeverity(issue.severity),
      now: i === 0,
    });
  });
  if (hasGap && roadmap.length < 4) {
    roadmap.push({
      id: "seniority",
      title: "Align seniority signals in your language",
      detail: "Use leadership verbs and quantify scope to match how you actually operate.",
      time: "10m",
      pts: "+12 pts",
      now: false,
    });
  }

  // TOC badges
  const tocBadge = (content: string, variant: "crit" | "warn" | "ok" | "lock") => {
    const styles: Record<string, React.CSSProperties> = {
      crit: { color: "var(--rc-red)",   background: "var(--rc-red-bg)",         border: "1px solid var(--rc-red-border)" },
      warn: { color: "var(--rc-amber)", background: "var(--rc-amber-bg)",       border: "1px solid var(--rc-amber-border)" },
      ok:   { color: "var(--rc-green)", background: "var(--rc-green-bg)",       border: "1px solid var(--rc-green-border)" },
      lock: { color: "var(--rc-hint)",  background: "var(--rc-surface-hero)",   border: "1px solid var(--rc-border)" },
    };
    return (
      <span style={{ ...MONO, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, letterSpacing: "0.06em", whiteSpace: "nowrap" as const, ...styles[variant] }}>
        {content}
      </span>
    );
  };

  const tocItem = (id: string, num: string, label: string, badge: React.ReactNode, locked = false) => {
    const isActive = activeSection === id;
    return (
      <a
        href={`#${id}`}
        onClick={(e) => { e.preventDefault(); scrollTo(id); }}
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
          <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, background: "var(--rc-red)", borderRadius: 99 }} />
        )}
        <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.08em", color: isActive ? "var(--rc-red)" : "var(--rc-hint)", fontWeight: 700 }}>{num}</span>
        <span style={{ ...SANS, fontSize: 13, fontWeight: isActive ? 600 : 500, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {badge}
      </a>
    );
  };

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

  // §02 quality badge
  const qualityBadgeContent = weakDimsCount === 0 ? "ok" : `${weakDimsCount} weak`;
  const qualityBadgeVariant: "ok" | "warn" | "crit" = weakDimsCount === 0 ? "ok" : weakDimsCount >= 3 ? "crit" : "warn";

  // §03 seniority badge
  const senioritBadgeContent = hasGap ? `±${Math.abs(detectedIdx - expectedIdx)}` : "aligned";
  const seniorityBadgeVariant: "ok" | "warn" = hasGap ? "warn" : "ok";

  // §04 cross-source badge
  const crossCritical = inconsistencies.some((i) => i.severity === "critical");
  const crossBadgeVariant: "crit" | "warn" | "ok" = inconsistencies.length === 0 ? "ok" : crossCritical ? "crit" : "warn";

  // §05 all findings badge
  const allFindingsCritical = mergedIssues.some((i) => i.severity === "critical");
  const allFindingsBadgeVariant: "crit" | "warn" = allFindingsCritical ? "crit" : "warn";

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--rc-bg)", color: "var(--rc-text)", fontFamily: "var(--font-sans)" }}>

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
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={24} height={24} />
            <span style={{ ...SANS, fontWeight: 600, fontSize: 14, color: "var(--rc-text)" }}>RejectCheck</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 18, borderLeft: "1px solid var(--rc-border)" }}>
            <span style={{ ...MONO, fontSize: 11, letterSpacing: "0.08em", color: "var(--rc-hint)", textTransform: "uppercase" }}>CV Audit ·</span>
            <span style={{ ...SANS, fontSize: 13, fontWeight: 600, color: "var(--rc-text)" }}>
              {candidateName}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={iconBtn()} onClick={onExportMd}>↓ .md</button>
          {onShare && (
            <button style={iconBtn()} onClick={onShare} disabled={isSharing}>
              {isSharing ? "…" : "↗ Share"}
            </button>
          )}
          <button style={iconBtn(false, true)} onClick={onReset}>↻ New</button>
        </div>
      </nav>

      {/* ── Split layout ── */}
      <AnalysisShell
        cvBlobUrl={cvBlobUrl}
        liBlobUrl={liBlobUrl}
        mlBlobUrl={mlBlobUrl}
        reconstructedCv={reconstructedCv}
        liText={liText}
        renderRight={() => (
          <div className="rc-toc-grid" style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "240px 1fr", maxWidth: 1380, margin: "0 auto", width: "100%" }}>

            {/* ── TOC sidebar ── */}
        <aside className="rc-toc" style={{
          height: "100%",
          padding: "48px 16px 0 24px",
          borderRight: "1px solid var(--rc-border)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}>
          <div style={{ ...EYEBROW, marginBottom: 14, paddingLeft: 8 }}>Audit</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {tocItem("s1", "01", "The one move", null)}
            {tocItem("s2", "02", "Quality breakdown", null)}
            {tocItem("s3", "03", "Seniority gap", null)}
            {(inconsistencies.length > 0 || (result.timeline_entries?.length ?? 0) > 0) && tocItem("s4", "04", "Timeline", null)}
            {tocItem("s5", "05", "All findings", null)}
            {hasRewrites && tocItem("s6", "06", "Before / after", null)}

            <div style={{ margin: "12px 8px 6px", height: 1, background: "var(--rc-border)" }} />
            <div style={{ ...EYEBROW, fontSize: 9, padding: "6px 12px 4px" }}>Action</div>
            {tocItem("s7", "07", "Roadmap", null)}

            <div style={{ margin: "12px 8px 6px", height: 1, background: "var(--rc-border)" }} />
            <div style={{ ...EYEBROW, fontSize: 9, padding: "6px 12px 4px" }}>Premium</div>
            {tocItem(hasShortlisted ? "s8"  : "s-pro", "08", "CV rewrite",   hasShortlisted ? tocBadge("✓", "ok") : tocBadge("◆", "lock"), !hasShortlisted)}
            {tocItem(hasShortlisted ? "s9"  : "s-pro", "09", "Cover letter", hasShortlisted ? tocBadge("✓", "ok") : tocBadge("◆", "lock"), !hasShortlisted)}
            {tocItem(hasHired       ? "s10" : "s-pro", "10", "AI mock",      hasHired       ? tocBadge("✓", "ok") : tocBadge("◆", "lock"), !hasHired)}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main ref={mainRef} style={{ padding: "48px 64px 120px", overflowY: "auto", height: "100%", scrollbarWidth: "none" }}>

          {/* ── Rejection-risk hero (unified RiskMeter) — risk = 100 − CV quality ── */}
          {q && (
            <div style={{ paddingBottom: 40, borderBottom: "1px solid var(--rc-border)", marginBottom: 48 }}>
              <RiskMeter value={100 - q.overall} mode="cv" />
            </div>
          )}

          {/* ── Hero ── */}
          <div style={{ paddingBottom: 48, borderBottom: "1px solid var(--rc-text)", marginBottom: 56 }}>

            {/* Meta strip */}
            <div style={{
              display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
              ...MONO, fontSize: 11, letterSpacing: "0.08em",
              color: "var(--rc-hint)", textTransform: "uppercase",
              marginBottom: 32,
            }}>
              <span style={{ padding: "2px 8px", border: "1px solid var(--rc-border)", borderRadius: 4, ...MONO, fontSize: 9, letterSpacing: "0.1em", color: "var(--rc-hint)", background: "var(--rc-surface)" }}>
                CV audit · no role attached
              </span>
              <span style={{ width: 1, height: 12, background: "var(--rc-border)", display: "inline-block" }} />
              <span><strong style={{ color: "var(--rc-text)", fontWeight: 600 }}>{candidateName}</strong></span>
              <span style={{ width: 1, height: 12, background: "var(--rc-border)", display: "inline-block" }} />
              <span>{sourceCount} source{sourceCount !== 1 ? "s" : ""}</span>
              <span style={{ width: 1, height: 12, background: "var(--rc-border)", display: "inline-block" }} />
              <span style={{ color: "var(--rc-red)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--rc-red)", display: "inline-block", animation: "pulse 2s infinite" }} />
                Audited {timeAgo(now)}
              </span>
            </div>

            {/* Source cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>

              {/* CV card — always shown */}
              {(() => {
                const score = result.audit.cv.score;
                const col = qualityColor(score);
                const bg = qualityBg(score);
                const bdr = qualityBorder(score);
                return (
                  <div style={{ background: "var(--rc-surface)", border: `1px solid ${bdr}`, borderRadius: 6, padding: "20px 22px", borderLeft: `3px solid ${col}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: col }}>
                        <rect x="4" y="2" width="16" height="20" rx="1" /><path d="M8 6h8M8 10h8M8 14h5" />
                      </svg>
                      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>CV</span>
                    </div>
                    <div style={{ ...MONO, fontWeight: 700, fontSize: 48, letterSpacing: "-0.04em", color: col, lineHeight: 1, marginBottom: 6 }}>{score}</div>
                    <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.06em", color: col, marginBottom: 12 }}>{sourceVerdictLabel(score)}</div>
                    <div style={{ height: 4, background: "var(--rc-border)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{ height: "100%", background: col, borderRadius: 99, width: barGo ? `${score}%` : "0%", transition: "width 1.4s cubic-bezier(0.25,0.46,0.45,0.94)" }} />
                    </div>
                    <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.06em", color: "var(--rc-hint)" }}>
                      Issues · {result.audit.cv.issues.length} | Strengths · {result.audit.cv.strengths?.length ?? 0}
                    </div>
                  </div>
                );
              })()}

              {/* GitHub card */}
              {result.audit.github.score !== null && (() => {
                const score = result.audit.github.score!;
                const col = qualityColor(score);
                const bg = qualityBg(score);
                const bdr = qualityBorder(score);
                void bg;
                return (
                  <div style={{ background: "var(--rc-surface)", border: `1px solid ${bdr}`, borderRadius: 6, padding: "20px 22px", borderLeft: `3px solid ${col}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Github size={14} style={{ color: col }} />
                      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>GitHub</span>
                    </div>
                    <div style={{ ...MONO, fontWeight: 700, fontSize: 48, letterSpacing: "-0.04em", color: col, lineHeight: 1, marginBottom: 6 }}>{score}</div>
                    <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.06em", color: col, marginBottom: 12 }}>{sourceVerdictLabel(score)}</div>
                    <div style={{ height: 4, background: "var(--rc-border)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{ height: "100%", background: col, borderRadius: 99, width: barGo ? `${score}%` : "0%", transition: "width 1.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.2s" }} />
                    </div>
                    <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.06em", color: "var(--rc-hint)" }}>
                      Issues · {result.audit.github.issues.length} | Strengths · {result.audit.github.strengths?.length ?? 0}
                    </div>
                  </div>
                );
              })()}

              {/* LinkedIn card */}
              {result.audit.linkedin.score !== null && (() => {
                const score = result.audit.linkedin.score!;
                const col = qualityColor(score);
                const bg = qualityBg(score);
                const bdr = qualityBorder(score);
                void bg;
                return (
                  <div style={{ background: "var(--rc-surface)", border: `1px solid ${bdr}`, borderRadius: 6, padding: "20px 22px", borderLeft: `3px solid ${col}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Linkedin size={14} style={{ color: col }} />
                      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>LinkedIn</span>
                    </div>
                    <div style={{ ...MONO, fontWeight: 700, fontSize: 48, letterSpacing: "-0.04em", color: col, lineHeight: 1, marginBottom: 6 }}>{score}</div>
                    <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.06em", color: col, marginBottom: 12 }}>{sourceVerdictLabel(score)}</div>
                    <div style={{ height: 4, background: "var(--rc-border)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{ height: "100%", background: col, borderRadius: 99, width: barGo ? `${score}%` : "0%", transition: "width 1.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.4s" }} />
                    </div>
                    <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.06em", color: "var(--rc-hint)" }}>
                      Issues · {result.audit.linkedin.issues.length} | Strengths · {result.audit.linkedin.strengths?.length ?? 0}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Verdict sentence */}
            {result.projected_profile?.narrative && (
              <p style={{ ...{ fontFamily: "var(--font-display)" }, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(18px,2vw,26px)", lineHeight: 1.4, letterSpacing: "-0.015em", color: "var(--rc-text)", margin: 0, maxWidth: 680 }}>
                {result.projected_profile.narrative}
              </p>
            )}
          </div>

          {/* ── §01 The one move ── */}
          <section data-ca-sec="s1" id="s1" style={{ paddingBottom: 64, paddingTop: 0 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 01 · The one move that matters</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                If you do <span style={DISPLAY_ITALIC}>one thing</span>, do this.
              </h2>
            </div>

            {topIssue ? (
              <div style={{
                background: "var(--rc-red-bg)",
                border: "1px solid var(--rc-red-border)",
                borderLeft: "3px solid var(--rc-red)",
                borderRadius: "0 6px 6px 0",
                padding: "24px 28px",
              }}>
                <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--rc-red)", display: "inline-block", animation: "pulse 2s infinite" }} />
                  Highest-impact fix
                </div>
                <p style={{ ...SANS, fontSize: 16, lineHeight: 1.55, color: "var(--rc-text)", margin: 0 }}>
                  <Md>{topIssue.what}</Md>
                </p>
                {topIssue.why && (
                  <p style={{ ...SANS, fontSize: 14, lineHeight: 1.5, color: "var(--rc-muted)", margin: "8px 0 0" }}>
                    {topIssue.why}
                  </p>
                )}
                <div style={{
                  marginTop: 14, paddingTop: 12,
                  borderTop: "1px solid rgba(201,58,57,0.12)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-muted)" }}>Estimated quality impact</span>
                  <span style={{ ...MONO, fontWeight: 700, fontSize: 22, color: "var(--rc-red)", letterSpacing: "-0.02em" }}>{impactFromSeverity(topIssue.severity)}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "24px 28px", ...SANS, fontSize: 14, color: "var(--rc-muted)" }}>
                No critical issues found — your CV is in good shape.
              </div>
            )}
          </section>

          {/* ── §02 Quality breakdown ── */}
          {q && (
            <section data-ca-sec="s2" id="s2" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
              <div style={{ marginBottom: 32 }}>
                <div style={SEC_NUM}><SecNumLine />§ 02 · Quality breakdown</div>
                <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                  Six dimensions of how your CV <span style={DISPLAY_ITALIC}>reads</span>.
                </h2>
              </div>

              <div ref={qualityRef} style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid var(--rc-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>Overall · {q.overall}/100</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 2, height: 12, background: "rgba(0,0,0,0.2)" }} />
                    <span style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)", letterSpacing: "0.08em" }}>70 = threshold</span>
                  </div>
                </div>
                <div style={{ padding: "10px 28px 28px" }}>
                  {qualityDims.map((dim, idx) => {
                    const col = qualityColor(dim.score);
                    return (
                      <div key={dim.key} style={{ padding: "16px 0", display: "grid", gridTemplateColumns: "140px 1fr 80px", gap: 18, alignItems: "center", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)" }}>
                        <div>
                          <div style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)" }}>{dim.label}</div>
                          <div style={{ ...MONO, fontSize: 10, color: "var(--rc-hint)", marginTop: 3, letterSpacing: "0.04em" }}>{dim.desc}</div>
                        </div>
                        <div style={{ position: "relative", height: 12, background: "var(--rc-surface-hero)", borderRadius: 99 }}>
                          <div style={{
                            position: "absolute", left: 0, top: 0, height: "100%",
                            background: col,
                            borderRadius: 99,
                            width: qualityGo ? `${dim.score}%` : "0%",
                            transition: `width 1.2s cubic-bezier(0.25,0.46,0.45,0.94) ${idx * 0.08}s`,
                          }} />
                          {/* 70% threshold line */}
                          <div style={{
                            position: "absolute", top: -4, bottom: -4, width: 1.5,
                            background: "rgba(0,0,0,0.18)",
                            left: "70%",
                            transform: "translateX(-0.75px)",
                          }} />
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ ...MONO, fontSize: 16, fontWeight: 700, color: col, letterSpacing: "-0.02em" }}>{dim.score}</span>
                          <span style={{ display: "block", ...MONO, fontSize: 9, color: "var(--rc-hint)", letterSpacing: "0.06em", marginTop: 2 }}>{qualityLabel(dim.score)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── §03 Seniority gap ── */}
          <section data-ca-sec="s3" id="s3" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 03 · Seniority gap</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                {hasGap
                  ? <>Your writing <span style={DISPLAY_ITALIC}>reads below</span> your titles.</>
                  : <>Seniority signals <span style={DISPLAY_ITALIC}>are aligned.</span></>
                }
              </h2>
            </div>

            {/* Seniority track */}
            <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "28px 32px", marginBottom: 24 }}>
              <div style={{ position: "relative", marginBottom: 40 }}>
                {/* Rail */}
                <div style={{ height: 3, background: "var(--rc-border)", borderRadius: 99, position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, height: "100%",
                    background: "var(--rc-red)",
                    borderRadius: 99,
                    width: `${(Math.max(detectedIdx, expectedIdx) / 5) * 100}%`,
                    opacity: 0.28,
                    transition: "width 1.2s ease",
                  }} />
                </div>

                {/* Dots */}
                <div style={{ position: "absolute", top: -8, left: 0, right: 0, display: "flex", justifyContent: "space-between" }}>
                  {SENIORITY_LEVELS.map((level, i) => {
                    const isDetected = i === detectedIdx;
                    const isExpected = i === expectedIdx;
                    const dotColor = isDetected ? "var(--rc-amber)" : isExpected ? "var(--rc-red)" : "var(--rc-border)";
                    const dotSize = (isDetected || isExpected) ? 18 : 10;
                    return (
                      <div key={level} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                        <div style={{
                          width: dotSize, height: dotSize,
                          borderRadius: 99,
                          background: dotColor,
                          border: `2px solid ${(isDetected || isExpected) ? dotColor : "var(--rc-border)"}`,
                          marginBottom: 8,
                          flexShrink: 0,
                        }} />
                        <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.08em", color: (isDetected || isExpected) ? "var(--rc-text)" : "var(--rc-hint)", fontWeight: (isDetected || isExpected) ? 700 : 400, whiteSpace: "nowrap" as const }}>
                          {level}
                        </span>
                        {isDetected && (
                          <span style={{ ...MONO, fontSize: 8, color: "var(--rc-amber)", letterSpacing: "0.06em", marginTop: 2, whiteSpace: "nowrap" as const }}>Titles say</span>
                        )}
                        {isExpected && !isDetected && (
                          <span style={{ ...MONO, fontSize: 8, color: "var(--rc-red)", letterSpacing: "0.06em", marginTop: 2, whiteSpace: "nowrap" as const }}>Writing reads</span>
                        )}
                        {isExpected && isDetected && (
                          <span style={{ ...MONO, fontSize: 8, color: "var(--rc-green)", letterSpacing: "0.06em", marginTop: 2, whiteSpace: "nowrap" as const }}>Aligned</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gap insight */}
            {result.seniority_analysis.gap && (
              <div style={{ ...SANS, fontSize: 15, lineHeight: 1.65, color: "var(--rc-text)", marginBottom: 16 }}>
                <Md>{result.seniority_analysis.gap}</Md>
              </div>
            )}

            {/* Strength quote */}
            {result.seniority_analysis.strength && (
              <blockquote style={{
                margin: 0,
                padding: "14px 20px",
                borderLeft: "3px solid var(--rc-amber)",
                background: "var(--rc-amber-bg)",
                ...SANS, fontSize: 14, fontStyle: "italic", lineHeight: 1.6, color: "var(--rc-muted)",
              }}>
                <Md>{result.seniority_analysis.strength}</Md>
              </blockquote>
            )}
          </section>

          {/* ── §04 Timeline & consistency ── */}
          {(inconsistencies.length > 0 || (result.timeline_entries?.length ?? 0) > 0) && (
            <section data-ca-sec="s4" id="s4" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
              <div style={{ marginBottom: 32 }}>
                <div style={SEC_NUM}><SecNumLine />§ 04 · Timeline &amp; consistency</div>
                <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                  {result.timeline_entries?.length
                    ? <>{result.timeline_entries.length} entr{result.timeline_entries.length !== 1 ? "ies" : "y"} <span style={DISPLAY_ITALIC}>across your profiles.</span></>
                    : inconsistencies.length === 1
                      ? <>One <span style={DISPLAY_ITALIC}>inconsistency</span> across your profiles.</>
                      : <>{inconsistencies.length} <span style={DISPLAY_ITALIC}>inconsistencies</span> across your profiles.</>
                  }
                </h2>
              </div>

              {result.timeline_entries && result.timeline_entries.length > 0 && (() => {
                const markers = inconsistencies
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

              {inconsistencies.length > 0 && (
                <div style={{ marginTop: result.timeline_entries?.length ? 48 : 0 }}>
                  {result.timeline_entries?.length ? (
                    <h3 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(18px,2vw,24px)", letterSpacing: "-0.02em", margin: "0 0 20px", lineHeight: 1.1 }}>
                      {inconsistencies.length} inconsistenc{inconsistencies.length !== 1 ? "ies" : "y"} <span style={DISPLAY_ITALIC}>across profiles.</span>
                    </h3>
                  ) : null}
                  {inconsistencies.map((inc, idx) => {
                    const sev = sevClass(inc.severity);
                    const impactStr = inc.severity === "critical" ? "−12" : inc.severity === "major" ? "−6" : "−3";
                    return (
                      <div key={idx} style={{ padding: "20px 0", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)", display: "grid", gridTemplateColumns: "80px 1fr 48px", gap: 16, alignItems: "start" }}>
                        <span style={{ ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, alignSelf: "start", justifySelf: "center" }}>
                          <span style={{ width: 4, height: 4, borderRadius: 99, background: "currentColor", display: "inline-block" }} />{inc.severity}
                        </span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)" }}>
                              {inc.field.replace(/_/g, " ")}
                            </span>
                            {inc.sources.map((src) => (
                              <span key={src} style={{ ...MONO, fontSize: 9, padding: "1px 6px", borderRadius: 4, border: "1px solid var(--rc-border)", color: "var(--rc-hint)", background: "var(--rc-surface)" }}>{src}</span>
                            ))}
                          </div>
                          <div style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)", marginBottom: 4 }}><Md>{inc.description}</Md></div>
                          {inc.recruiter_perception && (
                            <p style={{ ...SANS, fontSize: 13, fontStyle: "italic", lineHeight: 1.55, color: "var(--rc-muted)", margin: 0 }}>&ldquo;<Md>{inc.recruiter_perception}</Md>&rdquo;</p>
                          )}
                        </div>
                        <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.06em", color: "var(--rc-hint)", textTransform: "uppercase", textAlign: "right", whiteSpace: "nowrap" as const }}>
                          Impact
                          <strong style={{ display: "block", ...MONO, fontWeight: 700, fontSize: 16, color: "var(--rc-red)", marginTop: 2 }}>{impactStr}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── §05 All findings ── */}
          <section data-ca-sec="s5" id="s5" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 05 · Findings · merged by severity</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                All signals, <span style={DISPLAY_ITALIC}>ranked</span>.
              </h2>
            </div>

            {mergedIssues.length === 0 ? (
              <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "24px 28px", ...SANS, fontSize: 14, color: "var(--rc-muted)" }}>
                No issues found across all sources.
              </div>
            ) : (
              mergedIssues.map((issue, idx) => {
                const sev = sevClass(issue.severity);
                return (
                  <div key={idx} style={{ padding: "22px 0", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)", display: "grid", gridTemplateColumns: "32px 1fr", gap: 18 }}>
                    <div style={{ ...MONO, fontSize: 13, color: "var(--rc-hint)", letterSpacing: "0.04em", paddingTop: 3, fontWeight: 700 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 4, height: 4, borderRadius: 99, background: "currentColor", display: "inline-block" }} />{issue.severity}
                        </span>
                        <span style={{ ...MONO, fontSize: 9, padding: "2px 7px", borderRadius: 4, border: "1px solid var(--rc-border)", color: "var(--rc-hint)", background: "var(--rc-surface)" }}>
                          {issue.source}
                        </span>
                        <span style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {issue.category}
                        </span>
                      </div>
                      <div style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)", marginBottom: 4 }}>
                        <Md>{issue.what}</Md>
                      </div>
                      {issue.why && (
                        <p style={{ ...SANS, fontSize: 13, lineHeight: 1.55, color: "var(--rc-muted)", margin: 0 }}><Md>{issue.why}</Md></p>
                      )}
                      {(issue.fix as { example?: { before?: string } } | undefined)?.example?.before && (
                        <div style={{ marginTop: 8, ...MONO, fontSize: 11, color: "var(--rc-hint)", fontStyle: "italic", borderLeft: "2px solid var(--rc-border)", paddingLeft: 10 }}>
                          {(issue.fix as { example: { before: string } }).example.before}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* ── §06 Before / after ── */}
          {hasRewrites && (
            <section data-ca-sec="s6" id="s6" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
              <div style={{ marginBottom: 32 }}>
                <div style={SEC_NUM}><SecNumLine />§ 06 · Before / after</div>
                <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                  Rewrites <span style={DISPLAY_ITALIC}>your bullets are asking for</span>.
                </h2>
              </div>

              {(tone.rewrites ?? []).map((rewrite, idx) => (
                <div key={idx} style={{ padding: "20px 0", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)", display: "grid", gridTemplateColumns: "40px 1fr", gap: 16 }}>
                  <div style={{ ...MONO, fontSize: 11, color: "var(--rc-hint)", fontWeight: 700, paddingTop: 3 }}>B {idx + 1}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {tone.examples[idx] && (
                      <div style={{ ...SANS, fontSize: 14, fontStyle: "italic", color: "var(--rc-muted)", textDecoration: "line-through", lineHeight: 1.5 }}>
                        − {tone.examples[idx]}
                      </div>
                    )}
                    <div style={{ ...SANS, fontSize: 14, color: "var(--rc-green)", lineHeight: 1.5, fontWeight: 500 }}>
                      + {rewrite}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* ── §07 Roadmap ── */}
          <section data-ca-sec="s7" id="s7" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={SEC_NUM}><SecNumLine />§ 07 · Roadmap</div>
              <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
                In <span style={DISPLAY_ITALIC}>a few hours</span>, your profile reads one band up.
              </h2>
              <p style={{ ...SANS, fontSize: 15, lineHeight: 1.6, color: "var(--rc-muted)", marginTop: 14, maxWidth: 580 }}>
                Prioritized order. Each step shows estimated time and quality gain.
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
                  <div style={{ ...SANS, fontSize: 14, color: "var(--rc-text)", fontWeight: item.now ? 600 : 400 }}><Md>{item.title}</Md></div>
                  {item.detail && <div style={{ ...SANS, fontSize: 12, color: "var(--rc-hint)", marginTop: 3 }}><Md>{item.detail}</Md></div>}
                </div>
                <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: item.now ? "var(--rc-red)" : "var(--rc-hint)", textAlign: "right" }}>
                  {item.time}
                  <span style={{ display: "block", color: "var(--rc-green)", fontWeight: 700 }}>{item.pts}</span>
                </div>
              </div>
            ))}
          </section>

          {/* ── §08 CV rewrite (shortlisted) ── */}
          {hasShortlisted && (
            <section data-ca-sec="s8" id="s8" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
              <div style={{ ...SEC_NUM, marginBottom: 32 }}><SecNumLine />§ 08 · CV rewrite</div>
              <ImproveTab
                reconstructedCv={reconstructedCv}
                isLoading={isRewriting}
                isPremium={true}
                hasAnalysisId={!!_analysisId}
                onRewrite={onRewrite ?? (() => {})}
              />
            </section>
          )}

          {/* ── §09 Cover letter (shortlisted) ── */}
          {hasShortlisted && (
            <section data-ca-sec="s9" id="s9" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
              <div style={{ ...SEC_NUM, marginBottom: 32 }}><SecNumLine />§ 09 · Cover letter</div>
              <CoverLetterTab
                analysisId={_analysisId}
                isPremium={true}
                company={null}
                candidateName={null}
                savedCoverLetter={null}
              />
            </section>
          )}

          {/* ── §10 AI mock interview (hired) ── */}
          {AI_INTERVIEW_ENABLED && hasHired && (
            <section data-ca-sec="s10" id="s10" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
              <div style={{ ...SEC_NUM, marginBottom: 32 }}><SecNumLine />§ 10 · AI mock interview</div>
              <InterviewTab
                isPremium={true}
                analysisId={_analysisId}
                email={email}
                accessToken={accessToken}
                defaultInterviewId={null}
              />
            </section>
          )}

          {/* ── §08–09 Paywall (free / partial) ── */}
          {userPlan !== "hired" && (!hasShortlisted || AI_INTERVIEW_ENABLED) && (() => {
            type ProFeature = { num: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>; name: string; desc: string };
            const shortlistedFeatures: ProFeature[] = [
              { num: "§ 08", Icon: PenLine, name: "CV rewrite",   desc: "Paste-ready bullets. Metrics added, passive voice killed, seniority signals injected." },
              { num: "§ 09", Icon: Mail,    name: "Cover letter", desc: "Generated from your audit. Addresses your strengths head-on — ready to tailor for any role." },
            ];
            const hiredFeature: ProFeature | null = AI_INTERVIEW_ENABLED ? { num: "§ 10", Icon: Mic, name: "AI mock interview", desc: "Voice, in your browser. 10 minutes. Harder on your weak spots — scored debrief at the end." } : null;
            const isExpanded = hasShortlisted ? true : proTier === "hired";

            const featureCard = (f: ProFeature, borderRight = false, borderTop = false) => (
              <div key={f.num} style={{
                padding: "48px 32px",
                borderRight: borderRight ? "1px solid rgba(255,255,255,0.07)" : "none",
                borderTop: borderTop ? "1px solid rgba(255,255,255,0.07)" : "none",
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
              <section data-ca-sec="s-pro" id="s-pro" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>

                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 32 }}>
                  <div>
                    <div style={SEC_NUM}><SecNumLine />{hasShortlisted ? "§ 10 · Hired feature" : AI_INTERVIEW_ENABLED ? "§ 08–10 · Pro features" : "§ 08–09 · Pro features"}</div>
                    <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(26px,2.8vw,36px)", letterSpacing: "-0.025em", margin: 0, lineHeight: 1.05 }}>
                      Your audit is done. <span style={DISPLAY_ITALIC}>Now fix it.</span>
                    </h2>
                  </div>
                  {!hasShortlisted && AI_INTERVIEW_ENABLED && (
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
                  <div className="rc-col2-m" style={{ background: "#111", display: "grid", gridTemplateColumns: hasShortlisted ? "1fr" : "repeat(2, 1fr)" }}>
                    {!hasShortlisted && (
                      <>
                        {featureCard(shortlistedFeatures[0], true)}
                        {featureCard(shortlistedFeatures[1], false)}
                        <div style={{ gridColumn: "span 2", display: "grid", gridTemplateRows: isExpanded ? "1fr" : "0fr", transition: "grid-template-rows 380ms ease" }}>
                          <div style={{ overflow: "hidden" }}>
                            <div style={{ opacity: isExpanded ? 1 : 0, transform: isExpanded ? "translateY(0)" : "translateY(-8px)", transition: "opacity 280ms ease 80ms, transform 280ms ease 80ms" }}>
                              {hiredFeature && featureCard(hiredFeature, false, true)}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {hasShortlisted && hiredFeature && featureCard(hiredFeature, false)}
                  </div>
                  <div style={{ background: "var(--rc-bg)", borderTop: "1px solid var(--rc-border)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                    <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.06em", color: "var(--rc-hint)" }}>Cancel anytime · no commitment</span>
                    <Link href="/pricing" style={{ ...SANS, fontWeight: 700, fontSize: 14, padding: "12px 26px", borderRadius: 6, background: "linear-gradient(180deg, var(--rc-red), #A32A29)", color: "#fff", boxShadow: "0 8px 28px rgba(201,58,57,0.32)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "-0.01em", flexShrink: 0 }}>
                      {hasShortlisted || proTier === "hired" ? "Get Hired →" : "Get Shortlisted →"}
                    </Link>
                  </div>
                </div>
              </section>
            );
          })()}

        </main>

          </div>
        )}
      />
    </div>
  );
}
