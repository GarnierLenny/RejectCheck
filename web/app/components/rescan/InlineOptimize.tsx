"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import type { AnalysisResult } from "../types";
import type { KeywordMatchEntry } from "./types";
import {
  projectCoverage,
  projectRisk,
  type ProjectionKeywordRow,
} from "../../lib/score-projection";

type Props = {
  result: AnalysisResult;
  keywords: KeywordMatchEntry[];
  cvText: string;
  busy: boolean;
  onCommit: (editedCvText: string) => void;
  /** t.analysisLayout.rescan.optimize */
  ro: Record<string, string>;
};

/** 0-30 green · 31-65 amber · 66-100 red — matches the anchored verdict bands. */
function riskColor(v: number): string {
  return v <= 30 ? "var(--rc-green)" : v <= 65 ? "var(--rc-amber)" : "var(--rc-red)";
}

function countCriticalIssues(r: AnalysisResult): number {
  const buckets = [
    r.audit?.cv?.issues,
    r.audit?.github?.issues,
    r.audit?.linkedin?.issues,
  ];
  let n = 0;
  for (const bucket of buckets) {
    for (const issue of bucket ?? []) {
      if (issue?.severity === "critical") n += 1;
    }
  }
  return n;
}

/**
 * Inline re-scan loop (move 4). The user checks off missing keywords and edits
 * weak bullets right in the report; the projected anchored score updates live
 * (deterministic, free, no LLM), and "validate" commits the edited CV text to a
 * full re-scan (POST :id/rescan-inline). The projection mirrors the backend
 * anchored composite — see app/lib/score-projection.ts.
 */
export function InlineOptimize({ result, keywords, cvText, busy, onCommit, ro }: Props) {
  const breakdown = result.breakdown;
  const missing = useMemo(
    () => keywords.filter((k) => !k.presentInCv),
    [keywords],
  );
  const weakBullets = useMemo(
    () =>
      (result.bullet_reviews?.bullets ?? []).filter((b) => b.verdict !== "strong"),
    [result.bullet_reviews],
  );

  const [added, setAdded] = useState<Set<string>>(new Set());
  // original bullet text -> user's edited replacement.
  const [edits, setEdits] = useState<Record<string, string>>({});

  const isBulletResolved = (original: string): boolean => {
    const e = edits[original];
    return e != null && e.trim().length > 0 && e.trim() !== original.trim();
  };

  const rows: ProjectionKeywordRow[] = keywords.map((k) => ({
    term: k.term,
    required: k.required,
    presentInCv: k.presentInCv,
  }));

  const projectedCoverage = projectCoverage(rows, added);
  const fatalRemaining = weakBullets.filter(
    (b) => b.verdict === "fatal" && !isBulletResolved(b.original),
  ).length;

  const projected =
    breakdown &&
    projectRisk({
      coverageScore: projectedCoverage,
      keywordMatch: breakdown.keyword_match,
      techStackFit: breakdown.tech_stack_fit,
      experienceLevel: breakdown.experience_level,
      githubSignal: breakdown.github_signal,
      linkedinSignal: breakdown.linkedin_signal,
      atsScore: result.ats_simulation?.score ?? breakdown.keyword_match,
      redFlagCount: result.hidden_red_flags?.length ?? 0,
      criticalIssueCount: countCriticalIssues(result),
      fatalBulletCount: fatalRemaining,
    });

  const current = result.score;
  const projectedRisk = projected?.risk ?? current;
  const dirty = added.size > 0 || Object.keys(edits).some((k) => isBulletResolved(k));
  const improved = projectedRisk < current;

  const toggleKeyword = (term: string) => {
    setAdded((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  const buildEditedCv = (): string => {
    let text = cvText;
    for (const b of weakBullets) {
      if (isBulletResolved(b.original)) {
        text = text.replace(b.original, edits[b.original].trim());
      }
    }
    const addedList = [...added];
    if (addedList.length > 0) {
      text += `\n\n${ro.skillsLine}: ${addedList.join(", ")}`;
    }
    return text;
  };

  if (!breakdown) return null;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Sparkles size={14} style={{ color: "var(--rc-green)" }} />
        <span style={title}>{ro.title}</span>
      </div>
      <p style={hint}>{ro.subtitle}</p>

      {/* Projected score strip */}
      <div style={scoreStrip}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ScoreChip label={ro.current} value={100 - current} />
          <ArrowRight size={16} style={{ color: "var(--rc-hint)", flexShrink: 0 }} />
          <ScoreChip label={ro.projected} value={100 - projectedRisk} live />
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 700,
            color: improved ? "var(--rc-green)" : "var(--rc-hint)",
          }}
        >
          {dirty
            ? improved
              ? `+${current - projectedRisk} ${ro.riskDrop}`
              : ro.noChange
            : ro.noEdits}
        </span>
      </div>

      {/* Missing keywords */}
      {missing.length > 0 && (
        <div style={block}>
          <span style={blockLabel}>{ro.addKeywords}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
            {missing.map((k) => {
              const on = added.has(k.term);
              return (
                <button
                  key={k.term}
                  onClick={() => toggleKeyword(k.term)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: `1px solid ${on ? "var(--rc-green)" : k.required ? "var(--rc-red-border)" : "var(--rc-border)"}`,
                    background: on ? "var(--rc-green-bg)" : "var(--rc-surface)",
                    color: on ? "var(--rc-green)" : "var(--rc-text)",
                  }}
                >
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: 3,
                      border: `1px solid ${on ? "var(--rc-green)" : "var(--rc-border)"}`,
                      background: on ? "var(--rc-green)" : "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {on && <Check size={9} color="#fff" strokeWidth={3} />}
                  </span>
                  {k.term}
                  {k.required && !on && (
                    <span style={{ color: "var(--rc-red)", fontSize: 9 }}>{ro.req}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak / fatal bullets */}
      {weakBullets.length > 0 && (
        <div style={block}>
          <span style={blockLabel}>{ro.fixBullets}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {weakBullets.map((b, i) => {
              const resolved = isBulletResolved(b.original);
              const value = edits[b.original] ?? b.rewrite ?? b.original;
              return (
                <div
                  key={`${b.original.slice(0, 24)}-${i}`}
                  style={{
                    border: `1px solid ${resolved ? "var(--rc-green-border)" : "var(--rc-border)"}`,
                    borderRadius: 7,
                    padding: "10px 12px",
                    background: resolved ? "var(--rc-green-bg)" : "var(--rc-surface)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "2px 6px",
                        borderRadius: 3,
                        color: b.verdict === "fatal" ? "var(--rc-red)" : "var(--rc-amber)",
                        background: b.verdict === "fatal" ? "var(--rc-red-bg)" : "var(--rc-amber-bg)",
                      }}
                    >
                      {b.verdict}
                    </span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--rc-muted)" }}>
                      {b.why}
                    </span>
                    {resolved && <Check size={13} style={{ color: "var(--rc-green)", marginLeft: "auto" }} />}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      color: "var(--rc-hint)",
                      textDecoration: resolved ? "line-through" : "none",
                      marginBottom: 6,
                    }}
                  >
                    {b.original}
                  </div>
                  <textarea
                    value={value}
                    onChange={(e) =>
                      setEdits((prev) => ({ ...prev, [b.original]: e.target.value }))
                    }
                    rows={2}
                    placeholder={ro.rewritePlaceholder}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "var(--rc-text)",
                      background: "var(--rc-bg)",
                      border: "1px solid var(--rc-border)",
                      borderRadius: 5,
                      padding: "7px 9px",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commit */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => onCommit(buildEditedCv())}
          disabled={busy || !dirty}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "9px 16px",
            border: "1px solid var(--rc-text)",
            borderRadius: 5,
            background: busy || !dirty ? "var(--rc-surface)" : "var(--rc-text)",
            color: busy || !dirty ? "var(--rc-hint)" : "#fff",
            cursor: busy || !dirty ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          {busy ? (
            <>
              <Loader2 size={12} className="rc-spin" /> {ro.validating}
            </>
          ) : (
            ro.validate
          )}
        </button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--rc-hint)", letterSpacing: "0.02em" }}>
          {ro.paidNote}
        </span>
      </div>
    </div>
  );
}

function ScoreChip({ label, value, live }: { label: string; value: number; live?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--rc-hint)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1,
          color: riskColor(100 - value),
          transition: live ? "color 200ms" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

const wrap: CSSProperties = {
  border: "1px solid var(--rc-border)",
  borderRadius: 10,
  padding: "16px 18px",
  background: "var(--rc-surface-hero)",
  marginBottom: 18,
};
const title: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--rc-text)",
};
const hint: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 12.5,
  color: "var(--rc-muted)",
  lineHeight: 1.5,
  margin: "0 0 12px",
};
const scoreStrip: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 10,
  padding: "12px 14px",
  borderRadius: 8,
  background: "var(--rc-bg)",
  border: "1px solid var(--rc-border)",
};
const block: CSSProperties = { marginTop: 16 };
const blockLabel: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--rc-hint)",
};
