"use client";

import { Github, Linkedin } from "react-bootstrap-icons";
import type { AnalysisResult } from "../types";
import type { Fix } from "../types";
import { useLanguage } from "../../../context/language";

// ── Helpers ───────────────────────────────────────────────────────────────────

const R_SM = "4px";
const R_MD = "8px";

const sevColor = (s: string) =>
  s === "critical" ? "var(--rc-red)" : s === "major" ? "var(--rc-amber)" : "var(--rc-hint)";

const scoreColor = (n: number | null) =>
  n === null ? "var(--rc-hint)" : n >= 70 ? "var(--rc-green)" : n >= 50 ? "var(--rc-amber)" : "var(--rc-red)";

function MD({ children }: { children: string }) {
  const parts = children.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700 }}>{p}</strong> : <span key={i}>{p}</span>
      )}
    </>
  );
}

function Eyebrow({ children, color, style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: color ?? "var(--rc-hint)", ...style }}>
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

function FixBlock({ fix }: { fix: Fix | null | undefined }) {
  const { t } = useLanguage();
  if (!fix) return null;
  return (
    <div style={{ marginTop: 16, paddingLeft: 18 }}>
      <Eyebrow color="var(--rc-green)" style={{ display: "block", marginBottom: 8 }}>{t.analysisLayout.diffRow.label} · <Mono style={{ fontSize: 10 }}>◷ {fix.time_required}</Mono></Eyebrow>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--rc-text)", lineHeight: 1.5, marginBottom: 10 }}>
        <MD>{fix.summary}</MD>
      </div>
      {fix.steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-muted)", lineHeight: 1.55, marginBottom: 6 }}>
          <Mono style={{ color: "var(--rc-green)", flexShrink: 0, fontWeight: 700, fontSize: 11 }}>{i + 1}</Mono>
          <MD>{s}</MD>
        </div>
      ))}
    </div>
  );
}

// ── Source card ───────────────────────────────────────────────────────────────

type SignalSource = AnalysisResult["audit"]["github"] | AnalysisResult["audit"]["linkedin"];

function SourceCard({
  icon, label, source, hasData, emptyMsg,
}: {
  icon: React.ReactNode;
  label: string;
  source: SignalSource;
  hasData: boolean;
  emptyMsg: string;
}) {
  const { t } = useLanguage();
  const issues    = source.issues    ?? [];
  const strengths = source.strengths ?? [];
  const col = scoreColor(source.score);
  const critical = issues.filter((i) => i.severity === "critical").length;
  const major    = issues.filter((i) => i.severity === "major").length;
  const minor    = issues.filter((i) => i.severity === "minor").length;

  return (
    <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--rc-hint)" }}>{icon}</span>
          <Eyebrow>{label}</Eyebrow>
        </div>
        {source.score !== null ? (
          <Mono style={{ fontWeight: 700, fontSize: 22, color: col, lineHeight: 1 }}>
            {source.score}<span style={{ fontSize: 11, opacity: 0.5 }}>/100</span>
          </Mono>
        ) : (
          <Mono style={{ fontSize: 11, color: "var(--rc-hint)" }}>N/A</Mono>
        )}
      </div>

      {!hasData ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-hint)", lineHeight: 1.6, margin: 0 }}>{emptyMsg}</p>
      ) : (
        <>
          {/* Stat rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: strengths.length > 0 ? 16 : 0 }}>
            {[
              { label: t.signalsTabNew.statCritical, val: critical, color: critical > 0 ? "var(--rc-red)"   : "var(--rc-green)", text: critical > 0 ? `${critical}` : t.signalsTabNew.statNone },
              { label: t.signalsTabNew.statMajor,    val: major,    color: major    > 0 ? "var(--rc-amber)"  : "var(--rc-green)", text: major    > 0 ? `${major}`    : t.signalsTabNew.statNone },
              { label: t.signalsTabNew.statMinor,    val: minor,    color: minor    > 0 ? "var(--rc-hint)"   : "var(--rc-green)", text: minor    > 0 ? `${minor}`    : t.signalsTabNew.statNone },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--rc-muted)" }}>{row.label}</span>
                <Mono style={{ fontSize: 11, color: row.color, fontWeight: 600 }}>{row.text}</Mono>
              </div>
            ))}
          </div>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 14, borderTop: "1px solid var(--rc-border)" }}>
              {strengths.map((s, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", padding: "4px 9px", borderRadius: R_SM, color: "var(--rc-green)", background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: 9999, background: "var(--rc-green)", flexShrink: 0 }} />
                  {s}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Issues list ───────────────────────────────────────────────────────────────

function IssuesList({ issues, label, onHighlightClick }: { issues: SignalSource["issues"]; label: string; onHighlightClick?: (idx: number) => void }) {
  const { t } = useLanguage();
  const safe = issues ?? [];
  if (safe.length === 0) return null;
  issues = safe;
  return (
    <div>
      <Eyebrow style={{ display: "block", marginBottom: 14 }}>{label} · {issues.length} {issues.length !== 1 ? t.signalsTabNew.findings : t.signalsTabNew.finding}</Eyebrow>
      <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, overflow: "hidden" }}>
        {issues.map((issue, i) => {
          const c = sevColor(issue.severity);
          return (
            <div
              key={i}
              onClick={() => onHighlightClick?.(i)}
              style={{ padding: "22px 26px", borderBottom: i === issues.length - 1 ? "none" : "1px solid var(--rc-border)", cursor: onHighlightClick ? "pointer" : undefined, transition: "background 0.1s" }}
              onMouseEnter={e => { if (onHighlightClick) (e.currentTarget as HTMLElement).style.background = "var(--rc-surface-raised)"; }}
              onMouseLeave={e => { if (onHighlightClick) (e.currentTarget as HTMLElement).style.background = ""; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 3, height: 12, background: c, flexShrink: 0 }} />
                <SevTag sev={issue.severity} />
                <Eyebrow>{issue.category}</Eyebrow>
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 600, color: "var(--rc-text)", lineHeight: 1.35, marginBottom: 8, letterSpacing: "-0.01em" }}>
                <MD>{issue.what}</MD>
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-muted)", lineHeight: 1.65 }}>
                <MD>{issue.why}</MD>
              </div>
              <FixBlock fix={issue.fix as Fix} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Props = {
  github: AnalysisResult["audit"]["github"];
  linkedin: AnalysisResult["audit"]["linkedin"];
  hasGithub: boolean;
  hasLinkedin: boolean;
  onHighlightClick?: (id: string) => void;
};

export function SignalsTab({ github, linkedin, hasGithub, hasLinkedin, onHighlightClick }: Props) {
  const { t } = useLanguage();
  const githubHasData  = hasGithub  || github.score  !== null || (github.issues?.length   ?? 0) > 0 || (github.strengths?.length   ?? 0) > 0;
  const linkedinHasData = hasLinkedin || linkedin.score !== null || (linkedin.issues?.length ?? 0) > 0 || (linkedin.strengths?.length ?? 0) > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* §06 headline */}
      <div>
        <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 10, letterSpacing: "0.16em" }}>{t.signalsTabNew.eyebrow}</Eyebrow>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--rc-text)", lineHeight: 1.18 }}>
          {t.signalsTabNew.titlePrefix} <span style={{ fontWeight: 700, color: "var(--rc-red)" }}>{t.signalsTabNew.titleItalic}</span> {t.signalsTabNew.titleSuffix}
        </div>
      </div>

      {/* Two-column source cards */}
      <div className="rc-col2-m" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SourceCard
          icon={<Github size={14} />}
          label="GitHub"
          source={github}
          hasData={githubHasData}
          emptyMsg={t.signalsTabNew.githubEmpty}
        />
        <SourceCard
          icon={<Linkedin size={14} />}
          label="LinkedIn"
          source={linkedin}
          hasData={linkedinHasData}
          emptyMsg={t.signalsTabNew.linkedinEmpty}
        />
      </div>

      {/* Issues per source */}
      {githubHasData && (
        <IssuesList
          issues={github.issues ?? []}
          label={t.signalsTabNew.githubFindings}
          onHighlightClick={onHighlightClick ? (i) => onHighlightClick(`github-${i}`) : undefined}
        />
      )}
      {linkedinHasData && (
        <IssuesList
          issues={linkedin.issues ?? []}
          label={t.signalsTabNew.linkedinFindings}
          onHighlightClick={onHighlightClick ? (i) => onHighlightClick(`linkedin-${i}`) : undefined}
        />
      )}

    </div>
  );
}
