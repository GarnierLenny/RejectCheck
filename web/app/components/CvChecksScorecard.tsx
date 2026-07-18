"use client";

import { useMemo } from "react";
import { useLanguage } from "../../context/language";
import { computeCvChecks, checksSummary, type CvCheckStatus } from "../lib/cv-checks";

type Props = {
  cvText: string;
};

const COPY = {
  en: {
    kicker: "§ 06.2 · Structural checks",
    title: "The deterministic scorecard.",
    intro:
      "These checks are computed in code from your CV, not judged by the model, so they are reproducible: fix the text and the same input always gives the same result.",
    pass: "pass",
    warn: "warn",
    fail: "fail",
  },
  fr: {
    kicker: "§ 06.2 · Checks structurels",
    title: "La scorecard déterministe.",
    intro:
      "Ces checks sont calculés en code depuis ton CV, pas jugés par le modèle, donc reproductibles : corrige le texte et le même input donne toujours le même résultat.",
    pass: "ok",
    warn: "moyen",
    fail: "échec",
  },
};

const LABELS: Record<string, { en: string; fr: string }> = {
  quantified_bullets: { en: "Quantified bullets", fr: "Bullets chiffrés" },
  action_verbs: { en: "Action verbs", fr: "Verbes d'action" },
  weak_ownership: { en: "Ownership language", fr: "Langage d'appropriation" },
  buzzwords: { en: "Buzzwords", fr: "Buzzwords" },
  first_person: { en: "First person", fr: "Première personne" },
  fillers: { en: "Filler words", fr: "Mots de remplissage" },
  contact: { en: "Contact info", fr: "Coordonnées" },
  sections: { en: "Standard sections", fr: "Sections standard" },
  dates: { en: "Dates", fr: "Dates" },
  avg_bullet_len: { en: "Bullet length", fr: "Longueur des bullets" },
  length: { en: "Overall length", fr: "Longueur totale" },
};

const STATUS_COLOR: Record<CvCheckStatus, string> = {
  pass: "var(--rc-green)",
  warn: "var(--rc-amber, #b45309)",
  fail: "var(--rc-red)",
};

const MONO = { fontFamily: "var(--rc-mono, ui-monospace, monospace)" } as const;
const SANS = { fontFamily: "var(--rc-sans, system-ui, sans-serif)" } as const;

export function CvChecksScorecard({ cvText }: Props) {
  const { locale } = useLanguage();
  const L = locale === "fr" ? COPY.fr : COPY.en;
  const langKey = locale === "fr" ? "fr" : "en";

  const { checks, summary } = useMemo(() => {
    const c = computeCvChecks(cvText);
    return { checks: c, summary: checksSummary(c) };
  }, [cvText]);

  const statusLabel: Record<CvCheckStatus, string> = {
    pass: L.pass,
    warn: L.warn,
    fail: L.fail,
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
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 28px",
            borderBottom: "1px solid var(--rc-border)",
            display: "flex",
            gap: 16,
            ...MONO,
            fontSize: 11,
            letterSpacing: "0.06em",
          }}
        >
          <span style={{ color: "var(--rc-green)", fontWeight: 700 }}>{summary.pass} {L.pass}</span>
          <span style={{ color: STATUS_COLOR.warn, fontWeight: 700 }}>{summary.warn} {L.warn}</span>
          <span style={{ color: "var(--rc-red)", fontWeight: 700 }}>{summary.fail} {L.fail}</span>
        </div>
        <div style={{ padding: "8px 28px 24px" }}>
          {checks.map((c, idx) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 64px",
                gap: 14,
                alignItems: "center",
                padding: "12px 0",
                borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)",
              }}
            >
              <span style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)" }}>
                {(LABELS[c.id] ?? { en: c.id, fr: c.id })[langKey]}
              </span>
              <span style={{ ...MONO, fontSize: 11, color: "var(--rc-hint)", letterSpacing: "0.02em" }}>
                {c.detail}
              </span>
              <span
                style={{
                  ...MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: STATUS_COLOR[c.status],
                  textAlign: "right",
                }}
              >
                {statusLabel[c.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
