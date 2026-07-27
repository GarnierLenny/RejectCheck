"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import type { AnalysisResult } from "../types";
import type { KeywordMatchEntry } from "./types";
import {
  projectCoverage,
  projectRisk,
  type ProjectionKeywordRow,
} from "../../lib/score-projection";
import {
  isBulletResolved as isResolved,
  isBulletPendingFill,
} from "../../lib/cv-draft";
import { placeholderCount, firstPlaceholderRange } from "../../lib/placeholders";

type Props = {
  result: AnalysisResult;
  keywords: KeywordMatchEntry[];
  busy: boolean;
  onCommit: (editedCvText: string) => void;
  /** t.analysisLayout.rescan.optimize */
  ro: Record<string, string>;
  /**
   * CONTROLLED draft state, owned by AnalysisLayout so the source-document panel
   * on the left can render the very same draft. This component used to own it
   * privately, which is why the user's edits were invisible in the document they
   * were editing. See app/lib/cv-draft.ts.
   */
  added: ReadonlySet<string>;
  edits: Record<string, string>;
  onToggleKeyword: (term: string) => void;
  onEditBullet: (original: string, text: string) => void;
  /** The assembled draft (same value the left panel renders). Committed as-is. */
  draft: string;
  /** Reports the live projected risk up, for the sticky score header. */
  onProjectedRiskChange?: (risk: number) => void;
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
 *
 * The draft itself is NOT owned here (see Props.added/edits): AnalysisLayout owns
 * it so the left-hand document renders the same text the user is editing.
 */
export function InlineOptimize({
  result,
  keywords,
  busy,
  onCommit,
  ro,
  added,
  edits,
  onToggleKeyword,
  onEditBullet,
  draft,
  onProjectedRiskChange,
}: Props) {
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

  const isBulletResolved = (original: string): boolean =>
    isResolved(original, edits);

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

  // B2: bullets the user edited but left holding an [X]/[N] placeholder. They
  // never count as resolved (the guard in cv-draft keeps them out of the
  // projected score and the draft), and they block the commit until filled.
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const pendingFill = weakBullets.filter((b) => isBulletPendingFill(b.original, edits));
  const pendingCount = pendingFill.length;
  const jumpToFirstPending = () => {
    const first = pendingFill[0]?.original;
    if (first) textareaRefs.current[first]?.focus();
  };

  // Publish the live projection so the sticky score header can show the same
  // "current -> projected" the strip below shows. Effect (not render-phase) so
  // the parent setState never happens while this component is rendering.
  useEffect(() => {
    onProjectedRiskChange?.(projectedRisk);
  }, [projectedRisk, onProjectedRiskChange]);

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
                  onClick={() => onToggleKeyword(k.term)}
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
              // Only what the user has actually committed lands in the textarea
              // and counts toward the projected score. The AI rewrite is offered
              // via an explicit "Apply suggestion" button below — never silently
              // prefilled, which would show a fix that the score ignores.
              const value = edits[b.original] ?? "";
              const canApply = !!b.rewrite && b.rewrite.trim() !== b.original.trim() && value.trim() !== b.rewrite.trim();
              // B2: rewrite (or current text) still holds a placeholder → the
              // suggestion is a template to fill, not a finished fix.
              const rewriteHasPlaceholder = !!b.rewrite && placeholderCount(b.rewrite) > 0;
              const pendingThis = isBulletPendingFill(b.original, edits);
              const nToFill = placeholderCount(value);
              return (
                <div
                  key={`${b.original.slice(0, 24)}-${i}`}
                  style={{
                    border: `1px solid ${resolved ? "var(--rc-green-border)" : pendingThis ? "var(--rc-amber-border)" : "var(--rc-border)"}`,
                    borderRadius: 7,
                    padding: "10px 12px",
                    background: resolved ? "var(--rc-green-bg)" : pendingThis ? "var(--rc-amber-bg)" : "var(--rc-surface)",
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
                  {canApply && (
                    <button
                      onClick={() => {
                        const applied = b.rewrite!.trim();
                        onEditBullet(b.original, applied);
                        // If the applied template still has a placeholder, drop
                        // the cursor on the first one so the number is next.
                        const range = firstPlaceholderRange(applied);
                        if (range) {
                          requestAnimationFrame(() => {
                            const el = textareaRefs.current[b.original];
                            if (!el) return;
                            el.focus();
                            el.setSelectionRange(range[0], range[1]);
                          });
                        }
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                        padding: "5px 10px",
                        borderRadius: 5,
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        border: "1px solid var(--rc-green-border)",
                        background: "var(--rc-green-bg)",
                        color: "var(--rc-green)",
                      }}
                    >
                      <Sparkles size={11} /> {rewriteHasPlaceholder ? ro.useAndFill : ro.applySuggestion}
                    </button>
                  )}
                  <textarea
                    ref={(el) => {
                      textareaRefs.current[b.original] = el;
                    }}
                    value={value}
                    onChange={(e) => onEditBullet(b.original, e.target.value)}
                    rows={2}
                    placeholder={b.rewrite ? b.rewrite : ro.rewritePlaceholder}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "var(--rc-text)",
                      background: "var(--rc-bg)",
                      border: `1px solid ${pendingThis ? "var(--rc-amber-border)" : "var(--rc-border)"}`,
                      borderRadius: 5,
                      padding: "7px 9px",
                    }}
                  />
                  {pendingThis && (
                    <div style={{ marginTop: 6, lineHeight: 1.45 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--rc-amber)" }}>
                        {nToFill} {ro.toFill}
                      </span>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--rc-hint)", marginLeft: 8 }}>
                        {ro.fillHint}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commit */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        {(() => {
          // Block the paid re-scan while any accepted bullet still holds a
          // placeholder: committing would ship "[X]" or silently drop the edit.
          const blocked = busy || !dirty || pendingCount > 0;
          return (
            <button
              onClick={() => onCommit(draft)}
              disabled={blocked}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "9px 16px",
                border: "1px solid var(--rc-text)",
                borderRadius: 5,
                background: blocked ? "var(--rc-surface)" : "var(--rc-text)",
                color: blocked ? "var(--rc-hint)" : "#fff",
                cursor: blocked ? "not-allowed" : "pointer",
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
                <>
                  {ro.validate} <span style={{ opacity: 0.75, fontWeight: 600 }}>{ro.creditNote}</span>
                </>
              )}
            </button>
          );
        })()}
        {pendingCount > 0 && !busy ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, color: "var(--rc-amber)", letterSpacing: "0.03em" }}>
              {pendingCount} {ro.toFill}
            </span>
            <button
              type="button"
              onClick={jumpToFirstPending}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--rc-amber)",
                background: "transparent",
                border: "1px solid var(--rc-amber-border)",
                borderRadius: 5,
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              {ro.jumpToFix} →
            </button>
          </span>
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--rc-hint)", letterSpacing: "0.02em" }}>
            {ro.paidNote}
          </span>
        )}
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
