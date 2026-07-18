"use client";

import { useMemo } from "react";
import { useLanguage } from "../../context/language";
import type { ExperienceAnalysis, ExperienceSkill, SkillRadar } from "./types";
import { RadarChart } from "./RadarChart";
import { SkillChips } from "./SkillChips";

// ── Style atoms (mirrors CvAuditResult) ──────────────────────────────────────

const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const DISPLAY_ITALIC: React.CSSProperties = { fontWeight: 600, color: "var(--rc-red)" };

const SEC_NUM: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  ...MONO,
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "var(--rc-hint)",
  fontWeight: 700,
  marginBottom: 14,
};

const H2: React.CSSProperties = {
  ...SANS,
  fontWeight: 500,
  fontSize: "clamp(24px,2.8vw,36px)",
  lineHeight: 1.05,
  letterSpacing: "-0.025em",
  margin: 0,
  maxWidth: 720,
};

const SUB: React.CSSProperties = {
  ...SANS,
  fontSize: 14,
  lineHeight: 1.55,
  color: "var(--rc-hint)",
  maxWidth: 640,
  margin: "12px 0 0",
};

const POV_SUB: React.CSSProperties = {
  ...MONO,
  fontSize: 9.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  color: "var(--rc-hint)",
  margin: "14px 0 8px",
};

// ── Copy ─────────────────────────────────────────────────────────────────────

const COPY = {
  en: {
    kicker: "§ 02 · Recruiter radar",
    h2pre: "How your skills read ",
    h2em: "from the other side of the desk",
    h2post: ".",
    sub: "The axes a screener actually grades you on, scored from evidence in your documents only.",
    subExpected: (sen: string) =>
      ` The dashed shape is what "${sen}" makes them expect; every notch inward is a question you will get in the first call.`,
    legendCurrent: "Your evidence",
    legendExpected: (sen: string) => `Expected at ${sen}`,
    yourLevel: "your level",
    strongKick: "✓ Reads strong · examiner's view",
    weakKick: "! Potential weaknesses · examiner's view",
    hard: "Hard skills",
    soft: "Soft skills",
    hardNote:
      "Filled = proven by a shipped artifact or number. Dashed = named with no evidence behind it; a screener discounts these to zero.",
    softNote:
      "Soft skills only count when a bullet shows them in action; the dashed ones read as self-description.",
    claimedRow: (n: number) => `Claimed across ${n} roles, never evidenced.`,
  },
  fr: {
    kicker: "§ 02 · Radar recruteur",
    h2pre: "Comment tes compétences se lisent ",
    h2em: "de l'autre côté du bureau",
    h2post: ".",
    sub: "Les axes sur lesquels un screener te note vraiment, évalués uniquement sur les preuves de tes documents.",
    subExpected: (sen: string) =>
      ` La forme en pointillés est ce que « ${sen} » leur fait attendre ; chaque cran vers l'intérieur est une question au premier appel.`,
    legendCurrent: "Tes preuves",
    legendExpected: (sen: string) => `Attendu au niveau ${sen}`,
    yourLevel: "ton niveau",
    strongKick: "✓ Se lit fort · vue de l'examinateur",
    weakKick: "! Faiblesses potentielles · vue de l'examinateur",
    hard: "Hard skills",
    soft: "Soft skills",
    hardNote:
      "Plein = prouvé par un artefact livré ou un chiffre. Pointillé = cité sans preuve derrière ; un screener les compte pour zéro.",
    softNote:
      "Les soft skills ne comptent que si un bullet les montre en action ; en pointillé, ça se lit comme de l'auto-description.",
    claimedRow: (n: number) => `Affirmé dans ${n} rôles, jamais prouvé.`,
  },
};

// ── Deterministic aggregation (D1: POV cards derived in frontend) ────────────

/** Dedupe by lowercased name across roles; proven wins over claimed; proven first. */
function aggregateSkills(
  experiences: ExperienceAnalysis[],
  key: "hard_skills" | "soft_skills",
  cap: number,
): ExperienceSkill[] {
  const map = new Map<string, ExperienceSkill>();
  for (const exp of experiences) {
    for (const sk of exp[key] ?? []) {
      const k = sk.name.trim().toLowerCase();
      if (!k) continue;
      const prev = map.get(k);
      if (!prev) map.set(k, sk);
      else if (prev.status !== "proven" && sk.status === "proven") map.set(k, sk);
    }
  }
  const all = [...map.values()];
  return [...all.filter((s) => s.status === "proven"), ...all.filter((s) => s.status !== "proven")].slice(0, cap);
}

/** Skills claimed in >= 2 roles and proven in none: deterministic weakness rows. */
function claimedNeverProven(experiences: ExperienceAnalysis[]): Array<{ name: string; roles: number }> {
  const tally = new Map<string, { name: string; claimed: number; proven: boolean }>();
  for (const exp of experiences) {
    for (const sk of [...(exp.hard_skills ?? []), ...(exp.soft_skills ?? [])]) {
      const k = sk.name.trim().toLowerCase();
      if (!k) continue;
      const e = tally.get(k) ?? { name: sk.name, claimed: 0, proven: false };
      if (sk.status === "claimed") e.claimed += 1;
      if (sk.status === "proven") e.proven = true;
      tally.set(k, e);
    }
  }
  return [...tally.values()]
    .filter((e) => !e.proven && e.claimed >= 2)
    .map((e) => ({ name: e.name, roles: e.claimed }));
}

/** Wrap a recruiter-voice line in quotes unless the model already quoted it. */
function quoted(s: string): string {
  const t = s.trim();
  return /^["'«“]/.test(t) ? t : `"${t}"`;
}

// ── Component ────────────────────────────────────────────────────────────────

type Props = {
  radar: SkillRadar;
  seniorityDetected: string | null;
  experiences?: ExperienceAnalysis[];
  redFlags?: { flag: string; perception: string }[];
};

/**
 * §02 Recruiter radar: how the profile reads from the screener's side. Radar
 * chart (evidence vs expected-at-seniority overlay) + two derived POV cards.
 * Pure display; renders its own section like CvBenchmarkPanel does.
 */
export function CvRecruiterRadar({ radar, seniorityDetected, experiences, redFlags }: Props) {
  const { locale } = useLanguage();
  const L = locale === "fr" ? COPY.fr : COPY.en;

  const axes = radar?.axes ?? [];
  const hasExpected = axes.some((ax) => ax.expected !== undefined);

  const hardSkills = useMemo(() => aggregateSkills(experiences ?? [], "hard_skills", 10), [experiences]);
  const softSkills = useMemo(() => aggregateSkills(experiences ?? [], "soft_skills", 5), [experiences]);
  const detRows = useMemo(() => claimedNeverProven(experiences ?? []), [experiences]);

  if (axes.length === 0) return null;

  const senLabel = seniorityDetected ?? L.yourLevel;
  const flagRows = redFlags ?? [];
  const showStrong = (experiences?.length ?? 0) > 0 && hardSkills.length + softSkills.length > 0;
  const showWeak = flagRows.length + detRows.length > 0;

  const povKick = (color: string): React.CSSProperties => ({
    ...MONO,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    color,
    marginBottom: 16,
  });

  return (
    <section data-ca-sec="s2" id="s2" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={SEC_NUM}>
          <span style={{ width: 28, height: 1, background: "var(--rc-text)", display: "inline-block", flexShrink: 0 }} />
          {L.kicker}
        </div>
        <h2 style={H2}>
          {L.h2pre}
          <span style={DISPLAY_ITALIC}>{L.h2em}</span>
          {L.h2post}
        </h2>
        <p style={SUB}>
          {L.sub}
          {hasExpected ? L.subExpected(senLabel) : ""}
        </p>
      </div>

      {/* Radar + per-axis evidence rows (RadarChart renders both; the expected
          overlay and its legend only appear when at least one axis has it). */}
      <RadarChart
        axes={axes}
        fluid
        scale={100}
        legend={{ current: L.legendCurrent, expected: L.legendExpected(senLabel) }}
      />

      {/* POV cards: derived deterministically from experience_analysis and
          hidden_red_flags, so §02 can never contradict §03. */}
      {(showStrong || showWeak) && (
        <div
          className="rc-mstack"
          style={{
            display: "grid",
            gridTemplateColumns: showStrong && showWeak ? "1fr 1fr" : "1fr",
            gap: 16,
            marginTop: 34,
          }}
        >
          {showStrong && (
            <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-green-border)", borderRadius: 6, padding: "22px 24px" }}>
              <div style={povKick("var(--rc-green)")}>{L.strongKick}</div>
              {hardSkills.length > 0 && (
                <>
                  <div style={{ ...POV_SUB, marginTop: 0 }}>{L.hard}</div>
                  <SkillChips skills={hardSkills} note={L.hardNote} />
                </>
              )}
              {softSkills.length > 0 && (
                <>
                  <div style={POV_SUB}>{L.soft}</div>
                  <SkillChips skills={softSkills} note={L.softNote} />
                </>
              )}
            </div>
          )}

          {showWeak && (
            <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-amber-border)", borderRadius: 6, padding: "22px 24px" }}>
              <div style={povKick("var(--rc-amber)")}>{L.weakKick}</div>
              {flagRows.map((rf, i) => (
                <div
                  key={`rf-${i}`}
                  style={{
                    padding: "10px 0",
                    borderBottom: i === flagRows.length - 1 && detRows.length === 0 ? "none" : "1px solid var(--rc-border)",
                  }}
                >
                  <p style={{ ...SANS, fontSize: 13, fontWeight: 600, lineHeight: 1.45, margin: 0, color: "var(--rc-text)" }}>
                    {rf.flag}
                  </p>
                  <p style={{ ...SANS, fontSize: 12, fontStyle: "italic", color: "var(--rc-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
                    {quoted(rf.perception)}
                  </p>
                </div>
              ))}
              {detRows.map((row, i) => (
                <div
                  key={`det-${row.name.toLowerCase()}`}
                  style={{
                    padding: "10px 0",
                    borderBottom: i === detRows.length - 1 ? "none" : "1px solid var(--rc-border)",
                  }}
                >
                  <p style={{ ...SANS, fontSize: 13, fontWeight: 600, lineHeight: 1.45, margin: 0, color: "var(--rc-text)" }}>
                    {row.name}
                  </p>
                  <p style={{ ...SANS, fontSize: 12, fontStyle: "italic", color: "var(--rc-muted)", margin: "4px 0 0", lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>
                    {L.claimedRow(row.roles)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
