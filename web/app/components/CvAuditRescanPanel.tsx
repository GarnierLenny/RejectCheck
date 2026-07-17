"use client";

import { useState } from "react";
import { consumeSSE } from "../../lib/sse";
import { useLanguage } from "../../context/language";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

/** Minimum edited-CV length, mirrors the backend MIN_INLINE_CV_CHARS gate. */
const MIN_CHARS = 200;

type Delta = { before: number | null; after: number | null; delta: number | null };

type CvReviewRescanDeltas = {
  overall: Delta;
  subScores: {
    clarity: Delta;
    impact: Delta;
    hard_skills: Delta;
    soft_skills: Delta;
    consistency: Delta;
    ats_format: Delta;
  };
  atsAudit: Delta;
  resolvedIssueCount: number;
  newIssueCount: number;
};

type SsePayload =
  | { step: "cv_review_rescan_deltas"; deltas: CvReviewRescanDeltas }
  | { step: "done"; analysisId: number | null }
  | { step: "error"; message?: string }
  | { step: string; [k: string]: unknown };

type BulletReview = {
  original?: string;
  verdict?: string;
  rewrite?: string | null;
};

type Props = {
  analysisId: number | null;
  accessToken: string | null;
  reconstructedCv: string | null;
  currentOverall: number;
  bulletReviews?: BulletReview[];
};

const COPY = {
  en: {
    kicker: "§ 02.6 · Re-audit loop",
    title: "Fix your CV, watch the score move.",
    intro:
      "Edit your CV below and re-audit it. Your six quality scores are re-judged and you see exactly what moved. Uses one analysis credit.",
    weakHeading: "Weak or fatal bullets to fix first",
    suggestion: "Suggested rewrite",
    editorLabel: "Your CV text",
    placeholder: "Paste or edit your full CV text here, then re-audit.",
    run: "Re-audit my CV",
    running: "Re-auditing, this takes a moment...",
    resultTitle: "What moved",
    overall: "Overall quality",
    resolved: "resolved",
    appeared: "new",
    noNew: "no new issues introduced",
    held: "The score held: the recruiter-judgment dimensions didn't shift this pass. Keep tightening bullets, then re-audit.",
    open: "Open the updated audit",
    tooShort: "Keep your full CV text, not just the edits.",
    error: "Re-audit failed. Try again.",
  },
  fr: {
    kicker: "§ 02.6 · Boucle de re-audit",
    title: "Corrige ton CV, regarde le score bouger.",
    intro:
      "Édite ton CV ci-dessous et relance l'audit. Tes six scores de qualité sont re-jugés et tu vois exactement ce qui a bougé. Consomme un crédit d'analyse.",
    weakHeading: "Bullets faibles ou fatals à corriger en priorité",
    suggestion: "Réécriture suggérée",
    editorLabel: "Le texte de ton CV",
    placeholder: "Colle ou édite le texte complet de ton CV ici, puis relance l'audit.",
    run: "Re-auditer mon CV",
    running: "Re-audit en cours, ça prend un instant...",
    resultTitle: "Ce qui a bougé",
    overall: "Qualité globale",
    resolved: "résolues",
    appeared: "nouvelles",
    noNew: "aucune nouvelle issue introduite",
    held: "Le score a tenu : les dimensions de jugement recruteur n'ont pas bougé sur cette passe. Resserre encore les bullets, puis relance.",
    open: "Ouvrir l'audit mis à jour",
    tooShort: "Garde tout le texte de ton CV, pas seulement les corrections.",
    error: "Le re-audit a échoué. Réessaie.",
  },
};

const SUB_ORDER: Array<keyof CvReviewRescanDeltas["subScores"]> = [
  "impact",
  "clarity",
  "hard_skills",
  "soft_skills",
  "consistency",
  "ats_format",
];

const SUB_LABELS: Record<string, { en: string; fr: string }> = {
  clarity: { en: "Clarity", fr: "Clarté" },
  impact: { en: "Impact", fr: "Impact" },
  hard_skills: { en: "Hard skills", fr: "Hard skills" },
  soft_skills: { en: "Soft skills", fr: "Soft skills" },
  consistency: { en: "Consistency", fr: "Cohérence" },
  ats_format: { en: "ATS format", fr: "Format ATS" },
};

/** Green when a quality score goes UP (higher = better), red when it drops. */
function deltaColor(delta: number | null): string {
  if (delta == null || delta === 0) return "var(--rc-hint)";
  return delta > 0 ? "var(--rc-green)" : "var(--rc-red)";
}

function fmtDelta(delta: number | null): string {
  if (delta == null) return "";
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

const MONO = { fontFamily: "var(--rc-mono, ui-monospace, monospace)" } as const;
const SANS = { fontFamily: "var(--rc-sans, system-ui, sans-serif)" } as const;

/** The sub-score that gained the most on this re-audit (for the "what moved" line). */
function biggestMover(
  deltas: CvReviewRescanDeltas,
): { key: keyof CvReviewRescanDeltas["subScores"]; delta: number } | null {
  let best: { key: keyof CvReviewRescanDeltas["subScores"]; delta: number } | null = null;
  for (const key of SUB_ORDER) {
    const d = deltas.subScores[key];
    if (d.delta != null && d.delta > 0 && (best === null || d.delta > best.delta)) {
      best = { key, delta: d.delta };
    }
  }
  return best;
}

/** The sub-score that fell the most on this re-audit (for an honest drop line). */
function biggestDrop(
  deltas: CvReviewRescanDeltas,
): { key: keyof CvReviewRescanDeltas["subScores"]; delta: number } | null {
  let best: { key: keyof CvReviewRescanDeltas["subScores"]; delta: number } | null = null;
  for (const key of SUB_ORDER) {
    const d = deltas.subScores[key];
    if (d.delta != null && d.delta < 0 && (best === null || d.delta < best.delta)) {
      best = { key, delta: d.delta };
    }
  }
  return best;
}

export function CvAuditRescanPanel({
  analysisId,
  accessToken,
  reconstructedCv,
  currentOverall,
  bulletReviews,
}: Props) {
  const { locale, localePath } = useLanguage();
  const L = locale === "fr" ? COPY.fr : COPY.en;
  const langKey = locale === "fr" ? "fr" : "en";

  const [text, setText] = useState(reconstructedCv ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deltas, setDeltas] = useState<CvReviewRescanDeltas | null>(null);
  const [newId, setNewId] = useState<number | null>(null);

  const weak = (bulletReviews ?? [])
    .filter((b) => b.verdict && b.verdict !== "strong" && b.rewrite)
    .slice(0, 5);

  const canRun = !!analysisId && !!accessToken && text.trim().length >= MIN_CHARS && !busy;

  const run = async () => {
    if (!analysisId || !accessToken || busy) return;
    const cvText = text.trim();
    if (cvText.length < MIN_CHARS) {
      setError(L.tooShort);
      return;
    }
    setBusy(true);
    setError(null);
    setDeltas(null);
    setNewId(null);
    try {
      const res = await fetch(
        `${apiUrl}/api/analyze/${analysisId}/rescan-cv-review`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cvText, locale: langKey }),
        },
      );
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || L.error);
      }
      await consumeSSE<SsePayload>(res, (p) => {
        if (p.step === "cv_review_rescan_deltas") {
          const d = (p as { deltas?: CvReviewRescanDeltas }).deltas;
          if (d) setDeltas(d);
        } else if (p.step === "done") {
          const aid = (p as { analysisId?: number | null }).analysisId;
          if (typeof aid === "number") setNewId(aid);
        } else if (p.step === "error") {
          throw new Error((p as { message?: string }).message || L.error);
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : L.error);
    } finally {
      setBusy(false);
    }
  };

  const openUpdated = () => {
    if (newId == null) return;
    window.location.assign(`${localePath("/analyze")}?id=${newId}`);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            ...MONO,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--rc-hint)",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          {L.kicker}
        </div>
        <h2
          style={{
            ...SANS,
            fontWeight: 500,
            fontSize: "clamp(24px,2.8vw,36px)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            margin: 0,
            maxWidth: 720,
          }}
        >
          {L.title}
        </h2>
        <p style={{ ...SANS, fontSize: 14, color: "var(--rc-hint)", maxWidth: 640, marginTop: 12 }}>
          {L.intro}
        </p>
      </div>

      <div
        style={{
          background: "var(--rc-surface)",
          border: "1px solid var(--rc-border)",
          borderRadius: 6,
          padding: "24px 28px",
        }}
      >
        {weak.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--rc-hint)",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {L.weakHeading}
            </div>
            {weak.map((b, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--rc-border)",
                }}
              >
                <div style={{ ...SANS, fontSize: 13, color: "var(--rc-text)", opacity: 0.75, textDecoration: "line-through" }}>
                  {b.original}
                </div>
                {b.rewrite && (
                  <div style={{ ...SANS, fontSize: 13, color: "var(--rc-green)", marginTop: 4 }}>
                    <span style={{ ...MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--rc-hint)", marginRight: 6 }}>
                      {L.suggestion}
                    </span>
                    {b.rewrite}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <label
          style={{
            ...MONO,
            display: "block",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--rc-hint)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {L.editorLabel}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={L.placeholder}
          rows={12}
          disabled={busy}
          style={{
            ...SANS,
            width: "100%",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--rc-text)",
            background: "var(--rc-bg, transparent)",
            border: "1px solid var(--rc-border)",
            borderRadius: 6,
            padding: "12px 14px",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={run}
            disabled={!canRun}
            style={{
              ...MONO,
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: canRun ? "var(--rc-bg, #fff)" : "var(--rc-hint)",
              background: canRun ? "var(--rc-red)" : "var(--rc-surface-hero, var(--rc-border))",
              border: "none",
              borderRadius: 6,
              padding: "12px 22px",
              cursor: canRun ? "pointer" : "not-allowed",
            }}
          >
            {busy ? L.running : L.run}
          </button>
          {error && (
            <span style={{ ...SANS, fontSize: 13, color: "var(--rc-red)" }}>{error}</span>
          )}
        </div>

        {deltas && (
          <div style={{ marginTop: 26, borderTop: "1px solid var(--rc-border)", paddingTop: 22 }}>
            <div
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--rc-hint)",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              {L.resultTitle}
            </div>

            {/* Overall headline movement */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
              <span style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)" }}>{L.overall}</span>
              <span style={{ ...MONO, fontSize: 22, fontWeight: 700, color: "var(--rc-text)" }}>
                {deltas.overall.before ?? currentOverall} → {deltas.overall.after ?? "?"}
              </span>
              <span style={{ ...MONO, fontSize: 16, fontWeight: 700, color: deltaColor(deltas.overall.delta) }}>
                {fmtDelta(deltas.overall.delta)}
              </span>
            </div>

            {/* What moved / why it held (item 2: honest score explanation) */}
            {(() => {
              const od = deltas.overall.delta;
              let text: string;
              if (od != null && od > 0) {
                const mv = biggestMover(deltas);
                text = mv
                  ? langKey === "fr"
                    ? `Score global +${od}. Plus gros gain : ${SUB_LABELS[mv.key][langKey]} +${mv.delta}.`
                    : `Overall +${od}. Biggest gain: ${SUB_LABELS[mv.key][langKey]} +${mv.delta}.`
                  : langKey === "fr"
                    ? `Score global +${od}.`
                    : `Overall +${od}.`;
              } else if (od != null && od < 0) {
                const dr = biggestDrop(deltas);
                text = dr
                  ? langKey === "fr"
                    ? `Score global ${od}. Plus grosse baisse : ${SUB_LABELS[dr.key][langKey]} ${dr.delta}.`
                    : `Overall ${od}. Biggest drop: ${SUB_LABELS[dr.key][langKey]} ${dr.delta}.`
                  : langKey === "fr"
                    ? `Score global ${od}.`
                    : `Overall ${od}.`;
              } else {
                text = L.held;
              }
              return (
                <div style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)", marginBottom: 18, lineHeight: 1.5 }}>
                  {text}
                </div>
              );
            })()}

            {/* Six sub-score movements */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              {SUB_ORDER.map((key) => {
                const d = deltas.subScores[key];
                return (
                  <div
                    key={key}
                    style={{
                      border: "1px solid var(--rc-border)",
                      borderRadius: 6,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: 6 }}>
                      {SUB_LABELS[key][langKey]}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ ...MONO, fontSize: 14, color: "var(--rc-text)" }}>
                        {d.before ?? "?"} → {d.after ?? "?"}
                      </span>
                      <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: deltaColor(d.delta) }}>
                        {fmtDelta(d.delta)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Issue churn + open updated audit */}
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 20, flexWrap: "wrap" }}>
              {deltas.resolvedIssueCount > 0 && (
                <span style={{ ...MONO, fontSize: 12, color: "var(--rc-green)", fontWeight: 700 }}>
                  {deltas.resolvedIssueCount} {L.resolved}
                </span>
              )}
              {deltas.newIssueCount > 0 && (
                <span style={{ ...MONO, fontSize: 12, color: "var(--rc-red)", fontWeight: 700 }}>
                  {deltas.newIssueCount} {L.appeared}
                </span>
              )}
              {deltas.newIssueCount === 0 && (
                <span
                  style={{
                    ...MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    // Green only when there was real progress; a no-op re-scan
                    // shows it neutral rather than earning a false win.
                    color:
                      deltas.resolvedIssueCount > 0 || (deltas.overall.delta ?? 0) > 0
                        ? "var(--rc-green)"
                        : "var(--rc-hint)",
                  }}
                >
                  {L.noNew}
                </span>
              )}
              {newId != null && (
                <button
                  type="button"
                  onClick={openUpdated}
                  style={{
                    ...MONO,
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "var(--rc-text)",
                    background: "transparent",
                    border: "1px solid var(--rc-border)",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "pointer",
                  }}
                >
                  {L.open} →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
