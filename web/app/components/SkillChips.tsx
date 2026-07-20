"use client";

import { useLanguage } from "../../context/language";
import type { ExperienceSkill } from "./types";

// ── Shared style atoms (single Inter typeface; "mono" = uppercase + tracking) ──

const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };

const CHIP_BASE: React.CSSProperties = {
  ...SANS,
  display: "inline-flex",
  alignItems: "center",
  fontSize: 11,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 99,
  lineHeight: 1.3,
  whiteSpace: "nowrap" as const,
};

export const SKILL_CHIP_PROVEN: React.CSSProperties = {
  ...CHIP_BASE,
  background: "var(--rc-green-bg)",
  color: "var(--rc-green)",
  border: "1px solid var(--rc-green-border)",
};

export const SKILL_CHIP_CLAIMED: React.CSSProperties = {
  ...CHIP_BASE,
  background: "var(--rc-surface)",
  color: "var(--rc-hint)",
  border: "1px dashed var(--rc-border)",
};

const COPY = {
  en: {
    provenLegend: "Filled = proven by evidence",
    claimedLegend: "Dashed = claimed only",
  },
  fr: {
    provenLegend: "Plein = prouvé, preuve à l'appui",
    claimedLegend: "Pointillé = seulement affirmé",
  },
};

/**
 * Chips row for a list of skills: proven = filled green tint, claimed = dashed
 * hint. `note` renders a small explanatory line under the chips. Pure display,
 * shared by the recruiter radar (02) and the experience deep-dive (03).
 */
export function SkillChips({
  skills,
  note = null,
}: {
  skills: ExperienceSkill[];
  note?: string | null;
}) {
  if ((!skills || skills.length === 0) && !note) return null;
  return (
    <div>
      {skills && skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {skills.map((sk, i) => (
            <span
              key={`${sk.name.toLowerCase()}-${i}`}
              title={sk.evidence ?? undefined}
              style={sk.status === "proven" ? SKILL_CHIP_PROVEN : SKILL_CHIP_CLAIMED}
            >
              {sk.name}
            </span>
          ))}
        </div>
      )}
      {note && (
        <p style={{ ...SANS, fontSize: 11, color: "var(--rc-hint)", margin: "6px 0 0", lineHeight: 1.5 }}>
          {note}
        </p>
      )}
    </div>
  );
}

/** Tiny proven / claimed legend, rendered once per section that uses the chips. */
export function SkillChipsLegend() {
  const { locale } = useLanguage();
  const L = locale === "fr" ? COPY.fr : COPY.en;
  const key: React.CSSProperties = {
    ...MONO,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 9.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    color: "var(--rc-hint)",
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
      <span style={key}>
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)", display: "inline-block" }} />
        {L.provenLegend}
      </span>
      <span style={key}>
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--rc-surface)", border: "1px dashed var(--rc-border)", display: "inline-block" }} />
        {L.claimedLegend}
      </span>
    </div>
  );
}
