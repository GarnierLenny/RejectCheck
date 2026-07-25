"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "../../context/language";
import {
  corpusFactFor,
  factFamilyLabel,
  factShareText,
  CORPUS_TOTAL,
} from "../lib/corpus-facts";

const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };

type Props = {
  /** projected_profile.target_roles + domains, same hints the benchmark uses. */
  roleHints: string[];
};

/**
 * A fact about the CORPUS, not about the user.
 *
 * Everything else worth sharing here is a confession: your score, your gaps,
 * your improvement. Posting those exposes you, which is why most people don't.
 * This costs the sharer nothing and makes them look informed, so it is the one
 * piece of social currency in the report that requires no self-exposure.
 *
 * Deliberately never says these resumes were rejected. The corpus is typical
 * resumes, not outcome-labelled, and the copy has a test pinning that.
 */
export function CorpusFactCard({ roleHints }: Props) {
  const { locale } = useLanguage();
  const lang = locale === "fr" ? "fr" : "en";
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copied = state === "copied";

  const hintKey = roleHints.join("|");
  const fact = useMemo(
    () => corpusFactFor(roleHints),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hintKey],
  );
  const shareText = factShareText(fact, lang);
  const fam = factFamilyLabel(fact, lang);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // Clipboard can be refused (permissions policy, insecure origin, some
      // in-app browsers). Silently doing nothing would leave the user clicking a
      // dead button, and the exact line — which carries the sample size and
      // attribution — is not otherwise on screen to copy by hand. So reveal it.
      setState("failed");
    }
  }

  const t =
    lang === "fr"
      ? {
          eyebrow: "Le saviez-vous",
          headline: fact.family
            ? `Le CV ${fam} médian ne chiffre que ${fact.medianQuantifiedPct}% de ses bullets.`
            : `La médiane ne chiffre que ${fact.medianQuantifiedPct}% de ses bullets.`,
          sub: fact.p75QuantifiedPct != null
            ? `Environ 1 bullet sur ${fact.oneInN}. Même le quartile supérieur s'arrête à ${fact.p75QuantifiedPct}%.`
            : `Environ 1 bullet sur ${fact.oneInN}, tous domaines confondus.`,
          basis: `Sur ${fact.n} CV ${fact.family ? fam : ""} du corpus livecareer/Kaggle (${CORPUS_TOTAL} au total). CV typiques, pas labellisés par résultat.`,
          copy: "Copier ce chiffre",
          copied: "Copié",
        }
      : {
          eyebrow: "Did you know",
          headline: fact.family
            ? `The median ${fam} resume quantifies just ${fact.medianQuantifiedPct}% of its bullets.`
            : `The median resume quantifies just ${fact.medianQuantifiedPct}% of its bullets.`,
          sub: fact.p75QuantifiedPct != null
            ? `About 1 bullet in ${fact.oneInN}. Even the top quartile stops at ${fact.p75QuantifiedPct}%.`
            : `About 1 bullet in ${fact.oneInN}, across every field.`,
          basis: `From ${fact.n} ${fact.family ? fam : ""} resumes in the livecareer/Kaggle corpus (${CORPUS_TOTAL} total). Typical resumes, not outcome-labeled.`,
          copy: "Copy this stat",
          copied: "Copied",
        };

  return (
    <div
      style={{
        marginTop: 18,
        padding: "18px 20px",
        borderRadius: 8,
        border: "1px solid var(--rc-border)",
        background: "var(--rc-surface)",
      }}
    >
      <div
        style={{
          ...MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--rc-hint)",
          marginBottom: 10,
        }}
      >
        {t.eyebrow}
      </div>

      <p
        style={{
          ...SANS,
          fontSize: 19,
          lineHeight: 1.35,
          fontWeight: 600,
          color: "var(--rc-text)",
          margin: 0,
          textWrap: "balance",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {t.headline}
      </p>

      <p style={{ ...SANS, fontSize: 13.5, lineHeight: 1.55, color: "var(--rc-muted)", margin: "8px 0 0" }}>
        {t.sub}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
        <button
          onClick={copy}
          style={{
            ...MONO,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            padding: "7px 12px",
            borderRadius: 5,
            cursor: "pointer",
            border: `1px solid ${copied ? "var(--rc-green-border)" : "var(--rc-border)"}`,
            background: copied ? "var(--rc-green-bg)" : "var(--rc-bg)",
            color: copied ? "var(--rc-green)" : "var(--rc-text)",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? t.copied : t.copy}
        </button>
        <span style={{ ...MONO, fontSize: 10, lineHeight: 1.5, color: "var(--rc-hint)", maxWidth: 460 }}>
          {t.basis}
        </span>
      </div>

      {state === "failed" && (
        <p
          // Selectable fallback: the button couldn't reach the clipboard, so the
          // user copies it by hand rather than losing the attribution.
          style={{
            ...MONO,
            userSelect: "all",
            fontSize: 11.5,
            lineHeight: 1.6,
            color: "var(--rc-text)",
            background: "var(--rc-bg)",
            border: "1px solid var(--rc-border)",
            borderRadius: 5,
            padding: "9px 11px",
            margin: "12px 0 0",
          }}
        >
          {shareText}
        </p>
      )}
    </div>
  );
}
