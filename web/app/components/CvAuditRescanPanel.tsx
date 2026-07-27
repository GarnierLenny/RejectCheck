"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { consumeSSE } from "../../lib/sse";
import { scrollIntoViewMotionSafe } from "../lib/scroll";
import { useLanguage } from "../../context/language";
import { SectionBand } from "./SectionBand";
import { AnimatedScore } from "./rescan/AnimatedScore";
import { placeholderCount, firstPlaceholderRange } from "../lib/placeholders";
import posthog from "posthog-js";

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
  /**
   * Publishes the live draft (base CV with resolved-and-filled bullets applied)
   * plus the rewritten lines, so the left source-document panel can reflect the
   * edits in place. Placeholder-bearing bullets are never resolved, so they never
   * reach the draft. Null when there is nothing to reflect. (Move B / B1.)
   */
  onDraftChange?: (draft: { text: string; changedLines: string[] } | null) => void;
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
    creditNote: "· 1 credit",
    running: "Re-auditing your CV...",
    progress: "Re-scoring your six quality dimensions, this takes ~30s.",
    unapplied: "of your accepted rewrites couldn't be matched to your CV text and weren't applied. Edit them directly in the box below.",
    outdated: "The report above still shows your previous audit. Open the updated version to see the new scores everywhere.",
    resultTitle: "What moved",
    overall: "Overall quality",
    resolved: "resolved",
    appeared: "new",
    noNew: "no new issues introduced",
    held: "The score held: the recruiter-judgment dimensions didn't shift this pass. Keep tightening bullets, then re-audit.",
    open: "Open the updated audit",
    tooShort: "Keep your full CV text, not just the edits.",
    error: "Re-audit failed. Try again.",
    useAndFill: "Use & add number",
    toFill: "to fill",
    fillHint: "Replace each [X] with your real number, or reword to drop the claim.",
    jumpToFix: "Jump to first",
    strengthened: "strengthened",
    improved: "Your CV got stronger."
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
    creditNote: "· 1 crédit",
    running: "Re-audit de ton CV...",
    progress: "On re-note tes six dimensions de qualité, ça prend ~30s.",
    unapplied: "de tes réécritures acceptées n'ont pas pu être retrouvées dans le texte de ton CV et n'ont pas été appliquées. Modifie-les directement dans le champ ci-dessous.",
    outdated: "Le rapport ci-dessus montre encore ton audit précédent. Ouvre la version mise à jour pour voir les nouveaux scores partout.",
    resultTitle: "Ce qui a bougé",
    overall: "Qualité globale",
    resolved: "résolues",
    appeared: "nouvelles",
    noNew: "aucune nouvelle issue introduite",
    held: "Le score a tenu : les dimensions de jugement recruteur n'ont pas bougé sur cette passe. Resserre encore les bullets, puis relance.",
    open: "Ouvrir l'audit mis à jour",
    tooShort: "Garde tout le texte de ton CV, pas seulement les corrections.",
    error: "Le re-audit a échoué. Réessaie.",
    useAndFill: "Ajouter un chiffre",
    toFill: "à chiffrer",
    fillHint: "Remplace chaque [X] par ton vrai chiffre, ou reformule pour retirer la revendication.",
    jumpToFix: "Aller au premier",
    strengthened: "renforcés",
    improved: "Votre CV s'est renforcé."
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

/**
 * Whitespace-tolerant replace: the bullet `original` comes from the parsed CV,
 * but the reconstructed CV text can differ by newlines/spacing, so an exact
 * `String.replace` silently no-ops and the edit never lands. We match the
 * original as a sequence of tokens separated by any whitespace. Returns the new
 * text and whether the original was actually found.
 */
function applyBulletEdit(
  text: string,
  original: string,
  replacement: string,
): { text: string; applied: boolean } {
  const trimmed = original.trim();
  if (!trimmed) return { text, applied: false };
  if (text.includes(trimmed)) {
    return { text: text.replace(trimmed, replacement), applied: true };
  }
  const escaped = trimmed
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  const re = new RegExp(escaped);
  if (re.test(text)) {
    return { text: text.replace(re, replacement), applied: true };
  }
  return { text, applied: false };
}

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
  onDraftChange,
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
  // Accepted rewrites whose original couldn't be located in the CV text (so
  // they weren't applied) — surfaced instead of silently dropped.
  const [unappliedCount, setUnappliedCount] = useState(0);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [pulse, setPulse] = useState<string | null>(null);

  const valueOf = (b: BulletReview): string => {
    const o = b.original ?? "";
    return edits[o] ?? b.rewrite ?? o;
  };
  // Resolved = accepted, actually changed from the original, AND carries no
  // unfilled [X]/[N] placeholder. The placeholder guard is what keeps a
  // number-shaped template from counting as a real fix, inflating the draft, or
  // committing to a re-audit that would then disagree. (Move B / B2.)
  const isResolved = (b: BulletReview): boolean => {
    const o = (b.original ?? "").trim();
    const v = valueOf(b).trim();
    return (
      accepted.has(b.original ?? "") &&
      v.length > 0 &&
      v !== o &&
      placeholderCount(v) === 0
    );
  };
  // Accepted but still holding a placeholder: counts as "needs a number", not as
  // a fix. Blocks the re-audit until filled or reworded.
  const isPendingFill = (b: BulletReview): boolean =>
    accepted.has(b.original ?? "") && placeholderCount(valueOf(b)) > 0;
  const dirtyCount = improvable.filter(isResolved).length;
  const pendingFill = improvable.filter(isPendingFill);
  const pendingFillCount = pendingFill.length;

  const buildEditedCv = (): { text: string; unapplied: number } => {
    let out = base;
    let unapplied = 0;
    for (const b of improvable) {
      if (isResolved(b) && b.original) {
        const r = applyBulletEdit(out, b.original, valueOf(b).trim());
        out = r.text;
        if (!r.applied) unapplied += 1;
      }
    }
    return { text: out, unapplied };
  };

  const assembledCv = editorMode ? buildEditedCv().text : fallbackText.trim();
  const canRun =
    !!analysisId &&
    !!accessToken &&
    !busy &&
    assembledCv.trim().length >= MIN_CHARS &&
    // Never re-audit while an accepted bullet still shows a placeholder: it
    // would either ship "[X]" or silently drop the edit. Block at this boundary.
    pendingFillCount === 0 &&
    (editorMode ? dirtyCount > 0 : true);

  const toggleAccept = (original: string) => {
    const wasAccepted = accepted.has(original);
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(original)) next.delete(original);
      else next.add(original);
      return next;
    });
    // On accept, if the applied rewrite still has a placeholder, drop the cursor
    // onto the first one so the number is the next thing the user types.
    if (!wasAccepted) {
      const current = edits[original] ?? improvable.find((b) => (b.original ?? "") === original)?.rewrite ?? "";
      const range = firstPlaceholderRange(current);
      if (range) {
        requestAnimationFrame(() => {
          const el = textareaRefs.current[original];
          if (!el) return;
          el.focus();
          el.setSelectionRange(range[0], range[1]);
        });
      }
    }
  };

  const jumpToFirstPending = () => {
    const first = pendingFill[0]?.original;
    if (!first) return;
    const el = cardRefs.current[first];
    if (el) scrollIntoViewMotionSafe(el, { block: "center" });
    setPulse(first);
    setTimeout(() => setPulse(null), 1600);
  };

  // Left-panel bullet click: scroll its editor card into view and pulse it.
  useEffect(() => {
    if (!focusedOriginal) return;
    const el = cardRefs.current[focusedOriginal];
    if (!el) return;
    scrollIntoViewMotionSafe(el, { block: "center" });
    setPulse(focusedOriginal);
    const t = setTimeout(() => setPulse(null), 1600);
    return () => clearTimeout(t);
  }, [focusNonce, focusedOriginal]);

  // B1: publish the live draft so the left source-document panel reflects the
  // accepted-and-filled edits in place. Only resolved bullets (no placeholder)
  // reach the draft, so the left CV never renders an unfilled "[X]". Keyed on
  // the assembled text so it republishes only when the applied CV changes.
  useEffect(() => {
    if (!onDraftChange) return;
    if (!editorMode || dirtyCount === 0) {
      onDraftChange(null);
      return;
    }
    const changedLines = improvable
      .filter(isResolved)
      .map((b) => valueOf(b).trim());
    onDraftChange({ text: assembledCv, changedLines });
    // isResolved/valueOf/improvable are recomputed each render but are pure
    // functions of edits/accepted/bulletReviews, captured via assembledCv+dirtyCount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode, assembledCv, dirtyCount, onDraftChange]);

  const run = async () => {
    if (!analysisId || !accessToken || busy) return;
    const built = editorMode ? buildEditedCv() : { text: fallbackText.trim(), unapplied: 0 };
    const cvText = built.text.trim();
    if (cvText.length < MIN_CHARS) {
      setError(L.tooShort);
      return;
    }
    setBusy(true);
    setError(null);
    setDeltas(null);
    setNewId(null);
    setUnappliedCount(built.unapplied);
    posthog.capture("rescan_started", { analysisId, source: "cv_review" });
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
          if (d) {
            setDeltas(d);
            posthog.capture("rescan_completed", {
              analysisId,
              source: "cv_review",
              overallBefore: d.overall.before,
              overallAfter: d.overall.after,
              improved: (d.overall.delta ?? 0) > 0,
              resolvedIssues: d.resolvedIssueCount,
            });
          }
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

            {/* B3: honest progress. Real facts (bullets strengthened / left to
                fill), never a projected score — for weak bullets the deterministic
                gain is 0, so a live number would be fiction. The score only moves
                on the actual re-audit below. */}
            {improvable.length > 0 && (dirtyCount > 0 || pendingFillCount > 0) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...MONO, fontSize: 11, color: "var(--rc-muted)", display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <strong style={{ color: "var(--rc-green)", fontSize: 13 }}>{dirtyCount}</strong>
                  <span>/ {improvable.length} {L.strengthened}</span>
                  {pendingFillCount > 0 && (
                    <span style={{ color: "var(--rc-amber)" }}>· {pendingFillCount} {L.toFill}</span>
                  )}
                </div>
                <div style={{ height: 4, background: "var(--rc-border)", borderRadius: 99, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round((dirtyCount / improvable.length) * 100)}%`,
                      background: "var(--rc-green)",
                      borderRadius: 99,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {improvable.map((b, i) => {
                const o = b.original ?? "";
                const resolved = isResolved(b);
                const isPulse = pulse === o;
                const value = valueOf(b);
                const pendingFillThis = isPendingFill(b);
                const nToFill = placeholderCount(value);
                const acceptLabel = resolved
                  ? L.accepted
                  : nToFill > 0
                    ? L.useAndFill
                    : L.accept;
                return (
                  <div
                    key={`${o.slice(0, 30)}-${i}`}
                    ref={(el) => {
                      cardRefs.current[o] = el;
                    }}
                    style={{
                      border: `1px solid ${resolved ? "var(--rc-green-border)" : pendingFillThis ? "var(--rc-amber-border)" : isPulse ? "var(--rc-red)" : "var(--rc-border)"}`,
                      borderRadius: 8,
                      padding: "12px 14px",
                      background: resolved ? "var(--rc-green-bg)" : pendingFillThis ? "var(--rc-amber-bg)" : "var(--rc-bg, transparent)",
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
                        {resolved && <Check size={12} strokeWidth={3} />}
                        {acceptLabel}
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
                      ref={(el) => {
                        textareaRefs.current[o] = el;
                      }}
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
                        border: `1px solid ${pendingFillThis ? "var(--rc-amber-border)" : "var(--rc-border)"}`,
                        borderRadius: 5,
                        padding: "8px 10px",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                    {pendingFillThis && (
                      <div style={{ marginTop: 6, lineHeight: 1.45 }}>
                        <span style={{ ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--rc-amber)" }}>
                          {nToFill} {L.toFill}
                        </span>
                        <span style={{ ...SANS, fontSize: 11.5, color: "var(--rc-hint)", marginLeft: 8 }}>
                          {L.fillHint}
                        </span>
                      </div>
                    )}
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
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {busy ? (
              <>
                <Loader2 size={13} className="rc-rescan-spin" /> {L.running}
              </>
            ) : (
              <>
                {L.run} <span style={{ opacity: 0.7, fontWeight: 600 }}>{L.creditNote}</span>
              </>
            )}
          </button>
          {editorMode && dirtyCount > 0 && !busy && (
            <span style={{ ...MONO, fontSize: 11, color: "var(--rc-green)", fontWeight: 700 }}>
              {dirtyCount} {L.accepted.toLowerCase()}
            </span>
          )}
          {editorMode && dirtyCount === 0 && pendingFillCount === 0 && !error && (
            <span style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)" }}>{L.noneAccepted}</span>
          )}
          {editorMode && pendingFillCount > 0 && !busy && (
            <span style={{ ...SANS, fontSize: 13, color: "var(--rc-amber)", display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {langKey === "fr"
                ? `${pendingFillCount} réécriture${pendingFillCount > 1 ? "s" : ""} en attente d'un chiffre`
                : `${pendingFillCount} accepted rewrite${pendingFillCount > 1 ? "s" : ""} waiting on a number`}
              <button
                type="button"
                onClick={jumpToFirstPending}
                style={{
                  ...MONO,
                  fontSize: 10,
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
                {L.jumpToFix} →
              </button>
            </span>
          )}
          {error && (
            <span style={{ ...SANS, fontSize: 13, color: "var(--rc-red)" }}>{error}</span>
          )}
        </div>

        {/* Progress row: a 30s+ paid operation needs more than a text swap. */}
        {busy && (
          <div style={{ marginTop: 14 }}>
            <div style={{ ...SANS, fontSize: 12.5, color: "var(--rc-muted)", marginBottom: 8 }}>{L.progress}</div>
            <div className="rc-rescan-track"><div className="rc-rescan-fill" /></div>
          </div>
        )}

        {/* Accepted edits that couldn't be located in the CV text — flagged,
            never silently dropped. */}
        {!busy && unappliedCount > 0 && (
          <div style={{ ...SANS, fontSize: 12.5, color: "var(--rc-amber)", marginTop: 12, lineHeight: 1.5 }}>
            {unappliedCount} {L.unapplied}
          </div>
        )}

        <style>{`
          .rc-rescan-spin{animation:rcRescanSpin .9s linear infinite}
          @keyframes rcRescanSpin{to{transform:rotate(360deg)}}
          .rc-rescan-track{height:4px;background:var(--rc-border);border-radius:99px;overflow:hidden}
          .rc-rescan-fill{height:100%;width:40%;border-radius:99px;background:var(--rc-red);animation:rcRescanSlide 1.3s ease-in-out infinite}
          @keyframes rcRescanSlide{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}
          .rc-reveal-pop{display:inline-block;animation:rcRevealPop 1.1s ease-out 1}
          @keyframes rcRevealPop{0%{transform:scale(1)}22%{transform:scale(1.35)}100%{transform:scale(1)}}
          @media (prefers-reduced-motion: reduce){
            .rc-rescan-spin{animation:none}
            .rc-rescan-fill{animation:none;width:100%;opacity:.5}
            .rc-reveal-pop{animation:none}
          }
        `}</style>

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

            {/* The surrounding report still renders the pre-rescan numbers until
                the user reloads into the new analysis — say so explicitly. */}
            {newId != null && (
              <div
                style={{
                  ...SANS,
                  fontSize: 12.5,
                  color: "var(--rc-amber)",
                  background: "var(--rc-amber-bg)",
                  border: "1px solid var(--rc-amber-border)",
                  borderRadius: 6,
                  padding: "10px 12px",
                  marginBottom: 18,
                  lineHeight: 1.5,
                }}
              >
                {L.outdated}
              </div>
            )}

            {/* Overall headline movement — the reveal. The "after" rolls up from
                the "before" so the score lands as a movement (Move B / B4). */}
            {(() => {
              const before = deltas.overall.before ?? currentOverall;
              const after = deltas.overall.after;
              const positive = (deltas.overall.delta ?? 0) > 0;
              return (
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
                  <span style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)" }}>{L.overall}</span>
                  <span style={{ ...MONO, fontSize: 22, fontWeight: 700, color: "var(--rc-text)" }}>
                    {before} →{" "}
                    <span style={{ color: positive ? "var(--rc-green)" : "var(--rc-text)" }}>
                      {after == null ? "?" : <AnimatedScore from={before} to={after} />}
                    </span>
                  </span>
                  <span
                    className={positive ? "rc-reveal-pop" : undefined}
                    style={{ ...MONO, fontSize: 16, fontWeight: 700, color: deltaColor(deltas.overall.delta) }}
                  >
                    {fmtDelta(deltas.overall.delta)}
                  </span>
                </div>
              );
            })()}

            {/* Celebration on a positive re-audit only. Deliberately NOT a share
                prompt: the before/after OG card is derived from
                `deriveRescanImprovement`, whose anchoring check excludes CV
                audits ("a CV audit has no vs-JD composite"), so a "share your
                progress" CTA here would mint a plain score card and quietly
                break the promise. The vs-JD flow, which the backend does support,
                gets the real glow-up share. Revisit when the backend can anchor a
                cv_quality before/after. */}
            {(deltas.overall.delta ?? 0) > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  background: "var(--rc-green-bg)",
                  border: "1px solid var(--rc-green-border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 20,
                }}
              >
                <span style={{ ...SANS, fontSize: 13, color: "var(--rc-text)" }}>
                  {(deltas.overall.before ?? currentOverall)} → {deltas.overall.after}.{" "}
                  <strong>{L.improved}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    posthog.capture("rescan_open_updated_clicked", {
                      analysisId,
                      flow: "cv_review",
                      before: deltas.overall.before ?? currentOverall,
                      after: deltas.overall.after,
                    });
                    openUpdated();
                  }}
                  style={{
                    ...MONO,
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "#fff",
                    background: "var(--rc-green)",
                    border: "none",
                    borderRadius: 6,
                    padding: "9px 16px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {L.open} →
                </button>
              </div>
            )}

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
