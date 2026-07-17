"use client";

import { useMemo } from "react";
import { useLanguage } from "../../context/language";
import { nextLever, STRONG, type CvQualityDim } from "../lib/next-lever";

type Props = {
  quality?: (Partial<Record<CvQualityDim, number>> & { overall?: number }) | null;
  notes?: Partial<Record<CvQualityDim, string>> | null;
};

const DIM_LABEL: Record<CvQualityDim, { en: string; fr: string }> = {
  impact: { en: "impact", fr: "l'impact" },
  clarity: { en: "clarity", fr: "la clarté" },
  hard_skills: { en: "hard skills", fr: "les compétences techniques" },
  soft_skills: { en: "soft skills", fr: "les soft skills" },
  consistency: { en: "consistency", fr: "la cohérence" },
  ats_format: { en: "ATS format", fr: "le format ATS" },
};

const MONO = { fontFamily: "var(--rc-mono, ui-monospace, monospace)" } as const;
const SANS = { fontFamily: "var(--rc-sans, system-ui, sans-serif)" } as const;

export function CvNextLever({ quality, notes }: Props) {
  const { locale } = useLanguage();
  const lang = locale === "fr" ? "fr" : "en";
  const lever = useMemo(() => nextLever(quality ?? null, notes ?? null), [quality, notes]);
  const overall = quality?.overall ?? 0;

  // Already Strong: a short finish-line state instead of a lever.
  const isStrong = overall >= STRONG;
  if (!lever && !isStrong) return null;

  const kicker = lang === "fr" ? "TON LEVIER" : "YOUR LEVERAGE MOVE";
  const dim = lever ? DIM_LABEL[lever.dimension][lang] : "";

  const headline = isStrong
    ? lang === "fr"
      ? `Tu es Fort (${overall}/100). Rien de critique entre toi et un CV du haut du panier.`
      : `You're Strong (${overall}/100). Nothing critical stands between you and a top resume.`
    : lang === "fr"
      ? `Pour passer Fort (${STRONG}), le levier n°1 est ${dim} (actuellement ${lever?.current ?? 0}/100 ; global ${overall}/100).`
      : `To reach Strong (${STRONG}), your highest-leverage move is ${dim} (currently ${lever?.current ?? 0}/100; overall ${overall}/100).`;

  return (
    <div
      style={{
        border: "1px solid var(--rc-border)",
        borderRadius: 6,
        background: "var(--rc-surface)",
        padding: "18px 22px",
        margin: "8px 0 4px",
      }}
    >
      <div
        style={{
          ...MONO,
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "var(--rc-hint)",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {kicker}
      </div>
      <div style={{ ...SANS, fontSize: 16, fontWeight: 600, color: "var(--rc-text)", lineHeight: 1.4 }}>
        {headline}
      </div>
      {lever?.note && (
        <div style={{ ...SANS, fontSize: 14, color: "var(--rc-hint)", marginTop: 8, lineHeight: 1.5 }}>
          {lever.note}
        </div>
      )}
    </div>
  );
}
