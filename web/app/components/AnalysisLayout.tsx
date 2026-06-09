"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult, Fix } from "./types";
import { RadarChart } from "./RadarChart";
import { SignalsTab } from "./tabs/SignalsTab";
import { ConsistencyTab } from "./tabs/ConsistencyTab";
import { RoadmapTab } from "./tabs/RoadmapTab";
import { BridgeTab } from "./tabs/BridgeTab";
import { ProjectTab } from "./tabs/ProjectTab";
import { NegotiationTab } from "./tabs/NegotiationTab";
import { ImproveTab } from "./tabs/ImproveTab";
import { CoverLetterTab } from "./tabs/CoverLetterTab";
import { ProjectRecommendationSkeleton } from "./skeletons/ProjectRecommendationSkeleton";
import { TechnicalAnalysisSkeleton } from "./skeletons/TechnicalAnalysisSkeleton";
import { AI_INTERVIEW_ENABLED } from "../../lib/features";
import { InterviewTab } from "./tabs/InterviewTab";

// ── Types ─────────────────────────────────────────────────────────────────────

type MainTab = "match" | "cv" | "signals" | "timeline" | "plan";
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

const verdictLabel = (n: number) =>
  n >= 70 ? "Critical risk" : n >= 50 ? "High risk" : n >= 35 ? "Moderate risk" : n >= 15 ? "Low risk" : "Excellent match";

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
  if (!fix) return null;
  return (
    <div style={{ marginTop: 18, paddingLeft: 20, borderLeft: "2px solid var(--rc-green)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 11 }}>
        <Eyebrow color="var(--rc-green)">The fix</Eyebrow>
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
            <Mono style={{ fontSize: 9, fontWeight: 700, color: "var(--rc-red)", textTransform: "uppercase", letterSpacing: "0.1em", width: 38, flexShrink: 0 }}>was</Mono>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontStyle: "italic", color: "var(--rc-hint)", lineHeight: 1.5, textDecoration: "line-through", textDecorationColor: "rgba(201,58,57,0.45)" }}>
              {fix.example.before}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <Mono style={{ fontSize: 9, fontWeight: 700, color: "var(--rc-green)", textTransform: "uppercase", letterSpacing: "0.1em", width: 38, flexShrink: 0 }}>now</Mono>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--rc-text)", lineHeight: 1.5 }}>{fix.example.after}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── IssueItem ─────────────────────────────────────────────────────────────────

function IssueItem({ issue, last }: {
  issue: { severity: string; category: string; what: string; why: string; fix?: Fix | null };
  last: boolean;
}) {
  const c = sevColor(issue.severity);
  return (
    <div style={{ padding: "24px 28px", borderBottom: last ? "none" : "1px solid var(--rc-border)" }}>
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
  const ta = result.technical_analysis;
  const ats = result.ats_simulation;
  const atsCritical = ats?.critical_missing_keywords ?? [];
  const sim = ats ? Math.min(100, ats.score + [...checkedKeywords].reduce((s, kw) => s + (atsCritical.find((k) => k.keyword === kw)?.score_impact ?? 0), 0)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* 01 — Skill coverage */}
      <section>
        <SecHead
          eyebrow="01 — Skill coverage"
          title="Where you cover the role — and where you don't"
          sub="The filled shape is you; the dashed outline is the role's target. The ranked list shows what to close first."
          rule
        />
        {!ta || deepStatus !== "ready" ? (
          <TechnicalAnalysisSkeleton />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Radar + priority */}
            <Sheet>
              <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--rc-border)", background: "var(--rc-surface-hero)" }}>
                <Eyebrow>Skill coverage · you vs the role</Eyebrow>
              </div>
              <div style={{ display: "flex", gap: 28, padding: "24px 28px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flexShrink: 0 }}>
                  <RadarChart
                    axes={ta.skills.map((s) => ({ label: s.name, score: s.current, expected: s.expected, evidence: s.evidence }))}
                    scale={10}
                    size={340}
                    legend={{ current: "You", expected: "Target (JD)" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 10 }}>Job priority · skills ranked by gap</Eyebrow>
                  <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {(ta.skill_priority ?? []).map((name, i) => {
                      const sk = ta.skills.find((s) => s.name === name);
                      const gap = sk ? sk.expected - sk.current : 0;
                      const ok = gap <= 0;
                      const rankColors = ["var(--rc-red)", "var(--rc-amber)", "var(--rc-muted)", "var(--rc-hint)", "var(--rc-hint)", "var(--rc-hint)"];
                      const rank = rankColors[i] ?? "var(--rc-hint)";
                      return (
                        <li key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: R_SM, background: "var(--rc-bg)", border: "1px solid var(--rc-border)" }}>
                          <Mono style={{ fontSize: 11, fontWeight: 700, width: 18, textAlign: "center", color: rank, flexShrink: 0 }}>{i + 1}</Mono>
                          <Mono style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--rc-text)", flex: 1 }}>{name}</Mono>
                          <Mono style={{ fontSize: 10, color: ok ? "var(--rc-green)" : "var(--rc-hint)" }}>{ok ? "✓ target met" : `-${gap} pts gap`}</Mono>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </Sheet>

            {/* Strategic recommendation */}
            <Sheet style={{ padding: "20px 26px" }}>
              <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 12, letterSpacing: "0.18em" }}>Strategic recommendation</Eyebrow>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontStyle: "italic", color: "var(--rc-text)", lineHeight: 1.6 }}>
                <MD>{ta.recommendation}</MD>
              </div>
            </Sheet>

            {/* Per-skill evidence cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {ta.market_context && (
                  <Sheet style={{ padding: "18px 20px" }}>
                    <Eyebrow color="var(--rc-amber)" style={{ display: "block", marginBottom: 10 }}>● Market context</Eyebrow>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-text)", lineHeight: 1.6 }}><MD>{ta.market_context}</MD></div>
                  </Sheet>
                )}
                {ta.seniority_signals?.length ? (
                  <Sheet style={{ padding: "18px 20px" }}>
                    <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 10 }}>● Seniority signals</Eyebrow>
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
            eyebrow="02 — ATS filter"
            eyebrowColor={ats.would_pass ? "var(--rc-green)" : "var(--rc-red)"}
            title={ats.would_pass ? "ATS pass likely" : "ATS rejection likely"}
            sub={ats.reason}
            rule
            meta={
              <div style={{ textAlign: "right" }}>
                <Mono style={{ fontSize: 38, fontWeight: 500, color: "var(--rc-text)", lineHeight: 1 }}>
                  {ats.score}<span style={{ fontSize: 15, color: "var(--rc-hint)" }}>/100</span>
                </Mono>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--rc-red)", marginTop: 3 }}>
                  {ats.threshold - ats.score} pts below cutoff
                </div>
              </div>
            }
          />
          {/* ATS meter */}
          <div style={{ padding: "22px 24px", border: "1px solid var(--rc-red-border)", borderRadius: R_MD, background: "var(--rc-red-bg)", marginBottom: 24 }}>
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
                  cutoff {ats.threshold}
                </div>
              </div>
            </div>
            {sim !== ats.score && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <span style={{ color: "var(--rc-hint)" }}>current {ats.score}</span>
                <span style={{ color: sim >= ats.threshold ? "var(--rc-green)" : "var(--rc-amber)", fontWeight: 700 }}>
                  simulated {sim}{sim >= ats.threshold ? " · would pass ✓" : ` · still ${ats.threshold - sim} below`}
                </span>
              </div>
            )}
          </div>

          {/* Keyword simulator */}
          {atsCritical.length > 0 && (() => {
            const kws = atsCritical;
            const req = [...kws].filter((k) => k.required).sort((a, b) => b.score_impact - a.score_impact);
            const pref = [...kws].filter((k) => !k.required).sort((a, b) => b.score_impact - a.score_impact);
            const maxImpact = 8;
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
                    <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 9999 }}>
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
                <SecHead eyebrow="Simulator" title="Add these, watch the score climb" sub="Each is a keyword the JD weights and your CV is missing. Tick to preview the lift — it's reversible." />
                <Sheet style={{ overflow: "hidden" }}>
                  {req.length > 0 && (
                    <div style={{ padding: "22px 24px", borderBottom: pref.length > 0 ? "1px solid var(--rc-border)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--rc-red)" }} />
                        <Eyebrow color="var(--rc-red)" style={{ fontSize: 11 }}>Required</Eyebrow>
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
                        <Eyebrow color="var(--rc-amber)" style={{ fontSize: 11 }}>Preferred</Eyebrow>
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

// ── Parsed CV renderer ────────────────────────────────────────────────────────

const SECTION_RE = /^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\s]{3,}$|^[A-Z][^a-z]{2,}:?\s*$/;
const ROLE_LINE_RE = /^[A-Z].*—|^[A-Z][^.]{5,}(?:\s—\s|\s[-–]\s)/;

function ParsedCvView({ text }: { text: string }) {
  const lines = text.split("\n");
  let first = true;
  return (
    <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.7, color: "var(--rc-muted)" }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 10 }} />;
        if (first && i < 5) {
          // First non-empty lines are the candidate header block
          if (i === 0) { first = false; return <div key={i} style={{ fontFamily: "var(--font-sans)", fontSize: 21, fontWeight: 700, color: "var(--rc-text)", letterSpacing: "-0.01em", marginBottom: 2 }}>{trimmed}</div>; }
          return <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--rc-hint)", marginBottom: i === 1 ? 20 : 4 }}>{trimmed}</div>;
        }
        if (SECTION_RE.test(trimmed)) {
          return (
            <div key={i} style={{ marginTop: 22, marginBottom: 8 }}>
              <Eyebrow style={{ letterSpacing: "0.14em" }}>{trimmed.replace(/:$/, "")}</Eyebrow>
              <div style={{ height: 1, background: "var(--rc-border)", marginTop: 7 }} />
            </div>
          );
        }
        if (ROLE_LINE_RE.test(trimmed)) {
          return <div key={i} style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, color: "var(--rc-text)", marginTop: 16, marginBottom: 2 }}>{trimmed}</div>;
        }
        if (/^\d{4}/.test(trimmed) || /^[A-Za-z]+\s\d{4}/.test(trimmed)) {
          return <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rc-hint)", marginBottom: 8 }}>{trimmed}</div>;
        }
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("·")) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <span style={{ color: "var(--rc-border)", flexShrink: 0, marginTop: 2 }}>·</span>
              <span>{trimmed.replace(/^[•\-·]\s*/, "")}</span>
            </div>
          );
        }
        return <div key={i} style={{ marginBottom: 4 }}>{trimmed}</div>;
      })}
    </div>
  );
}

// ── CV tab body ────────────────────────────────────────────────────────────────

function CVBody({ result }: { result: AnalysisResult }) {
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
        <SecHead eyebrow="01 — Positioning" title="How your CV reads at a glance"
          sub="Before a single bullet is read, two things set the first impression: the level you project, and the voice you write in." rule />

        {/* a · Seniority */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
          <Eyebrow style={{ color: "var(--rc-hint)", whiteSpace: "nowrap" }}>a · Seniority signal</Eyebrow>
          {sen.strength && <StrengthPill>Strength · {sen.strength}</StrengthPill>}
        </div>
        <Compare leftLabel="Role expects" left={sen.expected} rightLabel="Your CV signals" right={sen.detected} rightColor="var(--rc-red)" />
        <div style={{ marginTop: 18 }}>
          <Eyebrow style={{ display: "block", marginBottom: 7 }}>What this signals</Eyebrow>
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
            {tone.detected} voice
          </span>
        </div>
        <Sheet style={{ padding: "4px 22px" }}>
          {(tone.examples ?? []).map((ex, i) => {
            const good = phraseGood(ex);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 0", borderBottom: i === (tone.examples?.length ?? 0) - 1 ? "none" : "1px solid var(--rc-border)" }}>
                <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 9999, background: good ? "var(--rc-green-bg)" : "var(--rc-red-bg)", color: good ? "var(--rc-green)" : "var(--rc-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{good ? "✓" : "✗"}</span>
                <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 15, fontStyle: "italic", color: good ? "var(--rc-muted)" : "var(--rc-text)", lineHeight: 1.5 }}>"{ex}"</span>
                <Mono style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: good ? "var(--rc-green)" : "var(--rc-red)" }}>{good ? "strong" : "weak"}</Mono>
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
        <SecHead eyebrow="02 — Forensic audit" title="Every issue, ranked by what it costs you"
          sub={`${cv.issues.length} finding${cv.issues.length !== 1 ? "s" : ""} across the document. Each opens with the fix and the time it takes.`}
          meta={
            <div style={{ textAlign: "right" }}>
              <Eyebrow style={{ display: "block", marginBottom: 6 }}>CV health</Eyebrow>
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
          {cv.issues.map((it, i) => <IssueItem key={i} issue={it} last={i === cv.issues.length - 1} />)}
        </Sheet>
      </section>

      {/* 03 — Recruiter intuition */}
      {flags?.length > 0 && (
        <section>
          <SecHead eyebrow="03 — Recruiter intuition" title="What a human pauses on"
            sub={`${flags.length} pattern${flags.length !== 1 ? "s" : ""} a reviewer spots in the first 8 seconds — before reading a single bullet.`} rule />
          <Sheet>
            {flags.map((f, i) => (
              <div key={i} style={{ padding: "26px 28px", borderBottom: i === flags.length - 1 ? "none" : "1px solid var(--rc-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                  <span style={{ width: 3, height: 13, background: "var(--rc-red)", flexShrink: 0 }} />
                  <Eyebrow color="var(--rc-red)">Red flag</Eyebrow>
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 600, color: "var(--rc-text)", marginBottom: 12, lineHeight: 1.35, letterSpacing: "-0.01em" }}><MD>{f.flag}</MD></div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Mono style={{ fontSize: 9, color: "var(--rc-amber)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0, width: 88, paddingTop: 3 }}>Recruiter sees</Mono>
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
          <SecHead eyebrow="04 — Requirements" title="JD skills, matched to your CV"
            sub="Every required skill from the job description, checked against what your CV actually demonstrates."
            meta={
              <div style={{ textAlign: "right" }}>
                <Mono style={{ fontSize: 26, fontWeight: 600, color: found === total ? "var(--rc-green)" : found >= total * 0.7 ? "var(--rc-amber)" : "var(--rc-red)" }}>
                  {found}<span style={{ color: "var(--rc-hint)", fontWeight: 400 }}>/{total}</span>
                </Mono>
                <Eyebrow style={{ display: "block", marginTop: 2 }}>matched</Eyebrow>
              </div>
            } rule />
          <Sheet style={{ padding: "8px 28px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 36 }}>
              {sortedSkills.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--rc-border)" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: s.found ? "var(--rc-text)" : "var(--rc-muted)" }}>{s.skill}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {s.evidence && <Mono style={{ fontSize: 10, color: "var(--rc-hint)" }}>{s.evidence}</Mono>}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: s.found ? "var(--rc-green)" : "var(--rc-red)", width: 12, textAlign: "center" }}>{s.found ? "✓" : "✗"}</span>
                  </div>
                </div>
              ))}
            </div>
            {jd.experience_gap && (
              <div style={{ marginTop: 20, paddingLeft: 18, borderLeft: "2px solid var(--rc-red)" }}>
                <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 7 }}>Crucial experience gap</Eyebrow>
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
  isRewriting = false,
  onRewrite,
  email,
  accessToken,
  completedSteps,
}: AnalysisLayoutProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("match");
  const [activePlan, setActivePlan] = useState<PlanPane>("roadmap");
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());
  const [cvPanelOpen, setCvPanelOpen] = useState(true);
  const [docTab, setDocTab] = useState<DocTab>("cv");
  const [parsedMode, setParsedMode] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(0);

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

  const TABS: { id: MainTab; label: string; badge: number; tone?: string }[] = [
    { id: "match",    label: "Match",    badge: matchBadge },
    { id: "cv",       label: "CV",       badge: cvBadge },
    { id: "signals",  label: "Signals",  badge: signalsBadge, tone: "amber" },
    { id: "timeline", label: "Timeline", badge: timelineBadge },
    { id: "plan",     label: "Plan",     badge: 0 },
  ];

  const PLAN_PANES: { id: PlanPane; label: string }[] = [
    { id: "roadmap",   label: "Roadmap" },
    { id: "bridge",    label: "Bridge ✦" },
    { id: "negotiate", label: "Negotiate" },
  ];

  // Role dossier meta string
  const jdMeta = jd ? [jd.seniority, jd.years_of_experience ? `${jd.years_of_experience} exp` : null, jd.office_location, jd.contract_type, jd.company_stage].filter(Boolean).join("   ·   ") : null;

  // All doc tabs always shown; blobUrl null = not provided for this analysis
  const allDocs: { id: DocTab; label: string; blobUrl: string | null; hasParsed: boolean; missingMsg: string }[] = [
    { id: "cv",       label: "CV",           blobUrl: cvBlobUrl,  hasParsed: !!reconstructedCv, missingMsg: "No CV was provided for this analysis." },
    { id: "cover",    label: "Cover letter", blobUrl: mlBlobUrl,  hasParsed: false, missingMsg: "No cover letter was provided for this analysis." },
    { id: "linkedin", label: "LinkedIn",     blobUrl: liBlobUrl,  hasParsed: false, missingMsg: "No LinkedIn PDF was provided for this analysis." },
  ];

  const currentDoc = allDocs.find((d) => d.id === docTab) ?? allDocs[0];
  // Parsed is always toggleable; if not available, show an info state instead of content
  const activeParsed = parsedMode;

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Left panel — Source documents ── */}
      <div style={{ width: cvPanelOpen ? 520 : 40, flexShrink: 0, borderRight: "1px solid var(--rc-border)", display: "flex", flexDirection: "column", background: "var(--rc-surface)", transition: "width 0.22s ease", overflow: "hidden" }}>
        {cvPanelOpen ? (
          <>
            {/* Panel header — row 1: label + collapse */}
            <div style={{ flexShrink: 0, borderBottom: "1px solid var(--rc-border)", padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Eyebrow>Source document</Eyebrow>
                <button onClick={() => setCvPanelOpen(false)} title="Collapse panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: R_SM, border: "1px solid var(--rc-border)", background: "var(--rc-bg)", cursor: "pointer", color: "var(--rc-hint)", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2L3 6.5L8 11"/></svg>
                </button>
              </div>

              {/* Row 2: doc switcher + raw/parsed toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 14, flexWrap: "wrap" }}>
                {/* Doc tabs — always all 3 */}
                <div style={{ display: "flex", border: "1px solid var(--rc-border)", borderRadius: R_SM, overflow: "hidden", background: "var(--rc-bg)", flexShrink: 0 }}>
                  {allDocs.map((d, i) => {
                    const active = d.id === docTab;
                    return (
                      <button key={d.id} onClick={() => setDocTab(d.id)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, padding: "7px 13px", color: active ? "var(--rc-surface)" : d.blobUrl ? "var(--rc-muted)" : "var(--rc-border)", background: active ? "var(--rc-text)" : "transparent", borderLeft: i > 0 ? "1px solid var(--rc-border)" : "none", cursor: "pointer" }}>
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {/* Raw / Parsed toggle — always visible */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: activeParsed ? "var(--rc-hint)" : "var(--rc-text)" }}>Raw</span>
                  <div onClick={() => setParsedMode((v) => !v)} style={{ width: 42, height: 22, borderRadius: 99, background: activeParsed ? "var(--rc-text)" : "var(--rc-border)", position: "relative", cursor: "pointer", transition: "background 0.15s" }}>
                    <div style={{ position: "absolute", top: 2, left: activeParsed ? 22 : 2, width: 18, height: 18, borderRadius: 99, background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.18)" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: activeParsed ? "var(--rc-text)" : "var(--rc-hint)" }}>Parsed</span>
                </div>
              </div>
            </div>

            {/* Panel content */}
            {(() => {
              // Parsed mode but no parsed text for this doc
              if (activeParsed && !(currentDoc.id === "cv" && reconstructedCv)) {
                const msg = currentDoc.id === "cv"
                  ? "Parsed text is not available for this analysis. Re-run the analysis to get it."
                  : `Parsed view is only available for the CV document.`;
                return (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "0 40px", textAlign: "center" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--rc-border)" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-hint)", lineHeight: 1.6 }}>{msg}</div>
                  </div>
                );
              }
              // Parsed CV
              if (activeParsed && currentDoc.id === "cv" && reconstructedCv) {
                return (
                  <div style={{ flex: 1, overflow: "auto", padding: "28px 34px", background: "var(--rc-surface-raised)", scrollbarWidth: "thin" }}>
                    <ParsedCvView text={reconstructedCv} />
                    <div style={{ marginTop: 26, paddingTop: 16, borderTop: "1px solid var(--rc-border)" }}>
                      <Mono style={{ fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Parsed from your uploaded document</Mono>
                    </div>
                  </div>
                );
              }
              // Raw mode with a blob
              if (currentDoc.blobUrl) {
                return <iframe src={currentDoc.blobUrl} className="flex-1 border-0 w-full" title={`${currentDoc.label} preview`} style={{ minWidth: 519 }} />;
              }
              // Raw mode but doc was not provided
              return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "0 40px", textAlign: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--rc-border)" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-hint)", lineHeight: 1.6 }}>{currentDoc.missingMsg}</div>
                </div>
              );
            })()}
          </>
        ) : (
          /* Collapsed strip */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 12 }}>
            <button onClick={() => setCvPanelOpen(true)} title="Expand panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: R_SM, border: "1px solid var(--rc-border)", background: "var(--rc-bg)", cursor: "pointer", color: "var(--rc-hint)" }}>
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 2l10 4.5L5 11"/></svg>
            </button>
            <div style={{ writingMode: "vertical-rl", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", transform: "rotate(180deg)", marginTop: 6 }}>
              Docs
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel — Analysis ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── Hero ── */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--rc-border)", background: "var(--rc-surface)" }}>
          <div style={{ display: "flex" }}>
            {/* Score column */}
            <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--rc-border)", padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Eyebrow style={{ marginBottom: 10 }}>Rejection risk</Eyebrow>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 12 }}>
                <Mono style={{ fontSize: 68, fontWeight: 700, lineHeight: 0.88, color, letterSpacing: "-0.03em" }}>{scoreDisplay}</Mono>
                <Mono style={{ fontSize: 24, fontWeight: 700, color, opacity: 0.45 }}>%</Mono>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "5px 10px", borderRadius: R_SM, color, background: `color-mix(in srgb, ${color} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: color }} />
                {verdictLabel(result.score)}
              </span>
              {result.confidence && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--rc-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    <Eyebrow style={{ fontSize: 9 }}>Confidence</Eyebrow>
                    <Mono style={{ fontSize: 11, fontWeight: 700, color: "var(--rc-text)" }}>{result.confidence.score}%</Mono>
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.5 }}>{result.confidence.reason}</div>
                </div>
              )}
            </div>

            {/* Verdict + breakdown column */}
            <div style={{ flex: 1, padding: "20px 26px", minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.015em", color: "var(--rc-text)", marginBottom: 8 }}>
                {heroHeadline(result.score)}
              </div>
              {result.technical_analysis?.reasoning && (
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--rc-muted)", marginBottom: 16, maxWidth: 480 }}>
                  <MD>{result.technical_analysis.reasoning}</MD>
                </div>
              )}
              {result.breakdown && (
                <div style={{ borderTop: "1px solid var(--rc-border)", marginTop: result.technical_analysis?.reasoning ? 0 : 8, paddingTop: 16 }}>
                  <Eyebrow style={{ display: "block", marginBottom: 12 }}>Compatibility breakdown · higher is better</Eyebrow>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
                    <StatBarRow label="Keywords"   value={result.breakdown.keyword_match}    threshold={65} />
                    <StatBarRow label="Tech stack" value={result.breakdown.tech_stack_fit}   threshold={70} />
                    <StatBarRow label="Experience" value={result.breakdown.experience_level} threshold={60} />
                    <StatBarRow label="GitHub"     value={result.breakdown.github_signal}    threshold={70} />
                    <StatBarRow label="LinkedIn"   value={result.breakdown.linkedin_signal}  threshold={70} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Role dossier ── */}
        {jd && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 6, padding: "12px 26px", borderBottom: "1px solid var(--rc-border)", background: "var(--rc-surface-hero)" }}>
            <Eyebrow style={{ marginRight: 16, color: "var(--rc-hint)", whiteSpace: "nowrap" }}>Target role</Eyebrow>
            <Mono style={{ fontSize: 14, fontWeight: 700, color: "var(--rc-text)", whiteSpace: "nowrap" }}>{jd.pay}</Mono>
            {jdMeta && <><Mono style={{ color: "var(--rc-border)", margin: "0 12px" }}>/</Mono><Mono style={{ fontSize: 12, color: "var(--rc-muted)", letterSpacing: "0.01em" }}>{jdMeta}</Mono></>}
          </div>
        )}

        {/* ── Tab bar ── */}
        <div style={{ flexShrink: 0, display: "flex", gap: 2, padding: "0 26px", borderBottom: "1px solid var(--rc-border)", background: "var(--rc-surface)" }}>
          {TABS.map((t) => {
            const on = t.id === activeTab;
            const badgeColor = t.tone === "amber" ? "var(--rc-amber)" : on ? "var(--rc-red)" : "var(--rc-hint)";
            return (
              <div key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "13px 14px", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: on ? 600 : 500, color: on ? "var(--rc-red)" : "var(--rc-hint)", borderBottom: `2px solid ${on ? "var(--rc-red)" : "transparent"}`, cursor: "pointer", userSelect: "none" }}>
                {t.label}
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
              <CVBody result={result} />
              {hasShortlisted && (
                <div style={{ marginTop: 48 }}>
                  <ImproveTab
                    reconstructedCv={reconstructedCv ?? null}
                    isLoading={isRewriting}
                    isPremium={true}
                    hasAnalysisId={!!analysisId}
                    onRewrite={onRewrite ?? (() => {})}
                  />
                </div>
              )}
              {hasShortlisted && (
                <div style={{ marginTop: 32 }}>
                  <CoverLetterTab
                    analysisId={analysisId}
                    isPremium={true}
                    company={result.job_details?.company ?? null}
                    candidateName={null}
                    savedCoverLetter={null}
                  />
                </div>
              )}
            </div>
          )}

          {/* Signals */}
          {activeTab === "signals" && (
            <div style={{ padding: "28px 30px" }}>
              <SignalsTab
                github={result.audit.github}
                linkedin={result.audit.linkedin}
                hasGithub={result.audit.github.score !== null || result.audit.github.issues.length > 0}
                hasLinkedin={result.audit.linkedin.score !== null || result.audit.linkedin.issues.length > 0}
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
                      Bridge project not available.
                    </div>
                  )
                )}

                {activePlan === "negotiate" && (
                  hasHired ? (
                    <NegotiationTab result={result} analysisId={analysisId} isPremium={true} />
                  ) : (
                    <div style={{ padding: "48px 0", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-hint)" }}>
                      Negotiation analysis available on the Hired plan.
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
    </div>
  );
}
