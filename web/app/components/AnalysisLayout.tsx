"use client";

import { useState, useEffect, useMemo } from "react";
import type { AnalysisResult, Fix } from "./types";
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
import { AI_INTERVIEW_ENABLED } from "../../lib/features";
import { InterviewTab } from "./tabs/InterviewTab";
import { useLanguage } from "../../context/language";

// ── Types ─────────────────────────────────────────────────────────────────────

type MainTab = "match" | "cv" | "rewrite" | "signals" | "timeline" | "plan";
type PlanPane = "roadmap" | "bridge" | "negotiate";

export type AnalysisLayoutProps = {
  result: AnalysisResult;
  analysisId: number | null;
  cvBlobUrl: string | null;
  liBlobUrl?: string | null;
  mlBlobUrl?: string | null;
  deepStatus: "pending" | "failed" | "ready";
  isPremium: boolean;
  userPlan?: "free" | "shortlisted" | "hired";
  onReset: () => void;
  reconstructedCv?: string | null;
  liText?: string | null;
  coverLetterText?: string | null;
  isRewriting?: boolean;
  onRewrite?: () => void;
  email?: string | null;
  accessToken?: string | null;
  completedSteps?: number[];
};

type DocTab = "cv" | "cover" | "linkedin";

// ── Helpers ───────────────────────────────────────────────────────────────────

const R_SM = "4px";
const R_MD = "8px";
const SHADOW_XS = "0 1px 2px rgba(26,22,18,0.06)";
const SHADOW_SM = "0 1px 3px rgba(26,22,18,0.08), 0 1px 2px rgba(26,22,18,0.04)";

const scoreColor = (n: number) =>
  n >= 70 ? "var(--rc-red)" : n >= 50 ? "var(--rc-amber)" : "var(--rc-green)";

const verdictKey = (n: number): "critical" | "high" | "moderate" | "low" | "excellent" =>
  n >= 70 ? "critical" : n >= 50 ? "high" : n >= 35 ? "moderate" : n >= 15 ? "low" : "excellent";

const heroHeadline = (n: number) =>
  n >= 50 ? "You're below the line for this one." : n >= 35 ? "Competitive — with a few gaps to close." : "Strong match. Polish and apply.";

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

// ── Atoms ─────────────────────────────────────────────────────────────────────

function Eyebrow({ children, color, style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: color ?? "var(--rc-hint)", ...style }}>
      {children}
    </span>
  );
}

function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", ...style }}>{children}</span>;
}

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
      <Mono style={{ fontSize: 12, fontWeight: 700, color: c, width: 22, textAlign: "right", flexShrink: 0 }}>{value ?? "—"}</Mono>
      <div style={{ flex: 1, minWidth: 40, position: "relative", height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 9999 }}>
        {value !== null && <div style={{ position: "absolute", inset: 0, right: "auto", width: `${value}%`, background: c, borderRadius: 9999 }} />}
        <div style={{ position: "absolute", left: `${threshold}%`, top: -3, width: 2, height: 12, background: "rgba(0,0,0,0.28)", transform: "translateX(-1px)" }} />
      </div>
      <Mono style={{ fontSize: 11, fontWeight: 700, color: c, width: 12, textAlign: "center", flexShrink: 0 }}>
        {pass ? "✓" : value === null ? "—" : "✗"}
      </Mono>
    </div>
  );
}

// ── FixBlock ───────────────────────────────────────────────────────────────────

function FixBlock({ fix }: { fix: Fix | null | undefined }) {
  const { t } = useLanguage();
  if (!fix) return null;
  return (
    <div style={{ marginTop: 18, paddingLeft: 20, borderLeft: "2px solid var(--rc-green)" }}>
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
                        {ok ? "TARGET MET" : "GAP"}
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
  const sortedSkills = jd ? [...jd.required_skills].sort((a, b) => (a.found === b.found ? 0 : a.found ? 1 : -1)) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>

      {/* 01 — Positioning */}
      <section>
        <SecHead title={t.analysisLayout.cv.positioningTitle}
          sub="Before a single bullet is read, two things set the first impression: the level you project, and the voice you write in." rule />

        {/* a · Seniority */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
          <Eyebrow style={{ color: "var(--rc-hint)", whiteSpace: "nowrap" }}>{t.analysisLayout.cv.seniorityLabel}</Eyebrow>
          {sen.strength && <StrengthPill>Strength · {sen.strength}</StrengthPill>}
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
          <Eyebrow style={{ color: "var(--rc-hint)", whiteSpace: "nowrap" }}>b · Writing tone</Eyebrow>
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
              <Eyebrow color="var(--rc-amber)" style={{ display: "block", marginBottom: 7 }}>Pattern detected</Eyebrow>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.65, maxWidth: 620 }}>
                <MD>{correlation.explanation}</MD>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 02 — Forensic audit */}
      <section>
        <SecHead title="Every issue, ranked by what it costs you"
          sub={`${cv.issues.length} finding${cv.issues.length !== 1 ? "s" : ""} across the document. Each opens with the fix and the time it takes.`}
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
            <Mono style={{ fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 2 }}>Severity</Mono>
            <CountPill n={counts.critical} sev="critical" /><CountPill n={counts.major} sev="major" /><CountPill n={counts.minor} sev="minor" />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Mono style={{ fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 2 }}>In your favour</Mono>
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
            sub={`${flags.length} pattern${flags.length !== 1 ? "s" : ""} a reviewer spots in the first 8 seconds — before reading a single bullet.`} rule />
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
            sub="Every required skill from the job description, checked against what your CV actually demonstrates."
            meta={
              <div style={{ textAlign: "right" }}>
                <Mono style={{ fontSize: 26, fontWeight: 600, color: found === total ? "var(--rc-green)" : found >= total * 0.7 ? "var(--rc-amber)" : "var(--rc-red)" }}>
                  {found}<span style={{ color: "var(--rc-hint)", fontWeight: 400 }}>/{total}</span>
                </Mono>
                <Eyebrow style={{ display: "block", marginTop: 2 }}>{t.analysisLayout.flags.matched}</Eyebrow>
              </div>
            } rule />
          <Sheet style={{ padding: "8px 28px 24px" }}>
            <div className="rc-col2-m" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 36 }}>
              {sortedSkills.map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "13px 0", borderBottom: "1px solid var(--rc-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: s.found ? "var(--rc-text)" : "var(--rc-muted)", minWidth: 0 }}>{s.skill}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: s.found ? "var(--rc-green)" : "var(--rc-red)", flexShrink: 0 }}>{s.found ? "✓" : "✗"}</span>
                  </div>
                  {s.evidence && (
                    <Mono style={{ fontSize: 10, color: "var(--rc-hint)", lineHeight: 1.5 }}>{s.evidence}</Mono>
                  )}
                </div>
              ))}
            </div>
            {jd.experience_gap && (
              <div style={{ marginTop: 20, paddingLeft: 18, borderLeft: "2px solid var(--rc-red)" }}>
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
  onReset,
  reconstructedCv,
  liText = null,
  coverLetterText = null,
  isRewriting = false,
  onRewrite,
  email,
  accessToken,
  completedSteps,
}: AnalysisLayoutProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<MainTab>("match");
  const [activePlan, setActivePlan] = useState<PlanPane>("roadmap");
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());
  const [heroOpen, setHeroOpen] = useState(true);
  const [scoreDisplay, setScoreDisplay] = useState(0);
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
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result.score]);

  const toggleKeyword = (kw: string) =>
    setCheckedKeywords((prev) => { const n = new Set(prev); n.has(kw) ? n.delete(kw) : n.add(kw); return n; });

  const color = scoreColor(result.score);
  const hasShortlisted = userPlan === "shortlisted" || userPlan === "hired";
  const hasHired = userPlan === "hired";
  const jd = result.job_details;

  const matchBadge = (result.ats_simulation && !result.ats_simulation.would_pass ? 1 : 0) + (result.audit.jd_match?.required_skills.filter((s) => !s.found).length ?? 0);
  const cvBadge = result.audit.cv.issues.filter((i) => i.severity === "critical").length;
  const signalsBadge = (result.audit.github?.issues.length ?? 0) + (result.audit.linkedin?.issues.length ?? 0);
  const timelineBadge = result.cross_profile_inconsistencies?.filter((i) => i.severity === "critical").length ?? 0;

  const TABS: { id: MainTab; label: string; badge: number; tone?: string; premium?: boolean }[] = [
    { id: "match",    label: t.analysisLayout.tabs.match,    badge: matchBadge },
    { id: "cv",       label: t.analysisLayout.tabs.cv,       badge: cvBadge },
    { id: "rewrite",  label: t.analysisLayout.tabs.rewrite,  badge: 0, premium: true },
    { id: "signals",  label: t.analysisLayout.tabs.signals,  badge: signalsBadge, tone: "amber" },
    { id: "timeline", label: t.analysisLayout.tabs.timeline, badge: timelineBadge },
    { id: "plan",     label: t.analysisLayout.tabs.plan,     badge: 0 },
  ];

  const PLAN_PANES: { id: PlanPane; label: string }[] = [
    { id: "roadmap",   label: t.analysisLayout.tabs.roadmap },
    { id: "bridge",    label: t.analysisLayout.tabs.bridge },
    { id: "negotiate", label: t.analysisLayout.tabs.negotiate },
  ];

  // Role dossier meta string
  const jdMeta = jd ? [jd.seniority, jd.years_of_experience ? `${jd.years_of_experience} exp` : null, jd.office_location, jd.contract_type, jd.company_stage].filter(Boolean).join("   ·   ") : null;

  return (
    <AnalysisShell
      cvBlobUrl={cvBlobUrl}
      liBlobUrl={liBlobUrl}
      mlBlobUrl={mlBlobUrl}
      reconstructedCv={reconstructedCv}
      liText={liText}
      coverLetterText={coverLetterText}
      highlightsByDoc={highlightsByDoc}
      onHighlightTypeClick={(type) => {
        if (type === "skills") setActiveTab("match");
      }}
      renderRight={({ focusDoc }) => (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── Hero (animated collapsible) ── */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--rc-border)", background: "var(--rc-surface)" }}>

          {/* Slim bar — always rendered, slides in when collapsed */}
          <div style={{ display: "grid", gridTemplateRows: heroOpen ? "0fr" : "1fr", transition: "grid-template-rows 0.28s ease" }}>
            <div style={{ overflow: "hidden" }}>
              <div onClick={() => setHeroOpen(true)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 26px", cursor: "pointer" }}>
                <Mono style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {scoreDisplay}<span style={{ fontSize: 12, opacity: 0.5 }}>%</span>
                </Mono>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 9px", borderRadius: R_SM, color, background: `color-mix(in srgb, ${color} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                  <span style={{ width: 5, height: 5, borderRadius: 9999, background: color }} />
                  {t.analysisLayout.verdicts[verdictKey(result.score)]}
                </span>
                {jd && <Mono style={{ fontSize: 12, color: "var(--rc-hint)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{jd.pay}{jdMeta ? `  ·  ${jdMeta}` : ""}</Mono>}
                <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: R_SM, border: "1px solid var(--rc-border)", background: "var(--rc-bg)", color: "var(--rc-hint)" }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8l4-4 4 4"/></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Full hero — slides in when open */}
          <div style={{ display: "grid", gridTemplateRows: heroOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.28s ease" }}>
            <div style={{ overflow: "hidden" }}>
              <div className="rc-hero-split" style={{ display: "flex" }}>
                {/* Score column */}
                <div className="rc-hero-score" style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--rc-border)", padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Eyebrow style={{ marginBottom: 10 }}>{t.analysisLayout.hero.rejectionRisk}</Eyebrow>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 12 }}>
                    <Mono style={{ fontSize: 68, fontWeight: 700, lineHeight: 0.88, color, letterSpacing: "-0.03em" }}>{scoreDisplay}</Mono>
                    <Mono style={{ fontSize: 24, fontWeight: 700, color, opacity: 0.45 }}>%</Mono>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "5px 10px", borderRadius: R_SM, color, background: `color-mix(in srgb, ${color} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                    <span style={{ width: 6, height: 6, borderRadius: 9999, background: color }} />
                    {t.analysisLayout.verdicts[verdictKey(result.score)]}
                  </span>
                  {result.confidence && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--rc-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                        <Eyebrow style={{ fontSize: 9 }}>{t.analysisLayout.hero.confidence}</Eyebrow>
                        <Mono style={{ fontSize: 11, fontWeight: 700, color: "var(--rc-text)" }}>{result.confidence.score}%</Mono>
                        <div className="relative group" style={{ display: "inline-flex" }}>
                          <span style={{ width: 14, height: 14, borderRadius: 99, border: "1px solid var(--rc-border)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--rc-hint)", cursor: "default", flexShrink: 0 }}>?</span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150" style={{ width: 210, background: "var(--rc-text)", color: "var(--rc-bg)", fontFamily: "var(--font-sans)", fontSize: 11, lineHeight: 1.55, padding: "9px 12px", borderRadius: 6, zIndex: 50 }}>
                            {t.analysisLayout.hero.confidenceTooltip}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.5 }}>{result.confidence.reason}</div>
                    </div>
                  )}
                </div>

                {/* Verdict + breakdown column */}
                <div style={{ flex: 1, padding: "20px 26px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.015em", color: "var(--rc-text)", marginBottom: 8 }}>
                      {heroHeadline(result.score)}
                    </div>
                    <button onClick={() => setHeroOpen(false)} title="Collapse summary" style={{ flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: R_SM, border: "1px solid var(--rc-border)", background: "var(--rc-bg)", cursor: "pointer", color: "var(--rc-hint)" }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4l4 4 4-4"/></svg>
                    </button>
                  </div>
                  {result.technical_analysis?.reasoning && (
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--rc-muted)", marginBottom: 16 }}>
                      <MD>{result.technical_analysis.reasoning}</MD>
                    </div>
                  )}
                  {/* START HERE callout — top fix derived from first critical/major CV issue or seniority */}
                  {(() => {
                    const topFix =
                      result.audit.cv.issues.find(i => i.severity === "critical" && i.fix)?.fix ??
                      result.audit.cv.issues.find(i => i.severity === "major" && i.fix)?.fix ??
                      result.seniority_analysis?.fix ??
                      null;
                    if (!topFix) return null;
                    return (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16, padding: "10px 14px", borderRadius: R_SM, background: "color-mix(in srgb, var(--rc-green) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--rc-green) 20%, transparent)" }}>
                        <Eyebrow color="var(--rc-green)" style={{ flexShrink: 0, letterSpacing: "0.14em" }}>{t.analysisLayout.hero.startHere}</Eyebrow>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-text)", lineHeight: 1.5 }}>
                          <MD>{topFix.summary}</MD>
                          {" "}<Mono style={{ color: "var(--rc-hint)", fontSize: 12 }}>{t.analysisLayout.diffRow.startHereIn} {topFix.time_required}</Mono>
                        </span>
                      </div>
                    );
                  })()}
                  {result.breakdown && (
                    <div style={{ borderTop: "1px solid var(--rc-border)", marginTop: result.technical_analysis?.reasoning ? 0 : 8, paddingTop: 16 }}>
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
                </div>
              </div>

              {/* Role dossier */}
              {jd && (
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 6, padding: "11px 26px", borderTop: "1px solid var(--rc-border)", background: "var(--rc-surface-hero)" }}>
                  <Eyebrow style={{ marginRight: 16, color: "var(--rc-hint)", whiteSpace: "nowrap" }}>{t.analysisLayout.hero.targetRole}</Eyebrow>
                  <Mono style={{ fontSize: 14, fontWeight: 700, color: "var(--rc-text)", whiteSpace: "nowrap" }}>{jd.pay}</Mono>
                  {jdMeta && <><Mono style={{ color: "var(--rc-border)", margin: "0 12px" }}>/</Mono><Mono style={{ fontSize: 12, color: "var(--rc-muted)", letterSpacing: "0.01em" }}>{jdMeta}</Mono></>}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Tab bar ── */}
        <div style={{ flexShrink: 0, display: "flex", gap: 2, padding: "0 26px", borderBottom: "1px solid var(--rc-border)", background: "var(--rc-surface)" }}>
          {TABS.map((t) => {
            const on = t.id === activeTab;
            const badgeColor = t.tone === "amber" ? "var(--rc-amber)" : on ? "var(--rc-red)" : "var(--rc-hint)";
            return (
              <div key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 14px", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: on ? 600 : 500, color: on ? "var(--rc-red)" : "var(--rc-hint)", borderBottom: `2px solid ${on ? "var(--rc-red)" : "transparent"}`, cursor: "pointer", userSelect: "none" }}>
                {t.label}
                {t.premium && (
                  <Mono style={{ fontSize: 9, fontWeight: 700, color: on ? "var(--rc-red)" : "var(--rc-hint)", letterSpacing: "0.04em" }}>✦</Mono>
                )}
                {t.badge > 0 && (
                  <Mono style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: "var(--rc-bg)", border: "1px solid var(--rc-border)", borderRadius: R_SM, padding: "1px 5px" }}>
                    {t.badge}
                  </Mono>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}>

          {/* Match */}
          {activeTab === "match" && (
            <div style={{ padding: "28px 30px" }}>
              <MatchBody result={result} deepStatus={deepStatus} checkedKeywords={checkedKeywords} toggleKeyword={toggleKeyword} />
            </div>
          )}

          {/* CV */}
          {activeTab === "cv" && (
            <div style={{ padding: "28px 30px" }}>
              <CVBody result={result} onIssueClick={() => focusDoc("cv", true)} />
            </div>
          )}

          {/* Rewrite */}
          {activeTab === "rewrite" && (
            hasShortlisted ? (
              <RewriteTab
                result={result}
                reconstructedCv={reconstructedCv ?? null}
                isRewriting={isRewriting ?? false}
                onRewrite={onRewrite ?? (() => {})}
                analysisId={analysisId}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center", gap: 20 }}>
                <Mono style={{ fontSize: 28, color: "var(--rc-border)" }}>✦</Mono>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 600, color: "var(--rc-text)", letterSpacing: "-0.015em", marginBottom: 10 }}>
                    {t.analysisLayout.rewritePaywall.title}
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-muted)", lineHeight: 1.65, maxWidth: 400 }}>
                    {t.analysisLayout.rewritePaywall.desc}
                  </div>
                </div>
                <a href="/pricing" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, padding: "11px 24px", borderRadius: 6, background: "linear-gradient(180deg, var(--rc-red), #A32A29)", color: "#fff", textDecoration: "none", boxShadow: "0 6px 20px rgba(201,58,57,0.28)" }}>
                  {t.analysisLayout.rewritePaywall.cta}
                </a>
                <Eyebrow style={{ fontSize: 9 }}>{t.analysisLayout.rewritePaywall.note}</Eyebrow>
              </div>
            )
          )}

          {/* Signals */}
          {activeTab === "signals" && (
            <div style={{ padding: "28px 30px" }}>
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
            </div>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <div style={{ padding: "28px 30px" }}>
              <ConsistencyTab
                inconsistencies={result.cross_profile_inconsistencies ?? []}
                timelineEntries={result.timeline_entries ?? []}
              />
            </div>
          )}

          {/* Plan */}
          {activeTab === "plan" && (
            <div>
              {/* Sub-nav */}
              <div style={{ display: "inline-flex", gap: 3, margin: "16px 26px 0", padding: 3, background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD }}>
                {PLAN_PANES.map(({ id, label }) => {
                  const on = activePlan === id;
                  return (
                    <button key={id} onClick={() => setActivePlan(id)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "7px 14px", borderRadius: R_SM, cursor: "pointer", color: on ? "var(--rc-surface)" : "var(--rc-hint)", background: on ? "var(--rc-text)" : "transparent", border: "1px solid transparent", boxShadow: on ? SHADOW_XS : "none" }}>
                      {label}
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: "24px 30px" }}>
                {activePlan === "roadmap" && <RoadmapTab result={result} />}

                {activePlan === "bridge" && (
                  result.project_recommendation ? (
                    hasShortlisted ? (
                      <BridgeTab result={result} analysisId={analysisId} completedSteps={completedSteps} />
                    ) : (
                      <ProjectTab project={result.project_recommendation} />
                    )
                  ) : deepStatus === "pending" ? (
                    <ProjectRecommendationSkeleton />
                  ) : (
                    <div style={{ padding: "48px 0", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-hint)" }}>
                      {t.analysisLayout.plan.bridgeNotAvailable}
                    </div>
                  )
                )}

                {activePlan === "negotiate" && (
                  hasHired ? (
                    <NegotiationTab result={result} analysisId={analysisId} isPremium={true} />
                  ) : (
                    <div style={{ padding: "48px 0", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-hint)" }}>
                      {t.analysisLayout.plan.negotiationPremium}
                    </div>
                  )
                )}

                {activePlan === "bridge" && AI_INTERVIEW_ENABLED && hasHired && (
                  <div style={{ marginTop: 32 }}>
                    <InterviewTab isPremium={true} analysisId={analysisId} email={email ?? null} accessToken={accessToken ?? null} defaultInterviewId={null} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    />
  );
}
