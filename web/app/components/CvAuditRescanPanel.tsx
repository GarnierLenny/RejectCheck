"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { consumeSSE } from "../../lib/sse";
import { useLanguage } from "../../context/language";
import { SectionBand } from "./SectionBand";

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
  why?: string;
  rewrite?: string | null;
};

type Props = {
  analysisId: number | null;
  accessToken: string | null;
  reconstructedCv: string | null;
  currentOverall: number;
  bulletReviews?: BulletReview[];
  /** Set when the user clicks a highlighted bullet in the left parsed-CV panel. */
  focusedOriginal?: string | null;
  /** Bumped on each left-panel click so re-clicking the same bullet re-focuses. */
  focusNonce?: number;
};

const COPY = {
  en: {
    kicker: "09 · Re-audit loop",
    title: "Fix your CV, watch the score move.",
    intro:
      "Accept or tweak the suggested rewrites for your weak bullets. We rebuild your CV from your edits, no pasting. Re-audit and your six quality scores are re-judged so you see exactly what moved. Uses one analysis credit.",
    weakHeading: "Weak or fatal bullets to fix first",
    suggestion: "Suggested rewrite",
    editorLabel: "Your CV text",
    placeholder: "Paste or edit your full CV text here, then re-audit.",
    accept: "Accept",
    accepted: "Accepted",
    rewritePlaceholder: "Write your improved bullet",
    hint: "Tip: click a highlighted bullet in your CV on the left to jump straight to it.",
    noneAccepted: "Accept at least one rewrite to re-audit.",
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
    kicker: "09 · Boucle de re-audit",
    title: "Corrige ton CV, regarde le score bouger.",
    intro:
      "Accepte ou ajuste les réécritures suggérées pour tes bullets faibles. On reconstruit ton CV à partir de tes modifications, sans copier-coller. Relance l'audit : tes six scores de qualité sont re-jugés et tu vois exactement ce qui a bougé. Consomme un crédit d'analyse.",
    weakHeading: "Bullets faibles ou fatals à corriger en priorité",
    suggestion: "Réécriture suggérée",
    editorLabel: "Le texte de ton CV",
    placeholder: "Colle ou édite le texte complet de ton CV ici, puis relance l'audit.",
    accept: "Accepter",
    accepted: "Accepté",
    rewritePlaceholder: "Écris ta version améliorée",
    hint: "Astuce : clique un bullet surligné dans ton CV à gauche pour aller droit dessus.",
    noneAccepted: "Accepte au moins une réécriture pour relancer l'audit.",
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
  focusedOriginal = null,
  focusNonce = 0,
}: Props) {
  const { locale, localePath } = useLanguage();
  const L = locale === "fr" ? COPY.fr : COPY.en;
  const langKey = locale === "fr" ? "fr" : "en";

  // Editable weak/fatal bullets (verdict != strong), prefilled with the model's
  // rewrite. The user accepts or tweaks each, and we rebuild the CV from those
  // edits, no pasting.
  const improvable = useMemo(
    () =>
      (bulletReviews ?? []).filter(
        (b) => b.verdict && b.verdict !== "strong" && (b.original ?? "").trim().length > 0,
      ),
    [bulletReviews],
  );

  const base = reconstructedCv ?? "";
  const editorMode = base.trim().length > 0 && improvable.length > 0;

  // original -> user's edited text (defaults to the suggested rewrite).
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  // Fallback path only: raw CV textarea, used when there is no parsed CV or no bullets.
  const [fallbackText, setFallbackText] = useState(base);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deltas, setDeltas] = useState<CvReviewRescanDeltas | null>(null);
  const [newId, setNewId] = useState<number | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pulse, setPulse] = useState<string | null>(null);

  const valueOf = (b: BulletReview): string => {
    const o = b.original ?? "";
    return edits[o] ?? b.rewrite ?? o;
  };
  const isResolved = (b: BulletReview): boolean => {
    const o = (b.original ?? "").trim();
    const v = valueOf(b).trim();
    return accepted.has(b.original ?? "") && v.length > 0 && v !== o;
  };
  const dirtyCount = improvable.filter(isResolved).length;

  const buildEditedCv = (): string => {
    let out = base;
    for (const b of improvable) {
      if (isResolved(b) && b.original) out = out.replace(b.original, valueOf(b).trim());
    }
    return out;
  };

  const assembledCv = editorMode ? buildEditedCv() : fallbackText.trim();
  const canRun =
    !!analysisId &&
    !!accessToken &&
    !busy &&
    assembledCv.trim().length >= MIN_CHARS &&
    (editorMode ? dirtyCount > 0 : true);

  const toggleAccept = (original: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(original)) next.delete(original);
      else next.add(original);
      return next;
    });
  };

  // Left-panel bullet click: scroll its editor card into view and pulse it.
  useEffect(() => {
    if (!focusedOriginal) return;
    const el = cardRefs.current[focusedOriginal];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setPulse(focusedOriginal);
    const t = setTimeout(() => setPulse(null), 1600);
    return () => clearTimeout(t);
  }, [focusNonce, focusedOriginal]);

  const run = async () => {
    if (!analysisId || !accessToken || busy) return;
    const cvText = assembledCv.trim();
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
      <SectionBand className="mb-8" tag={L.kicker} title={L.title} subtitle={L.intro} />

      <div
        style={{
          background: "var(--rc-surface)",
          border: "1px solid var(--rc-border)",
          borderRadius: 6,
          padding: "24px 28px",
        }}
      >
        {editorMode ? (
          <div style={{ marginBottom: 4 }}>
            <div
              style={{
                ...MONO,
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--rc-hint)",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {L.weakHeading}
            </div>
            <p style={{ ...SANS, fontSize: 12.5, color: "var(--rc-hint)", margin: "0 0 14px", lineHeight: 1.5 }}>
              {L.hint}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {improvable.map((b, i) => {
                const o = b.original ?? "";
                const resolved = isResolved(b);
                const isPulse = pulse === o;
                const value = valueOf(b);
                return (
                  <div
                    key={`${o.slice(0, 30)}-${i}`}
                    ref={(el) => {
                      cardRefs.current[o] = el;
                    }}
                    style={{
                      border: `1px solid ${resolved ? "var(--rc-green-border)" : isPulse ? "var(--rc-red)" : "var(--rc-border)"}`,
                      borderRadius: 8,
                      padding: "12px 14px",
                      background: resolved ? "var(--rc-green-bg)" : "var(--rc-bg, transparent)",
                      boxShadow: isPulse ? "0 0 0 3px color-mix(in srgb, var(--rc-red) 18%, transparent)" : "none",
                      transition: "box-shadow 0.3s, border-color 0.3s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          ...MONO,
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
                      {b.why && (
                        <span style={{ ...SANS, fontSize: 11.5, color: "var(--rc-muted)" }}>{b.why}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleAccept(o)}
                        disabled={busy}
                        style={{
                          marginLeft: "auto",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          ...MONO,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          padding: "5px 10px",
                          borderRadius: 5,
                          cursor: busy ? "default" : "pointer",
                          border: `1px solid ${resolved ? "var(--rc-green)" : "var(--rc-border)"}`,
                          background: resolved ? "var(--rc-green)" : "transparent",
                          color: resolved ? "#fff" : "var(--rc-text)",
                          flexShrink: 0,
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                        {resolved ? L.accepted : L.accept}
                      </button>
                    </div>
                    <div
                      style={{
                        ...SANS,
                        fontSize: 12.5,
                        color: "var(--rc-hint)",
                        textDecoration: resolved ? "line-through" : "none",
                        marginBottom: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {o}
                    </div>
                    <textarea
                      value={value}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [o]: e.target.value }))}
                      rows={2}
                      placeholder={L.rewritePlaceholder}
                      disabled={busy}
                      style={{
                        ...SANS,
                        width: "100%",
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "var(--rc-text)",
                        background: "var(--rc-surface)",
                        border: "1px solid var(--rc-border)",
                        borderRadius: 5,
                        padding: "8px 10px",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
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
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
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
          </>
        )}

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
          {editorMode && dirtyCount > 0 && !busy && (
            <span style={{ ...MONO, fontSize: 11, color: "var(--rc-green)", fontWeight: 700 }}>
              {dirtyCount} {L.accepted.toLowerCase()}
            </span>
          )}
          {editorMode && dirtyCount === 0 && !error && (
            <span style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)" }}>{L.noneAccepted}</span>
          )}
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
