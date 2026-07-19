"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { AnalysisResult, Fix } from "./types";
import { Eyebrow, Mono } from "./resultAtoms";
import { ParsedCvDisclosure } from "./ParsedCvDisclosure";
import { RiskMeter } from "./RiskMeter";
import { AnalysisShell, type HighlightMap, type HighlightEntry } from "./AnalysisShell";
import { RadarChart } from "./RadarChart";
import { SignalsTab } from "./tabs/SignalsTab";
import { ConsistencyTab } from "./tabs/ConsistencyTab";
import { RoadmapTab } from "./tabs/RoadmapTab";
import { BridgeTab } from "./tabs/BridgeTab";
import { ProjectTab } from "./tabs/ProjectTab";
import { NegotiationTab } from "./tabs/NegotiationTab";
import { RewriteTab } from "./tabs/RewriteTab";
import { ProjectRecommendationSkeleton } from "./skeletons/ProjectRecommendationSkeleton";
import { TechnicalAnalysisSkeleton } from "./skeletons/TechnicalAnalysisSkeleton";
import { RescanPanel } from "./rescan/RescanPanel";
import { AI_INTERVIEW_ENABLED } from "../../lib/features";
import { InterviewTab } from "./tabs/InterviewTab";
import { useLanguage } from "../../context/language";
import { useProfile } from "../../lib/queries";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AnalysisLayoutProps = {
  result: AnalysisResult;
  analysisId: number | null;
  cvBlobUrl: string | null;
  liBlobUrl?: string | null;
  mlBlobUrl?: string | null;
  deepStatus: "pending" | "ready";
  isPremium: boolean;
  userPlan?: "free" | "shortlisted" | "hired";
  /** This specific analysis was unlocked via a one-time purchase (€2.99). */
  premiumUnlocked?: boolean;
  /** Starts the one-time "unlock the rewrite for this CV" checkout. */
  onUnlockRewrite?: () => void;
  isUnlocking?: boolean;
  onReset: () => void;
  reconstructedCv?: string | null;
  liText?: string | null;
  coverLetterText?: string | null;
  isRewriting?: boolean;
  onRewrite?: () => void;
  email?: string | null;
  accessToken?: string | null;
  completedSteps?: number[];
  cvTextFormatted?: string | null;
  /**
   * Public shared view: same narrative report, but no owner-only affordances
   * (re-scan panel) and no source-document panel (shares never carry the CV).
   * The premium sections fall back to their free-plan read-only rendering.
   */
  readOnly?: boolean;
};

type DocTab = "cv" | "cover" | "linkedin";

// ── Helpers ───────────────────────────────────────────────────────────────────

const R_SM = "4px";
const R_MD = "8px";
const SHADOW_XS = "0 1px 2px rgba(26,22,18,0.06)";
const SHADOW_SM = "0 1px 3px rgba(26,22,18,0.08), 0 1px 2px rgba(26,22,18,0.04)";

const sevColor = (s: string) =>
  s === "critical" ? "var(--rc-red)" : s === "major" ? "var(--rc-amber)" : "var(--rc-hint)";

const goodColor = (v: number | null, th: number) =>
  v === null ? "var(--rc-hint)" : v >= th ? "var(--rc-green)" : v >= th - 15 ? "var(--rc-amber)" : "var(--rc-red)";

// ── Inline markdown — renders **bold** ────────────────────────────────────────

function MD({ children }: { children: string }) {
  const parts = children.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700, color: "inherit" }}>{p}</strong> : <span key={i}>{p}</span>
      )}
    </>
  );
}

// ── Copy-to-clipboard button ──────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: done ? "var(--rc-green)" : "var(--rc-text)", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_SM, padding: "4px 10px", cursor: "pointer" }}
    >
      {done ? "✓" : label}
    </button>
  );
}

// ── Insertion renderer — underlines the keyword and [placeholders] ────────────

function escReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderInsertionAfter(after: string, keyword: string): React.ReactNode {
  const re = new RegExp(`(\\[[^\\]]+\\]|${escReg(keyword)})`, "gi");
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(after)) !== null) {
    if (m.index === re.lastIndex) { re.lastIndex++; continue; }
    if (m.index > last) out.push(after.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("[")) {
      out.push(<span key={i++} style={{ background: "rgba(0,0,0,0.06)", border: "1px dashed var(--rc-border)", borderRadius: 4, padding: "0 4px", fontWeight: 700, color: "var(--rc-muted)" }}>{tok}</span>);
    } else {
      out.push(<mark key={i++} style={{ background: "color-mix(in srgb, var(--rc-green) 18%, transparent)", color: "var(--rc-green)", fontWeight: 700, padding: "0 3px", borderRadius: 3 }}>{tok}</mark>);
    }
    last = m.index + tok.length;
  }
  if (last < after.length) out.push(after.slice(last));
  return out;
}

// ── Atoms ─────────────────────────────────────────────────────────────────────

// Eyebrow + Mono are imported from ./resultAtoms (shared with AnalysisShell).

function SevTag({ sev }: { sev: string }) {
  const c = sevColor(sev);
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 7px", borderRadius: R_SM, color: c, background: `color-mix(in srgb, ${c} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 30%, transparent)` }}>
      {sev}
    </span>
  );
}

function Sheet({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, boxShadow: SHADOW_XS, ...style }}>
      {children}
    </div>
  );
}

function SecHead({ eyebrow, eyebrowColor, title, sub, meta, rule }: {
  eyebrow?: string; eyebrowColor?: string; title: React.ReactNode; sub?: string;
  meta?: React.ReactNode; rule?: boolean;
}) {
  return (
    <div style={{ marginBottom: rule ? 24 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <Eyebrow color={eyebrowColor ?? "var(--rc-red)"} style={{ display: "block", marginBottom: 10, letterSpacing: "0.16em" }}>
              {eyebrow}
            </Eyebrow>
          )}
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--rc-text)", lineHeight: 1.18 }}>
            {title}
          </div>
        </div>
        {meta && <div style={{ flexShrink: 0 }}>{meta}</div>}
      </div>
      {sub && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.6, color: "var(--rc-muted)", marginTop: 9, maxWidth: 600 }}>
          <MD>{sub}</MD>
        </div>
      )}
      {rule && <div style={{ height: 1, background: "var(--rc-border)", marginTop: 18 }} />}
    </div>
  );
}

function StatBarRow({ label, value, threshold }: { label: string; value: number | null; threshold: number }) {
  const c = goodColor(value, threshold);
  const pass = value !== null && value >= threshold;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--rc-hint)", minWidth: 68, flexShrink: 1, wordBreak: "break-word" }}>{label}</span>
      <Mono style={{ fontSize: 12, fontWeight: 700, color: c, width: 22, textAlign: "right", flexShrink: 0 }}>{value ?? "-"}</Mono>
      <div style={{ flex: 1, minWidth: 40, position: "relative", height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 9999 }}>
        {value !== null && <div style={{ position: "absolute", inset: 0, right: "auto", width: `${value}%`, background: c, borderRadius: 9999 }} />}
        <div style={{ position: "absolute", left: `${threshold}%`, top: -3, width: 2, height: 12, background: "rgba(0,0,0,0.28)", transform: "translateX(-1px)" }} />
      </div>
      <Mono style={{ fontSize: 11, fontWeight: 700, color: c, width: 12, textAlign: "center", flexShrink: 0 }}>
        {pass ? "✓" : value === null ? "-" : "✗"}
      </Mono>
    </div>
  );
}

// ── FixBlock ───────────────────────────────────────────────────────────────────

function FixBlock({ fix }: { fix: Fix | null | undefined }) {
  const { t } = useLanguage();
  if (!fix) return null;
  return (
    <div style={{ marginTop: 18, paddingLeft: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 11 }}>
        <Eyebrow color="var(--rc-green)">{t.analysisLayout.diffRow.label}</Eyebrow>
        <Mono style={{ fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>◷ {fix.time_required}</Mono>
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "var(--rc-text)", lineHeight: 1.5, marginBottom: 14 }}>
        <MD>{fix.summary}</MD>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {fix.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 11, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.55 }}>
            <Mono style={{ color: "var(--rc-green)", flexShrink: 0, fontWeight: 700, fontSize: 12 }}>{i + 1}</Mono>
            <MD>{s}</MD>
          </div>
        ))}
      </div>
      {fix.example && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <Mono style={{ fontSize: 9, fontWeight: 700, color: "var(--rc-red)", textTransform: "uppercase", letterSpacing: "0.1em", width: 38, flexShrink: 0 }}>{t.analysisLayout.diffRow.was}</Mono>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontStyle: "italic", color: "var(--rc-hint)", lineHeight: 1.5, textDecoration: "line-through", textDecorationColor: "rgba(201,58,57,0.45)" }}>
              {fix.example.before}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <Mono style={{ fontSize: 9, fontWeight: 700, color: "var(--rc-green)", textTransform: "uppercase", letterSpacing: "0.1em", width: 38, flexShrink: 0 }}>{t.analysisLayout.diffRow.now}</Mono>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--rc-text)", lineHeight: 1.5 }}>{fix.example.after}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── IssueItem ─────────────────────────────────────────────────────────────────

function IssueItem({ issue, last, onHighlight }: {
  issue: { severity: string; category: string; what: string; why: string; fix?: Fix | null };
  last: boolean;
  onHighlight?: () => void;
}) {
  const c = sevColor(issue.severity);
  return (
    <div
      onClick={onHighlight}
      style={{ padding: "24px 28px", borderBottom: last ? "none" : "1px solid var(--rc-border)", cursor: onHighlight ? "pointer" : undefined, transition: "background 0.1s" }}
      onMouseEnter={e => { if (onHighlight) (e.currentTarget as HTMLElement).style.background = "var(--rc-surface-raised)"; }}
      onMouseLeave={e => { if (onHighlight) (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
        <span style={{ width: 3, height: 13, background: c, flexShrink: 0 }} />
        <SevTag sev={issue.severity} />
        <Mono style={{ fontSize: 11, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.14em" }}>{issue.category}</Mono>
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 600, color: "var(--rc-text)", lineHeight: 1.35, marginBottom: 10, letterSpacing: "-0.01em" }}>
        <MD>{issue.what}</MD>
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.65 }}>
        <MD>{issue.why}</MD>
      </div>
      <FixBlock fix={issue.fix} />
    </div>
  );
}

// ── Compare card ──────────────────────────────────────────────────────────────

function Compare({ leftLabel, left, rightLabel, right, rightColor }: {
  leftLabel: string; left: string; rightLabel: string; right: string; rightColor: string;
}) {
  return (
    <div style={{ position: "relative", display: "flex", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, boxShadow: SHADOW_XS, overflow: "hidden" }}>
      <div style={{ flex: 1, padding: "22px 26px" }}>
        <Eyebrow style={{ display: "block", marginBottom: 9 }}>{leftLabel}</Eyebrow>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 600, color: "var(--rc-text)", letterSpacing: "-0.015em" }}>{left}</div>
      </div>
      <div style={{ width: 1, background: "var(--rc-border)" }} />
      <div style={{ flex: 1, padding: "22px 26px 22px 40px" }}>
        <Eyebrow color={rightColor} style={{ display: "block", marginBottom: 9 }}>{rightLabel}</Eyebrow>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 600, color: rightColor, letterSpacing: "-0.015em" }}>{right}</div>
      </div>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: 9999, background: "var(--rc-surface)", border: "1px solid var(--rc-border)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="var(--rc-hint)" strokeWidth="1.4">
          <path d="M1 6h11m0 0l-4-4m4 4l-4 4" />
        </svg>
      </div>
    </div>
  );
}

function StrengthPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", padding: "5px 10px", borderRadius: R_SM, color: "var(--rc-green)", background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)" }}>
      <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--rc-green)", flexShrink: 0 }} />{children}
    </span>
  );
}

function CountPill({ n, sev }: { n: number; sev: string }) {
  if (!n) return null;
  const c = sevColor(sev);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", padding: "5px 10px", borderRadius: R_SM, color: c, background: `color-mix(in srgb, ${c} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 25%, transparent)` }}>
      <span style={{ width: 6, height: 6, borderRadius: 9999, background: c }} />{n} {sev}
    </span>
  );
}

// ── Match tab body ─────────────────────────────────────────────────────────────

function MatchBody({ result, deepStatus, checkedKeywords, toggleKeyword }: {
  result: AnalysisResult;
  deepStatus: string;
  checkedKeywords: Set<string>;
  toggleKeyword: (kw: string) => void;
}) {
  const { t } = useLanguage();
  const ta = result.technical_analysis;
  const ats = result.ats_simulation;
  const atsCritical = ats?.critical_missing_keywords ?? [];
  const sim = ats ? Math.min(100, ats.score + [...checkedKeywords].reduce((s, kw) => s + (atsCritical.find((k) => k.keyword === kw)?.score_impact ?? 0), 0)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* 01 — Skill coverage */}
      <section>
        <SecHead
          title={t.analysisLayout.match.title}
          sub={t.analysisLayout.match.subtitle}
          rule
        />
        {!ta || deepStatus !== "ready" ? (
          <TechnicalAnalysisSkeleton />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Radar + priority */}
            <Sheet style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--rc-border)", background: "var(--rc-surface-hero)" }}>
                <Eyebrow>{t.analysisLayout.match.chartLabel}</Eyebrow>
              </div>
              {/* Radar full-width (fluid) */}
              <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--rc-border)" }}>
                <RadarChart
                  axes={ta.skills.map((s) => ({ label: s.name, score: s.current, expected: s.expected, evidence: s.evidence }))}
                  scale={10}
                  fluid
                  legend={{ current: t.analysisLayout.match.legendYou, expected: t.analysisLayout.match.legendTarget }}
                />
              </div>
              {/* Priority list below */}
              <div style={{ padding: "18px 28px" }}>
                <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 12 }}>{t.analysisLayout.match.priorityTitle}</Eyebrow>
                <ol className="rc-col2-m" style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {(ta.skill_priority ?? []).map((name, i) => {
                    const sk = ta.skills.find((s) => s.name === name);
                    const gap = sk ? sk.expected - sk.current : 0;
                    const ok = gap <= 0;
                    const rankColors = ["var(--rc-red)", "var(--rc-amber)", "var(--rc-muted)", "var(--rc-hint)", "var(--rc-hint)", "var(--rc-hint)"];
                    const rank = rankColors[i] ?? "var(--rc-hint)";
                    return (
                      <li key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 11px", borderRadius: R_SM, background: "var(--rc-bg)", border: "1px solid var(--rc-border)", minWidth: 0 }}>
                        <Mono style={{ fontSize: 11, fontWeight: 700, width: 16, textAlign: "center", color: rank, flexShrink: 0 }}>{i + 1}</Mono>
                        <Mono style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--rc-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</Mono>
                        <Mono style={{ fontSize: 10, color: ok ? "var(--rc-green)" : "var(--rc-hint)", flexShrink: 0 }}>{ok ? "✓" : `-${gap}`}</Mono>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Sheet>

            {/* Strategic recommendation */}
            <Sheet style={{ padding: "20px 26px" }}>
              <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 12, letterSpacing: "0.18em" }}>{t.analysisLayout.match.recommendationTitle}</Eyebrow>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontStyle: "italic", color: "var(--rc-text)", lineHeight: 1.6 }}>
                <MD>{ta.recommendation}</MD>
              </div>
            </Sheet>

            {/* Per-skill evidence cards */}
            <div className="rc-col2-m" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {ta.skills.map((s) => {
                const gap = s.expected - s.current; const ok = gap <= 0;
                return (
                  <Sheet key={s.name} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Mono style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--rc-text)" }}>{s.name}</Mono>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: R_SM, color: ok ? "var(--rc-green)" : "var(--rc-amber)", background: ok ? "var(--rc-green-bg)" : "var(--rc-amber-bg)", border: `1px solid ${ok ? "var(--rc-green-border)" : "var(--rc-amber-border)"}` }}>
                        {ok ? t.technicalRadar.targetMet : t.technicalRadar.gap}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <Mono style={{ fontSize: 21, fontWeight: 700, color: "var(--rc-text)" }}>
                        {s.current}<span style={{ fontSize: 12, color: "var(--rc-hint)", fontWeight: 400 }}> / {s.expected}</span>
                      </Mono>
                      {!ok && <Mono style={{ fontSize: 11, fontWeight: 700, color: "var(--rc-amber)", textTransform: "uppercase" }}>-{gap} pts</Mono>}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-muted)", lineHeight: 1.55, borderTop: "1px solid var(--rc-border)", paddingTop: 12 }}>
                      <MD>{s.evidence}</MD>
                    </div>
                  </Sheet>
                );
              })}
            </div>

            {/* Market context + seniority signals */}
            {(ta.market_context || ta.seniority_signals?.length) && (
              <div className="rc-col2-m" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {ta.market_context && (
                  <Sheet style={{ padding: "18px 20px" }}>
                    <Eyebrow color="var(--rc-amber)" style={{ display: "block", marginBottom: 10 }}>{t.analysisLayout.match.marketContext}</Eyebrow>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-text)", lineHeight: 1.6 }}><MD>{ta.market_context}</MD></div>
                  </Sheet>
                )}
                {ta.seniority_signals?.length ? (
                  <Sheet style={{ padding: "18px 20px" }}>
                    <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 10 }}>{t.analysisLayout.match.senioritySignals}</Eyebrow>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      {ta.seniority_signals.map((sig, i) => (
                        <li key={i} style={{ display: "flex", gap: 8, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-muted)", lineHeight: 1.55 }}>
                          <span style={{ color: "var(--rc-red)", flexShrink: 0 }}>•</span><MD>{sig}</MD>
                        </li>
                      ))}
                    </ul>
                  </Sheet>
                ) : null}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 02 — ATS filter */}
      {ats && (
        <section>
          <SecHead
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                {ats.would_pass ? t.analysisLayout.ats.passLikely : t.analysisLayout.ats.rejectionLikely}
                <div className="relative group" style={{ display: "inline-flex" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 99, border: "1px solid var(--rc-border)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--rc-hint)", cursor: "default", flexShrink: 0 }}>?</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150" style={{ width: 220, background: "var(--rc-text)", color: "var(--rc-bg)", fontFamily: "var(--font-sans)", fontSize: 11, lineHeight: 1.55, padding: "9px 12px", borderRadius: 6, zIndex: 50 }}>
                    {t.analysisLayout.ats.cutoffTooltip}
                  </div>
                </div>
              </span>
            }
            sub={ats.reason}
            rule
            meta={
              <div style={{ textAlign: "right" }}>
                <Mono style={{ fontSize: 38, fontWeight: 500, color: "var(--rc-text)", lineHeight: 1 }}>
                  {ats.score}<span style={{ fontSize: 15, color: "var(--rc-hint)" }}>/100</span>
                </Mono>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: ats.score >= ats.threshold ? "var(--rc-green)" : "var(--rc-red)", marginTop: 3 }}>
                  {ats.score >= ats.threshold
                    ? `+${ats.score - ats.threshold} ${t.analysisLayout.ats.ptsAboveCutoff}`
                    : `${ats.threshold - ats.score} ${t.analysisLayout.ats.ptsBelowCutoff}`}
                </div>
              </div>
            }
          />
          {/* ATS meter */}
          <div style={{ padding: "22px 24px", border: "1px solid var(--rc-border)", borderRadius: R_MD, background: "var(--rc-surface)", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", marginBottom: 12 }}>
              <span>0</span><span>100</span>
            </div>
            <div style={{ position: "relative", height: 12, background: "rgba(0,0,0,0.06)", borderRadius: 9999 }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${ats.score}%`, borderRadius: 9999, background: sim >= ats.threshold ? "var(--rc-green)" : "var(--rc-amber)", transition: "width .3s" }} />
              {sim > ats.score && (
                <div style={{ position: "absolute", top: 0, left: `${ats.score}%`, height: "100%", width: `${sim - ats.score}%`, background: "color-mix(in srgb, var(--rc-green) 45%, transparent)", transition: "width .3s" }} />
              )}
              <div style={{ position: "absolute", left: `${ats.threshold}%`, top: -6, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 3, height: 24, background: "var(--rc-amber)" }} />
                <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--rc-amber)", whiteSpace: "nowrap", background: "var(--rc-amber-bg)", border: "1px solid var(--rc-amber-border)", padding: "2px 6px" }}>
                  {t.analysisLayout.ats.cutoffLabel.replace("{threshold}", String(ats.threshold))}
                </div>
              </div>
            </div>
            {sim !== ats.score && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <span style={{ color: "var(--rc-hint)" }}>{t.analysisLayout.ats.current} {ats.score}</span>
                <span style={{ color: sim >= ats.threshold ? "var(--rc-green)" : "var(--rc-amber)", fontWeight: 700 }}>
                  {t.analysisLayout.ats.simulated} {sim}{sim >= ats.threshold ? ` · ${t.analysisLayout.ats.wouldPass}` : ` · ${t.analysisLayout.ats.stillBelow.replace("{n}", String(ats.threshold - sim))}`}
                </span>
              </div>
            )}
          </div>

          {/* Keyword simulator */}
          {atsCritical.length > 0 && (() => {
            const kws = atsCritical;
            const req = [...kws].filter((k) => k.required).sort((a, b) => b.score_impact - a.score_impact);
            const pref = [...kws].filter((k) => !k.required).sort((a, b) => b.score_impact - a.score_impact);
            const maxImpact = Math.max(8, ...kws.map((k) => k.score_impact));
            const KwRow = ({ k, accent }: { k: typeof kws[0]; accent: string }) => (
              <div onClick={() => toggleKeyword(k.keyword)} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                <div style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, borderRadius: R_SM, border: `1px solid ${checkedKeywords.has(k.keyword) ? "var(--rc-green)" : "var(--rc-border)"}`, background: checkedKeywords.has(k.keyword) ? "var(--rc-green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {checkedKeywords.has(k.keyword) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: checkedKeywords.has(k.keyword) ? "var(--rc-hint)" : "var(--rc-text)", textDecoration: checkedKeywords.has(k.keyword) ? "line-through" : "none" }}>{k.keyword}</span>
                    <Mono style={{ fontSize: 10, color: accent, background: `color-mix(in srgb, ${accent} 10%, transparent)`, borderRadius: R_SM, padding: "2px 6px" }}>{k.jd_frequency}× in JD</Mono>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 9999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(k.score_impact / maxImpact) * 100}%`, borderRadius: 9999, background: checkedKeywords.has(k.keyword) ? "color-mix(in srgb, var(--rc-green) 40%, transparent)" : "var(--rc-green)" }} />
                    </div>
                    <Mono style={{ fontSize: 11, color: "var(--rc-green)", flexShrink: 0, fontWeight: 600 }}>+{k.score_impact} pts</Mono>
                  </div>
                  {k.sections_missing.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
                      {(k.sections_missing ?? []).map((sec: string) => <Mono key={sec} style={{ fontSize: 10, color: "var(--rc-hint)", background: "var(--rc-bg)", border: "1px solid var(--rc-border)", borderRadius: R_SM, padding: "2px 6px" }}>{sec} ✗</Mono>)}
                    </div>
                  )}
                  {k.insertion && (
                    <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 10, border: "1px solid var(--rc-border)", borderRadius: R_SM, overflow: "hidden", cursor: "default" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 11px", background: "var(--rc-surface-hero)", borderBottom: "1px solid var(--rc-border)" }}>
                        <Eyebrow style={{ fontSize: 9 }}>{k.insertion.before ? t.analysisLayout.ats.insertionAmend : t.analysisLayout.ats.insertionNew}</Eyebrow>
                        <CopyBtn text={k.insertion.after} label={t.analysisLayout.ats.copy} />
                      </div>
                      {k.insertion.before && (
                        <div style={{ padding: "9px 12px", fontSize: 12.5, color: "var(--rc-hint)", textDecoration: "line-through" }}>{k.insertion.before}</div>
                      )}
                      <div style={{ padding: "9px 12px", fontSize: 12.5, color: "var(--rc-text)", background: "var(--rc-green-bg)", borderTop: k.insertion.before ? "1px dashed var(--rc-green-border)" : "none" }}>{renderInsertionAfter(k.insertion.after, k.keyword)}</div>
                    </div>
                  )}
                </div>
              </div>
            );
            return (
              <div>
                <SecHead eyebrow={t.analysisLayout.ats.simulatorTitle} title={t.analysisLayout.ats.simulatorSubtitle} sub={t.analysisLayout.ats.simulatorDesc} />
                <Sheet style={{ overflow: "hidden" }}>
                  {req.length > 0 && (
                    <div style={{ padding: "22px 24px", borderBottom: pref.length > 0 ? "1px solid var(--rc-border)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--rc-red)" }} />
                        <Eyebrow color="var(--rc-red)" style={{ fontSize: 11 }}>{t.analysisLayout.ats.required}</Eyebrow>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        {req.map((k) => <KwRow key={k.keyword} k={k} accent="var(--rc-red)" />)}
                      </div>
                    </div>
                  )}
                  {pref.length > 0 && (
                    <div style={{ padding: "22px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--rc-amber)" }} />
                        <Eyebrow color="var(--rc-amber)" style={{ fontSize: 11 }}>{t.analysisLayout.ats.preferred}</Eyebrow>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        {pref.map((k) => <KwRow key={k.keyword} k={k} accent="var(--rc-amber)" />)}
                      </div>
                    </div>
                  )}
                </Sheet>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}

// ── CV tab body ────────────────────────────────────────────────────────────────

const ACTION_RE = /^(led|built|designed|developed|created|implemented|launched|delivered|managed|architected|reduced|increased|improved|drove|owned|scaled|deployed|migrated|refactored|optimized|shipped|cut|grew)/i;
const METRIC_RE = /\d+%?|[€$][\d,.]+|[\d,]+\s*(users|customers|ms|req|requests|engineers|teams?)/i;
const phraseGood = (p: string) => METRIC_RE.test(p) || ACTION_RE.test(p.trim());

// ── §04 Cover-letter audit (P1) ───────────────────────────────────────────────

function CoverLetterBody({ cl }: { cl: NonNullable<AnalysisResult["audit"]["cover_letter"]> }) {
  const { t } = useLanguage();
  const clx = t.analysisLayout.coverLetter;
  const score = cl.score ?? 0;
  const scoreColor = score >= 70 ? "var(--rc-green)" : score >= 50 ? "var(--rc-amber)" : "var(--rc-red)";
  const counts = {
    critical: cl.issues.filter((i) => i.severity === "critical").length,
    major: cl.issues.filter((i) => i.severity === "major").length,
    minor: cl.issues.filter((i) => i.severity === "minor").length,
  };
  const labelStyle: React.CSSProperties = { fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 2 };
  return (
    <section>
      <SecHead title={clx.title} sub={clx.subtitle}
        meta={
          <div style={{ textAlign: "right" }}>
            <Eyebrow style={{ display: "block", marginBottom: 6 }}>{clx.scoreLabel}</Eyebrow>
            <Mono style={{ fontSize: 30, fontWeight: 500, color: scoreColor, lineHeight: 1 }}>
              {score}<span style={{ fontSize: 15, color: "var(--rc-hint)" }}>/100</span>
            </Mono>
            <div style={{ width: 124, height: 5, background: "rgba(0,0,0,0.07)", borderRadius: 9999, marginTop: 8, marginLeft: "auto" }}>
              <div style={{ height: "100%", width: `${score}%`, background: scoreColor, borderRadius: 9999 }} />
            </div>
          </div>
        } rule />
      {(cl.issues.length > 0 || (cl.strengths ?? []).length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Mono style={labelStyle}>{t.analysisLayout.report.severity}</Mono>
            <CountPill n={counts.critical} sev="critical" /><CountPill n={counts.major} sev="major" /><CountPill n={counts.minor} sev="minor" />
          </div>
          {(cl.strengths ?? []).length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Mono style={labelStyle}>{t.analysisLayout.report.inYourFavour}</Mono>
              {(cl.strengths ?? []).map((s) => <StrengthPill key={s}>{s}</StrengthPill>)}
            </div>
          )}
        </div>
      )}
      {cl.issues.length > 0 ? (
        <Sheet>
          {cl.issues.map((it, i) => <IssueItem key={i} issue={it} last={i === cl.issues.length - 1} />)}
        </Sheet>
      ) : (
        <Sheet><div style={{ padding: "20px 24px", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--rc-muted)" }}>{clx.clean}</div></Sheet>
      )}
    </section>
  );
}

function CVBody({ result, onIssueClick }: { result: AnalysisResult; onIssueClick?: () => void }) {
  const { t } = useLanguage();
  const { seniority_analysis: sen, cv_tone: tone, correlation, audit, hidden_red_flags: flags } = result;
  const cv = audit.cv;
  const jd = audit.jd_match;
  const counts = {
    critical: cv.issues.filter((i) => i.severity === "critical").length,
    major: cv.issues.filter((i) => i.severity === "major").length,
    minor: cv.issues.filter((i) => i.severity === "minor").length,
  };
  const toneColor = tone.detected === "active" ? "var(--rc-green)" : tone.detected === "passive" ? "var(--rc-red)" : "var(--rc-amber)";
  const healthColor = cv.score >= 80 ? "var(--rc-green)" : cv.score >= 60 ? "var(--rc-amber)" : "var(--rc-red)";
  const found = jd?.required_skills.filter((s) => s.found).length ?? 0;
  const total = jd?.required_skills.length ?? 0;
  // P1: match_strength (exact/partial/missing). Fall back to `found` on rows
  // stored before P1 so the grid still renders + sorts.
  const strengthOf = (s: { found: boolean; match_strength?: "exact" | "partial" | "missing" }): "exact" | "partial" | "missing" =>
    s.match_strength ?? (s.found ? "exact" : "missing");
  const STRENGTH_RANK = { missing: 0, partial: 1, exact: 2 } as const;
  const sortedSkills = jd
    ? [...jd.required_skills].sort((a, b) => STRENGTH_RANK[strengthOf(a)] - STRENGTH_RANK[strengthOf(b)])
    : [];
  const hasStrength = jd?.required_skills.some((s) => s.match_strength) ?? false;
  const strengthCounts = {
    exact: jd?.required_skills.filter((s) => strengthOf(s) === "exact").length ?? 0,
    partial: jd?.required_skills.filter((s) => strengthOf(s) === "partial").length ?? 0,
    missing: jd?.required_skills.filter((s) => strengthOf(s) === "missing").length ?? 0,
  };
  const STRENGTH_STYLE = {
    exact: { c: "var(--rc-green)", bg: "var(--rc-green-bg)", bd: "var(--rc-green-border)" },
    partial: { c: "var(--rc-amber)", bg: "var(--rc-amber-bg)", bd: "var(--rc-amber-border)" },
    missing: { c: "var(--rc-red)", bg: "var(--rc-red-bg)", bd: "var(--rc-red-border)" },
  } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>

      {/* 01 — Positioning */}
      <section>
        <SecHead title={t.analysisLayout.cv.positioningTitle}
          sub={t.analysisLayout.report.positioningSub} rule />

        {/* a · Seniority */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
          <Eyebrow style={{ color: "var(--rc-hint)", whiteSpace: "nowrap" }}>{t.analysisLayout.cv.seniorityLabel}</Eyebrow>
          {sen.strength && <StrengthPill>{t.analysisLayout.report.strengthPrefix} <MD>{sen.strength}</MD></StrengthPill>}
        </div>
        <Compare leftLabel={t.analysisLayout.cv.roleExpects} left={sen.expected} rightLabel={t.analysisLayout.cv.cvSignals} right={sen.detected} rightColor="var(--rc-red)" />
        <div style={{ marginTop: 18 }}>
          <Eyebrow style={{ display: "block", marginBottom: 7 }}>{t.analysisLayout.cv.whatSignals}</Eyebrow>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontStyle: "italic", color: "var(--rc-muted)", lineHeight: 1.65, maxWidth: 640 }}>
            <MD>{sen.gap}</MD>
          </div>
        </div>
        <FixBlock fix={sen.fix as Fix} />

        <div style={{ height: 1, background: "var(--rc-border)", margin: "32px 0" }} />

        {/* b · Tone */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 16, flexWrap: "wrap" }}>
          <Eyebrow style={{ color: "var(--rc-hint)", whiteSpace: "nowrap" }}>{t.analysisLayout.report.toneLabel}</Eyebrow>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 11px", borderRadius: R_SM, color: toneColor, background: `color-mix(in srgb, ${toneColor} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${toneColor} 25%, transparent)` }}>
            {tone.detected} {t.analysisLayout.cv.toneVoice}
          </span>
        </div>
        <Sheet style={{ padding: "4px 22px" }}>
          {(tone.examples ?? []).map((ex, i) => {
            const good = phraseGood(ex);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 0", borderBottom: i === (tone.examples?.length ?? 0) - 1 ? "none" : "1px solid var(--rc-border)" }}>
                <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 9999, background: good ? "var(--rc-green-bg)" : "var(--rc-red-bg)", color: good ? "var(--rc-green)" : "var(--rc-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{good ? "✓" : "✗"}</span>
                <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 15, fontStyle: "italic", color: good ? "var(--rc-muted)" : "var(--rc-text)", lineHeight: 1.5 }}>"{ex}"</span>
                <Mono style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: good ? "var(--rc-green)" : "var(--rc-red)" }}>{good ? t.analysisLayout.cv.strong : t.analysisLayout.cv.weak}</Mono>
              </div>
            );
          })}
        </Sheet>
        <FixBlock fix={tone.fix as Fix} />

        {/* Correlation callout */}
        {correlation?.detected && (
          <div style={{ marginTop: 28, display: "flex", gap: 14, padding: "18px 20px", borderRadius: R_MD, background: "var(--rc-amber-bg)", border: "1px solid var(--rc-amber-border)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--rc-amber)" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M6 10l4-4M5.5 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M10.5 11.5l-1 1a2.5 2.5 0 01-3.5-3.5l1-1" />
            </svg>
            <div>
              <Eyebrow color="var(--rc-amber)" style={{ display: "block", marginBottom: 7 }}>{t.analysisLayout.report.patternDetected}</Eyebrow>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.65, maxWidth: 620 }}>
                <MD>{correlation.explanation}</MD>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 02 — Forensic audit */}
      <section>
        <SecHead title={t.analysisLayout.report.auditTitle}
          sub={`${cv.issues.length} ${t.analysisLayout.report.auditSub}`}
          meta={
            <div style={{ textAlign: "right" }}>
              <Eyebrow style={{ display: "block", marginBottom: 6 }}>{t.analysisLayout.cv.auditHealthLabel}</Eyebrow>
              <Mono style={{ fontSize: 30, fontWeight: 500, color: healthColor, lineHeight: 1 }}>
                {cv.score}<span style={{ fontSize: 15, color: "var(--rc-hint)" }}>/100</span>
              </Mono>
              <div style={{ width: 124, height: 5, background: "rgba(0,0,0,0.07)", borderRadius: 9999, marginTop: 8, marginLeft: "auto" }}>
                <div style={{ height: "100%", width: `${cv.score}%`, background: healthColor, borderRadius: 9999 }} />
              </div>
            </div>
          } rule />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Mono style={{ fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 2 }}>{t.analysisLayout.report.severity}</Mono>
            <CountPill n={counts.critical} sev="critical" /><CountPill n={counts.major} sev="major" /><CountPill n={counts.minor} sev="minor" />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Mono style={{ fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 2 }}>{t.analysisLayout.report.inYourFavour}</Mono>
            {(cv.strengths ?? []).map((s) => <StrengthPill key={s}>{s}</StrengthPill>)}
          </div>
        </div>
        <Sheet>
          {cv.issues.map((it, i) => <IssueItem key={i} issue={it} last={i === cv.issues.length - 1} onHighlight={onIssueClick} />)}
        </Sheet>
      </section>

      {/* 03 — Recruiter intuition */}
      {flags?.length > 0 && (
        <section>
          <SecHead title={t.analysisLayout.flags.redFlagsTitle}
            sub={`${flags.length} ${t.analysisLayout.report.redFlagsSub}`} rule />
          <Sheet>
            {flags.map((f, i) => (
              <div key={i}
                onClick={() => onIssueClick?.()}
                style={{ padding: "26px 28px", borderBottom: i === flags.length - 1 ? "none" : "1px solid var(--rc-border)", cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--rc-surface-raised)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                  <span style={{ width: 3, height: 13, background: "var(--rc-red)", flexShrink: 0 }} />
                  <Eyebrow color="var(--rc-red)">{t.analysisLayout.flags.redFlag}</Eyebrow>
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 600, color: "var(--rc-text)", marginBottom: 12, lineHeight: 1.35, letterSpacing: "-0.01em" }}><MD>{f.flag}</MD></div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Mono style={{ fontSize: 9, color: "var(--rc-amber)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0, width: 88, paddingTop: 3 }}>{t.analysisLayout.flags.recruiterSees}</Mono>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.65 }}><MD>{f.perception}</MD></div>
                </div>
                <FixBlock fix={f.fix as Fix} />
              </div>
            ))}
          </Sheet>
        </section>
      )}

      {/* 04 — Requirements */}
      {jd && sortedSkills.length > 0 && (
        <section>
          <SecHead title={t.analysisLayout.flags.requirementsTitle}
            sub={t.analysisLayout.report.requirementsSub}
            meta={
              hasStrength ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Mono style={{ fontSize: 12, fontWeight: 700, color: "var(--rc-green)" }}>{strengthCounts.exact} {t.analysisLayout.flags.matchExact}</Mono>
                  <span style={{ color: "var(--rc-border)" }}>·</span>
                  <Mono style={{ fontSize: 12, fontWeight: 700, color: "var(--rc-amber)" }}>{strengthCounts.partial} {t.analysisLayout.flags.matchPartial}</Mono>
                  <span style={{ color: "var(--rc-border)" }}>·</span>
                  <Mono style={{ fontSize: 12, fontWeight: 700, color: "var(--rc-red)" }}>{strengthCounts.missing} {t.analysisLayout.flags.matchMissing}</Mono>
                </div>
              ) : (
                <div style={{ textAlign: "right" }}>
                  <Mono style={{ fontSize: 26, fontWeight: 600, color: found === total ? "var(--rc-green)" : found >= total * 0.7 ? "var(--rc-amber)" : "var(--rc-red)" }}>
                    {found}<span style={{ color: "var(--rc-hint)", fontWeight: 400 }}>/{total}</span>
                  </Mono>
                  <Eyebrow style={{ display: "block", marginTop: 2 }}>{t.analysisLayout.flags.matched}</Eyebrow>
                </div>
              )
            } rule />
          <Sheet style={{ padding: "8px 28px 24px" }}>
            <div className="rc-col2-m" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 36 }}>
              {sortedSkills.map((s, i) => {
                const st = strengthOf(s);
                const sc = STRENGTH_STYLE[st];
                return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "13px 0", borderBottom: "1px solid var(--rc-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: st === "missing" ? "var(--rc-muted)" : "var(--rc-text)", minWidth: 0 }}>{s.skill}</span>
                    {hasStrength ? (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: sc.c, background: sc.bg, border: `1px solid ${sc.bd}`, borderRadius: R_SM, padding: "2px 7px", flexShrink: 0 }}>{{ exact: t.analysisLayout.flags.matchExact, partial: t.analysisLayout.flags.matchPartial, missing: t.analysisLayout.flags.matchMissing }[st]}</span>
                    ) : (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: s.found ? "var(--rc-green)" : "var(--rc-red)", flexShrink: 0 }}>{s.found ? "✓" : "✗"}</span>
                    )}
                  </div>
                  {s.evidence && (
                    <Mono style={{ fontSize: 10, color: "var(--rc-hint)", lineHeight: 1.5 }}>{s.evidence}</Mono>
                  )}
                </div>
                );
              })}
            </div>
            {jd.experience_gap && (
              <div style={{ marginTop: 20, paddingLeft: 18 }}>
                <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 7 }}>{t.analysisLayout.flags.experienceGap}</Eyebrow>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontStyle: "italic", color: "var(--rc-muted)", lineHeight: 1.6 }}><MD>{jd.experience_gap}</MD></div>
              </div>
            )}
          </Sheet>
        </section>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // function words
  'the','a','an','is','in','of','for','to','and','or','on','at','by','with','from','that','this',
  'your','you','not','no','it','its','are','has','have','been','be','as','was','were','will',
  'would','could','should','may','can','do','does','did','any','all','more','less','very',
  'also','just','such','both','each','than','then','them','they','their','there','these',
  'those','when','what','where','which','while','about','above','after','before','between',
  // issue-description verbs / meta words
  'missing','lacks','lack','absent','shows','listed','found','appear','appears','include',
  'includes','using','through','based','suggest','suggests','consider','avoid','ensure',
  'rather','instead','however','although','although','therefore','because',
  // common job/CV nouns that appear in issue descriptions but not meaningfully in the CV text
  'engineer','developer','manager','designer','analyst','senior','junior','intern','director',
  'leader','officer','architect','consultant','specialist','coordinator','engineer',
  'experience','skills','position','company','sector','industry','field','domain',
  'profile','summary','section','title','role','level','years','team','work','job',
  'resume','linkedin','github','portfolio','career','background','history',
]);

function extractHighlightTerms(what: string): string[] {
  return what
    .replace(/[*_`#]/g, '')
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase())
    .filter(w => w.length > 5 && !STOP_WORDS.has(w))
    .slice(0, 6);
}

export function AnalysisLayout({
  result,
  analysisId,
  cvBlobUrl,
  liBlobUrl = null,
  mlBlobUrl = null,
  deepStatus,
  isPremium,
  userPlan = "free",
  premiumUnlocked = false,
  onUnlockRewrite,
  isUnlocking = false,
  onReset,
  reconstructedCv,
  liText = null,
  coverLetterText = null,
  isRewriting = false,
  onRewrite,
  email,
  accessToken,
  completedSteps,
  cvTextFormatted = null,
  readOnly = false,
}: AnalysisLayoutProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("risk");
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());
  const reportRef = useRef<HTMLElement>(null);
  const highlightsByDoc = useMemo((): Partial<Record<"cv" | "linkedin" | "cover", HighlightMap>> => {
    const dedup = (entries: HighlightEntry[]): HighlightEntry[] => {
      const seen = new Set<string>();
      return entries.filter(e => seen.has(e.term) ? false : (seen.add(e.term), true));
    };
    const fromEntries = (arr: Array<{ term: string; tooltip: string }>) =>
      dedup(arr.map(e => ({ term: e.term, tooltip: e.tooltip })));
    const EMPTY_MAP: HighlightMap = { flags: [], issues: [], skills: [], weak: [], metrics: [] };

    // ── Heuristic fallbacks for CV (old analyses or empty Claude arrays) ──────
    const hFlags = dedup(
      (result.hidden_red_flags ?? []).flatMap(f =>
        extractHighlightTerms(f.flag).map(term => ({ term, tooltip: f.perception }))
      )
    ).slice(0, 10);
    const hIssues = dedup([
      ...(result.audit.cv.issues ?? []),
      ...(result.audit.github?.issues ?? []),
      ...(result.audit.linkedin?.issues ?? []),
    ].flatMap(i => extractHighlightTerms(i.what).map(term => ({ term, tooltip: i.what })))).slice(0, 15);
    const hSkills = (result.audit.jd_match?.required_skills ?? [])
      .filter(s => s.found).map(s => ({ term: s.skill })).slice(0, 15);
    const hWeak = dedup(
      (result.cv_tone?.examples ?? []).flatMap(e =>
        extractHighlightTerms(e).map(term => ({ term, tooltip: e }))
      )
    ).slice(0, 10);

    const ht = result.highlight_terms;
    if (!ht) return { cv: { flags: hFlags, issues: hIssues, skills: hSkills, weak: hWeak, metrics: [] } };

    // ── New per-source format ─────────────────────────────────────────────────
    if (ht.cv) {
      const cvMap: HighlightMap = {
        flags:   ht.cv.flags.length   > 0 ? fromEntries(ht.cv.flags)               : hFlags,
        issues:  ht.cv.issues.length  > 0 ? fromEntries(ht.cv.issues)              : hIssues,
        skills:  ht.cv.skills.length  > 0 ? dedup(ht.cv.skills.map(s => ({ term: s }))) : hSkills,
        weak:    ht.cv.weak.length    > 0 ? fromEntries(ht.cv.weak)                : hWeak,
        metrics: ht.cv.metrics.length > 0 ? fromEntries(ht.cv.metrics)             : [],
      };
      const liMap: HighlightMap = ht.linkedin ? {
        flags:   fromEntries(ht.linkedin.flags),
        issues:  fromEntries(ht.linkedin.issues),
        skills:  ht.linkedin.skills.length > 0 ? dedup(ht.linkedin.skills.map(s => ({ term: s }))) : hSkills,
        weak:    fromEntries(ht.linkedin.weak),
        metrics: fromEntries(ht.linkedin.metrics),
      } : { ...EMPTY_MAP, skills: hSkills };
      const coverMap: HighlightMap = ht.cover_letter ? {
        flags:   fromEntries(ht.cover_letter.flags),
        issues:  fromEntries(ht.cover_letter.issues),
        skills:  [],
        weak:    fromEntries(ht.cover_letter.weak),
        metrics: [],
      } : EMPTY_MAP;
      return { cv: cvMap, linkedin: liMap, cover: coverMap };
    }

    // ── Old flat format (backward compat) ────────────────────────────────────
    const flatMap: HighlightMap = {
      flags:   ht.flags?.length  ? fromEntries(ht.flags)                      : hFlags,
      issues:  ht.issues?.length ? fromEntries(ht.issues)                     : hIssues,
      skills:  ht.skills?.length ? dedup(ht.skills.map(s => ({ term: s })))  : hSkills,
      weak:    ht.weak?.length   ? fromEntries(ht.weak)                       : hWeak,
      metrics: [],
    };
    return { cv: flatMap };
  }, [result]);

  // TOC scroll-spy — highlight the section currently in view.
  useEffect(() => {
    const container = reportRef.current;
    if (!container) return;
    const sections = container.querySelectorAll<HTMLElement>("section[id^='sec-']");
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id.replace("sec-", ""));
        });
      },
      { root: container, rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [result]);

  const toggleKeyword = (kw: string) =>
    setCheckedKeywords((prev) => { const n = new Set(prev); n.has(kw) ? n.delete(kw) : n.add(kw); return n; });

  const hasShortlisted = userPlan === "shortlisted" || userPlan === "hired";
  const hasHired = userPlan === "hired";
  const jd = result.job_details;

  // Personalized work-eligibility alerts (owner view only): the collectable
  // blind spots we now know about this candidate. Never applied on the shared
  // read-only view — that profile belongs to the viewer, not the analysis owner.
  const { data: viewerProfile } = useProfile();
  const workAlerts = useMemo(() => {
    if (readOnly || !viewerProfile) return [] as string[];
    const bs = t.analysisLayout.blindSpots.alerts;
    const out: string[] = [];
    if (viewerProfile.needsSponsorship === true) out.push(bs.sponsorship);
    if (
      viewerProfile.remotePreference === "remote" &&
      (jd?.work_setting === "on-site" || jd?.work_setting === "hybrid")
    ) {
      out.push(bs.remote);
    }
    return out;
  }, [readOnly, viewerProfile, jd?.work_setting, t]);

  const matchBadge = (result.ats_simulation && !result.ats_simulation.would_pass ? 1 : 0) + (result.audit.jd_match?.required_skills.filter((s) => !s.found).length ?? 0);
  const cvBadge = result.audit.cv.issues.filter((i) => i.severity === "critical").length;
  const signalsBadge = (result.audit.github?.issues.length ?? 0) + (result.audit.linkedin?.issues.length ?? 0);
  const timelineBadge = result.cross_profile_inconsistencies?.filter((i) => i.severity === "critical").length ?? 0;
  // P1: cover-letter audit is present only when a letter was provided (score
  // is null otherwise). The §04 section + its nav entry appear only then, so
  // the section numbers stay contiguous when there is no letter.
  const coverLetter = result.audit.cover_letter;
  const hasCoverLetter = !!coverLetter && (coverLetter.score !== null || coverLetter.issues.length > 0);
  const coverBadge = coverLetter?.issues.filter((i) => i.severity === "critical").length ?? 0;

  // Role dossier meta string
  const jdMeta = jd ? [jd.seniority, jd.years_of_experience ? `${jd.years_of_experience} exp` : null, jd.office_location, jd.contract_type, jd.company_stage].filter(Boolean).join("   ·   ") : null;

  return (
    <AnalysisShell
      cvBlobUrl={cvBlobUrl}
      liBlobUrl={liBlobUrl}
      mlBlobUrl={mlBlobUrl}
      hideDocPanel={readOnly && !cvBlobUrl && !cvTextFormatted && !reconstructedCv}
      reconstructedCv={reconstructedCv}
      liText={liText}
      coverLetterText={coverLetterText}
      highlightsByDoc={highlightsByDoc}
      onHighlightTypeClick={(type) => {
        if (type === "skills") document.getElementById("sec-match")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      renderRight={({ focusDoc }) => {
        const secHead = (n: string, title: string) => (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 18, height: 1, background: "var(--rc-red)" }} />§ {n} · {title}
          </div>
        );
        // Section order drives BOTH the nav numbers and the in-section headers,
        // so they never drift. `cover` is only in the order when a letter exists.
        const order: string[] = [
          "risk", "match", "cv",
          ...(hasCoverLetter ? ["cover"] : []),
          "signals", "timeline", "roadmap", "bridge", "negotiate", "rewrite",
        ];
        const secNo: Record<string, string> = Object.fromEntries(
          order.map((id, i) => [id, String(i + 1).padStart(2, "0")]),
        );
        const NAV: Record<string, { label: string; badge: number; premium?: boolean }> = {
          risk: { label: t.riskMeter.competitiveness.eyebrow, badge: 0 },
          match: { label: t.analysisLayout.tabs.match, badge: matchBadge },
          cv: { label: t.analysisLayout.tabs.cv, badge: cvBadge },
          cover: { label: t.analysisLayout.tabs.cover, badge: coverBadge },
          signals: { label: t.analysisLayout.tabs.signals, badge: signalsBadge },
          timeline: { label: t.analysisLayout.tabs.timeline, badge: timelineBadge },
          roadmap: { label: t.analysisLayout.tabs.roadmap, badge: 0 },
          bridge: { label: t.analysisLayout.tabs.bridge, badge: 0, premium: true },
          negotiate: { label: t.analysisLayout.tabs.negotiate, badge: 0, premium: true },
          rewrite: { label: t.analysisLayout.tabs.rewrite, badge: 0, premium: true },
        };
        const TOC = order.map((id) => ({ id, n: secNo[id], ...NAV[id] }));
        const SEC: React.CSSProperties = { scrollMarginTop: 24, padding: "44px 0", borderTop: "1px solid var(--rc-border)" };
        return (
        <div className="rc-toc-grid" style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "230px 1fr", minWidth: 0 }}>

          {/* ── Section nav (vertical TOC) ── */}
          <aside className="rc-toc" style={{ height: "100%", overflowY: "auto", padding: "40px 14px 0 26px", borderRight: "1px solid var(--rc-border)", scrollbarWidth: "none" }}>
            <Eyebrow style={{ display: "block", marginBottom: 14, paddingLeft: 8 }}>Diagnostic</Eyebrow>
            <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {TOC.map((s) => {
                const on = activeSection === s.id;
                return (
                  <a key={s.id} href={`#sec-${s.id}`}
                    onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                    style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "8px", borderRadius: R_SM, textDecoration: "none", color: on ? "var(--rc-red)" : "var(--rc-hint)", background: on ? "var(--rc-red-bg)" : "transparent", transition: "color 0.15s, background 0.15s" }}>
                    {on && <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, borderRadius: 99, background: "var(--rc-red)" }} />}
                    <Mono style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: on ? "var(--rc-red)" : "var(--rc-hint)" }}>{s.n}</Mono>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: on ? 600 : 500, flex: 1, color: on ? "var(--rc-text)" : "inherit" }}>{s.label}</span>
                    {s.badge > 0 && <Mono style={{ fontSize: 9, fontWeight: 700, color: "var(--rc-amber)" }}>{s.badge}</Mono>}
                    {s.premium && <Mono style={{ fontSize: 9, color: "var(--rc-red)" }}>✦</Mono>}
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* ── Scrolled report ── */}
          <main ref={reportRef} style={{ height: "100%", overflowY: "auto", padding: "44px 48px 120px", scrollbarWidth: "thin" }}>

            {/* The single pass is still streaming the actionable sections. */}
            {deepStatus === "pending" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "11px 16px", borderRadius: R_SM, border: "1px solid color-mix(in srgb, var(--rc-amber) 28%, transparent)", background: "color-mix(in srgb, var(--rc-amber) 7%, transparent)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--rc-amber)", flexShrink: 0, animation: "rcPulse 1.4s ease-in-out infinite" }} />
                <Mono style={{ fontSize: 12, color: "var(--rc-text)", letterSpacing: "0.01em" }}>{t.analysisLayout.deepPending}</Mono>
                <style>{`@keyframes rcPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
              </div>
            )}

            {/* §01 — Competitiveness (displayed as 100 − rejection risk) */}
            <section id="sec-risk" style={{ scrollMarginTop: 24, paddingBottom: 44, borderBottom: "1px solid var(--rc-border)" }}>
              <RiskMeter value={100 - result.score} mode="vsjob" metric="competitiveness" sectionNo={secNo.risk} pending={Boolean((result as { __scorePending?: boolean }).__scorePending)} />
              {result.technical_analysis?.reasoning && (
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--rc-muted)", marginTop: 24 }}>
                  <MD>{result.technical_analysis.reasoning}</MD>
                </div>
              )}
              {(() => {
                const topFix =
                  result.audit.cv.issues.find(i => i.severity === "critical" && i.fix)?.fix ??
                  result.audit.cv.issues.find(i => i.severity === "major" && i.fix)?.fix ??
                  result.seniority_analysis?.fix ??
                  null;
                if (!topFix) return null;
                return (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 16, padding: "10px 14px", borderRadius: R_SM, background: "color-mix(in srgb, var(--rc-green) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--rc-green) 20%, transparent)" }}>
                    <Eyebrow color="var(--rc-green)" style={{ flexShrink: 0, letterSpacing: "0.14em" }}>{t.analysisLayout.hero.startHere}</Eyebrow>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-text)", lineHeight: 1.5 }}>
                      <MD>{topFix.summary}</MD>
                      {" "}<Mono style={{ color: "var(--rc-hint)", fontSize: 12 }}>{t.analysisLayout.diffRow.startHereIn} {topFix.time_required}</Mono>
                    </span>
                  </div>
                );
              })()}
              {result.breakdown && (
                <div style={{ borderTop: "1px solid var(--rc-border)", marginTop: 24, paddingTop: 18 }}>
                  <Eyebrow style={{ display: "block", marginBottom: 12 }}>{t.analysisLayout.hero.breakdownTitle}</Eyebrow>
                  <div className="rc-col2-m" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
                    <StatBarRow label={t.analysisLayout.breakdownLabels.keywords}   value={result.breakdown.keyword_match}    threshold={65} />
                    <StatBarRow label={t.analysisLayout.breakdownLabels.techStack} value={result.breakdown.tech_stack_fit}   threshold={70} />
                    <StatBarRow label={t.analysisLayout.breakdownLabels.experience} value={result.breakdown.experience_level} threshold={60} />
                    <StatBarRow label={t.analysisLayout.breakdownLabels.github}     value={result.breakdown.github_signal}    threshold={70} />
                    <StatBarRow label={t.analysisLayout.breakdownLabels.linkedin}   value={result.breakdown.linkedin_signal}  threshold={70} />
                  </div>
                </div>
              )}
              {jd && (
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 6, marginTop: 20, padding: "11px 14px", borderRadius: R_SM, border: "1px solid var(--rc-border)", background: "var(--rc-surface-hero)" }}>
                  <Eyebrow style={{ marginRight: 16, color: "var(--rc-hint)", whiteSpace: "nowrap" }}>{t.analysisLayout.hero.targetRole}</Eyebrow>
                  <Mono style={{ fontSize: 14, fontWeight: 700, color: "var(--rc-text)", whiteSpace: "nowrap" }}>{jd.pay}</Mono>
                  {jdMeta && <><Mono style={{ color: "var(--rc-border)", margin: "0 12px" }}>/</Mono><Mono style={{ fontSize: 12, color: "var(--rc-muted)", letterSpacing: "0.01em" }}>{jdMeta}</Mono></>}
                </div>
              )}

              {/* Personalized hard-mismatch alerts (owner only): the collectable
                  blind spots we now know about — the sponsorship / remote filters
                  that cut before a CV is read. */}
              {workAlerts.length > 0 && (
                <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: R_SM, border: "1px solid color-mix(in srgb, var(--rc-amber) 45%, transparent)", background: "color-mix(in srgb, var(--rc-amber) 8%, transparent)" }}>
                  <Eyebrow style={{ display: "block", marginBottom: 8, color: "var(--rc-amber)" }}>{t.analysisLayout.blindSpots.alerts.title}</Eyebrow>
                  <ul style={{ margin: 0, paddingLeft: 18, fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.6, color: "var(--rc-text)" }}>
                    {workAlerts.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What this score can't see — kills the "70 = 70% odds" read by
                  naming the outcome factors no CV-vs-JD score can model. */}
              <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: R_SM, border: "1px dashed var(--rc-border)", background: "var(--rc-surface-hero)" }}>
                <Eyebrow style={{ display: "block", marginBottom: 8, color: "var(--rc-hint)" }}>{t.analysisLayout.blindSpots.title}</Eyebrow>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--rc-muted)", margin: 0 }}>
                  {t.analysisLayout.blindSpots.intro}
                </p>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: 1.6, color: "var(--rc-muted)" }}>
                  {t.analysisLayout.blindSpots.factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--rc-text)", margin: "8px 0 0", fontWeight: 500 }}>
                  {t.analysisLayout.blindSpots.outro}
                </p>
              </div>
            </section>

            {/* §02 — Match */}
            <section id="sec-match" style={SEC}>
              {secHead(secNo.match, t.analysisLayout.tabs.match)}
              {!readOnly && <RescanPanel analysisId={analysisId} accessToken={accessToken ?? null} result={result} cvText={reconstructedCv ?? cvTextFormatted} />}
              <MatchBody result={result} deepStatus={deepStatus} checkedKeywords={checkedKeywords} toggleKeyword={toggleKeyword} />
            </section>

            {/* §03 — CV */}
            <section id="sec-cv" style={SEC}>
              {secHead(secNo.cv, t.analysisLayout.tabs.cv)}
              <ParsedCvDisclosure text={cvTextFormatted} />
              <CVBody result={result} onIssueClick={() => focusDoc("cv", true)} />
            </section>

            {/* §04 — Cover letter (only when a letter was provided) */}
            {hasCoverLetter && coverLetter && (
              <section id="sec-cover" style={SEC}>
                {secHead(secNo.cover, t.analysisLayout.tabs.cover)}
                <CoverLetterBody cl={coverLetter} />
              </section>
            )}

            {/* Signals */}
            <section id="sec-signals" style={SEC}>
              {secHead(secNo.signals, t.analysisLayout.tabs.signals)}
              <SignalsTab
                github={result.audit.github}
                linkedin={result.audit.linkedin}
                hasGithub={result.audit.github.score !== null || result.audit.github.issues.length > 0}
                hasLinkedin={result.audit.linkedin.score !== null || result.audit.linkedin.issues.length > 0 || !!liBlobUrl || !!liText}
                onHighlightClick={(id) => {
                  const src = id.split("-")[0];
                  focusDoc(src === "linkedin" ? "linkedin" : "cv", true);
                }}
              />
            </section>

            {/* §05 — Timeline */}
            <section id="sec-timeline" style={SEC}>
              {secHead(secNo.timeline, t.analysisLayout.tabs.timeline)}
              <ConsistencyTab
                inconsistencies={result.cross_profile_inconsistencies ?? []}
                timelineEntries={result.timeline_entries ?? []}
              />
            </section>

            {/* §06 — Roadmap (derived from the deep fixes → skeleton while pending,
                else the empty "no issues" state misleads during generation) */}
            <section id="sec-roadmap" style={SEC}>
              {secHead(secNo.roadmap, t.analysisLayout.tabs.roadmap)}
              {deepStatus === "pending" ? (
                <ProjectRecommendationSkeleton />
              ) : (
                <RoadmapTab result={result} />
              )}
            </section>

            {/* §07 — Bridge project */}
            <section id="sec-bridge" style={SEC}>
              {secHead(secNo.bridge, t.analysisLayout.tabs.bridge)}
              {result.project_recommendation ? (
                hasShortlisted ? (
                  <BridgeTab result={result} analysisId={analysisId} completedSteps={completedSteps} />
                ) : (
                  <ProjectTab project={result.project_recommendation} />
                )
              ) : deepStatus === "pending" ? (
                <ProjectRecommendationSkeleton />
              ) : (
                <div style={{ padding: "32px 0", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-hint)" }}>
                  {t.analysisLayout.plan.bridgeNotAvailable}
                </div>
              )}
              {AI_INTERVIEW_ENABLED && hasHired && (
                <div style={{ marginTop: 32 }}>
                  <InterviewTab isPremium={true} analysisId={analysisId} email={email ?? null} accessToken={accessToken ?? null} defaultInterviewId={null} />
                </div>
              )}
            </section>

            {/* §08 — Negotiation */}
            <section id="sec-negotiate" style={SEC}>
              {secHead(secNo.negotiate, t.analysisLayout.tabs.negotiate)}
              {hasHired ? (
                <NegotiationTab result={result} analysisId={analysisId} isPremium={true} />
              ) : (
                <div style={{ padding: "32px 0", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-hint)" }}>
                  {t.analysisLayout.plan.negotiationPremium}
                </div>
              )}
            </section>

            {/* §09 — Rewrite */}
            <section id="sec-rewrite" style={SEC}>
              {secHead(secNo.rewrite, t.analysisLayout.tabs.rewrite)}
              {(hasShortlisted || premiumUnlocked) ? (
                <RewriteTab
                  result={result}
                  reconstructedCv={reconstructedCv ?? null}
                  isRewriting={isRewriting ?? false}
                  onRewrite={onRewrite ?? (() => {})}
                  analysisId={analysisId}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px", textAlign: "center", gap: 20 }}>
                  <Mono style={{ fontSize: 28, color: "var(--rc-border)" }}>✦</Mono>
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 600, color: "var(--rc-text)", letterSpacing: "-0.015em", marginBottom: 10 }}>
                      {t.analysisLayout.rewritePaywall.title}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.65, maxWidth: 400 }}>
                      {t.analysisLayout.rewritePaywall.desc}
                    </div>
                  </div>
                  {onUnlockRewrite ? (
                    <>
                      {/* Primary: one-time unlock for THIS CV — the low-commitment
                          offer at peak desire (right after a bad score). */}
                      <button
                        onClick={onUnlockRewrite}
                        disabled={isUnlocking}
                        style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, padding: "11px 24px", borderRadius: 6, background: "linear-gradient(180deg, var(--rc-red), #A32A29)", color: "#fff", border: "none", cursor: isUnlocking ? "not-allowed" : "pointer", opacity: isUnlocking ? 0.6 : 1, boxShadow: "0 6px 20px rgba(201,58,57,0.28)" }}
                      >
                        {isUnlocking ? "…" : t.analysisLayout.rewritePaywall.unlockCta}
                      </button>
                      <Eyebrow style={{ fontSize: 9 }}>{t.analysisLayout.rewritePaywall.unlockNote}</Eyebrow>
                      {/* Secondary: the subscription path, demoted. */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-hint)" }}>
                          {t.analysisLayout.rewritePaywall.unlockOr}
                        </span>
                        <a href="/pricing" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--rc-text)", textDecoration: "underline" }}>
                          {t.analysisLayout.rewritePaywall.cta}
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <a href="/pricing" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, padding: "11px 24px", borderRadius: 6, background: "linear-gradient(180deg, var(--rc-red), #A32A29)", color: "#fff", textDecoration: "none", boxShadow: "0 6px 20px rgba(201,58,57,0.28)" }}>
                        {t.analysisLayout.rewritePaywall.cta}
                      </a>
                      <Eyebrow style={{ fontSize: 9 }}>{t.analysisLayout.rewritePaywall.note}</Eyebrow>
                    </>
                  )}
                </div>
              )}
            </section>
          </main>
        </div>
        );
      }}
    />
  );
}
