"use client";

import { useLanguage } from "../../context/language";
import type { ExperienceAnalysis, ExperienceFinding, ExperienceFindingSeverity, ExperienceSkill } from "./types";
import type { RoleBulletTally } from "../lib/experience-bullets";
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

const COL_KICK: React.CSSProperties = {
  ...MONO,
  fontSize: 9.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  color: "var(--rc-hint)",
  marginBottom: 12,
};

// Severity palette: critical/major/minor reuse the report's 3-level style;
// medium = amber outline on surface, info = the metric-blue used by the left
// pane highlights. Local to §03 by design (global sevClass stays 3-level).
const SEV_STYLE: Record<ExperienceFindingSeverity, { color: string; bg: string; border: string }> = {
  critical: { color: "var(--rc-red)", bg: "var(--rc-red-bg)", border: "var(--rc-red-border)" },
  major: { color: "var(--rc-amber)", bg: "var(--rc-amber-bg)", border: "var(--rc-amber-border)" },
  medium: { color: "var(--rc-amber)", bg: "var(--rc-surface)", border: "var(--rc-amber-border)" },
  minor: { color: "var(--rc-hint)", bg: "var(--rc-bg)", border: "var(--rc-border)" },
  info: { color: "#0284c7", bg: "rgba(2,132,199,0.06)", border: "rgba(2,132,199,0.24)" },
};

const SEV_ORDER: Record<ExperienceFindingSeverity, number> = {
  critical: 0,
  major: 1,
  medium: 2,
  minor: 3,
  info: 4,
};

// ── Copy ─────────────────────────────────────────────────────────────────────

const COPY = {
  en: {
    kicker: "§ 03 · Experience deep-dive",
    h2pre: "Each role, graded ",
    h2em: "like a recruiter would",
    h2post: ".",
    sub: "Role by role: the seniority it projects, the skills it proves versus merely claims, what a screener writes in the margin, and every finding tied to that role, from critical down to info. Scope is the size of the problem; ownership is whether you held it; impact is whether it mattered.",
    ratings: "Recruiter ratings",
    scope: "Scope",
    ownership: "Ownership",
    impact: "Impact",
    hardKick: "Hard skills trained here",
    softKick: "Soft skills observed",
    findings: "Findings for this role",
    margin: "Examiner's margin note",
    present: "present",
    yrs: "yrs",
    mo: "mo",
    reads: (lvl: string) => `Reads ${lvl}`,
    matches: "matches title",
    above: "above title",
    below: "below title",
    sev: { critical: "critical", major: "major", medium: "medium", minor: "minor", info: "info" } as Record<ExperienceFindingSeverity, string>,
    tallyStrong: (n: number) => `${n} strong`,
    tallyWeak: (n: number) => `${n} weak`,
    tallyFatal: (n: number) => `${n} fatal`,
  },
  fr: {
    kicker: "§ 03 · Analyse par expérience",
    h2pre: "Chaque rôle, noté ",
    h2em: "comme un recruteur le ferait",
    h2post: ".",
    sub: "Rôle par rôle : la séniorité qu'il projette, les compétences qu'il prouve ou se contente d'affirmer, ce qu'un screener écrit dans la marge, et chaque constat lié à ce rôle, de critique à info. Le périmètre est la taille du problème ; l'ownership, si tu le portais ; l'impact, si ça a compté.",
    ratings: "Notes recruteur",
    scope: "Périmètre",
    ownership: "Ownership",
    impact: "Impact",
    hardKick: "Hard skills travaillées ici",
    softKick: "Soft skills observées",
    findings: "Constats pour ce rôle",
    margin: "Note en marge de l'examinateur",
    present: "présent",
    yrs: "ans",
    mo: "mois",
    reads: (lvl: string) => `Se lit ${lvl}`,
    matches: "conforme au titre",
    above: "au-dessus du titre",
    below: "sous le titre",
    sev: { critical: "critique", major: "majeur", medium: "moyen", minor: "mineur", info: "info" } as Record<ExperienceFindingSeverity, string>,
    tallyStrong: (n: number) => `${n} fort${n === 1 ? "" : "s"}`,
    tallyWeak: (n: number) => `${n} faible${n === 1 ? "" : "s"}`,
    tallyFatal: (n: number) => `${n} fatal${n === 1 ? "" : "s"}`,
  },
};

// ── Date helpers (display-only; never guess missing dates) ───────────────────

function monthIndex(s: string | null, now: Date): number | null {
  if (!s) return null;
  if (s === "present") return now.getFullYear() * 12 + now.getMonth();
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  if (!m) return null;
  return parseInt(m[1], 10) * 12 + (parseInt(m[2], 10) - 1);
}

function formatDates(
  start: string | null,
  end: string | null,
  L: { present: string; yrs: string; mo: string },
  now: Date,
): string | null {
  if (!start && !end) return null;
  const endLabel = end === "present" ? L.present : end ?? "?";
  const base = `${start ?? "?"} → ${endLabel}`;
  const a = monthIndex(start, now);
  const b = monthIndex(end, now);
  if (a === null || b === null || b < a) return base;
  const months = b - a;
  const dur = months >= 12 ? `${(months / 12).toFixed(1)} ${L.yrs}` : `${months} ${L.mo}`;
  return `${base} · ${dur}`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/** Evidence note under a chips row: the proven skills' evidence, capped at 2. */
function skillNote(skills: ExperienceSkill[]): string | null {
  const evs = skills
    .filter((s) => s.status === "proven" && s.evidence && s.evidence.trim().length > 0)
    .map((s) => `${s.name}: ${s.evidence!.trim()}`);
  if (evs.length === 0) return null;
  return evs.slice(0, 2).join(" · ");
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function SevChip({ sev, children }: { sev: ExperienceFindingSeverity; children: React.ReactNode }) {
  const st = SEV_STYLE[sev];
  return (
    <span
      style={{
        ...MONO,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 10,
        letterSpacing: "0.05em",
        textTransform: "uppercase" as const,
        fontWeight: 700,
        color: st.color,
        background: st.bg,
        border: `1px solid ${st.border}`,
        whiteSpace: "nowrap" as const,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 99, background: "currentColor", display: "inline-block" }} />
      {children}
    </span>
  );
}

function Dots({ value, warn = false }: { value: number; warn?: boolean }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: 99,
            display: "inline-block",
            background: i < v ? (warn ? "var(--rc-amber)" : "var(--rc-text)") : "var(--rc-border)",
          }}
        />
      ))}
    </span>
  );
}

function RatingRow({ name, value, warn = false }: { name: string; value: number; warn?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
      <span style={{ ...SANS, fontSize: 12, fontWeight: 600, color: "var(--rc-muted)" }}>{name}</span>
      <Dots value={value} warn={warn} />
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

type Props = {
  experiences: ExperienceAnalysis[];
  /** Per-role bullet tallies (index-aligned); null entries hide the tally row. */
  tallies?: Array<RoleBulletTally | null>;
  /** CV is the only source: the per-card source chips are pure noise, hide them. */
  onlyCv?: boolean;
};

/**
 * §03 Experience deep-dive: one card per role with recruiter ratings, proven vs
 * claimed skills, 5-level findings and the examiner's margin note. Pure display.
 */
export function CvExperienceDeepDive({ experiences, tallies, onlyCv = false }: Props) {
  const { locale } = useLanguage();
  const L = locale === "fr" ? COPY.fr : COPY.en;
  const now = new Date();

  if (!experiences || experiences.length === 0) return null;

  return (
    <section data-ca-sec="s3" id="s3" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
      {/* Column dividers: neutral structural borders that flip from left (3-col)
          to top (stacked) at the same breakpoint as .rc-mstack-lg. */}
      <style>{`
        .rc-xp-col + .rc-xp-col { border-left: 1px solid var(--rc-border); }
        @media (max-width: 1023px) {
          .rc-xp-col + .rc-xp-col { border-left: none; border-top: 1px solid var(--rc-border); }
        }
      `}</style>

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
        <p style={SUB}>{L.sub}</p>
      </div>

      {experiences.map((exp, idx) => {
        const dates = formatDates(exp.start, exp.end, L, now);
        const aligned = exp.seniority_alignment !== "below_title";
        const alignLabel =
          exp.seniority_alignment === "matches_title" ? L.matches : exp.seniority_alignment === "above_title" ? L.above : L.below;
        const senChip = aligned
          ? { color: "var(--rc-green)", bg: "var(--rc-green-bg)", border: "var(--rc-green-border)" }
          : { color: "var(--rc-hint)", bg: "var(--rc-bg)", border: "var(--rc-border)" };

        const findings: ExperienceFinding[] = [...(exp.findings ?? [])].sort(
          (a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5),
        );
        const sevCounts = findings.reduce<Partial<Record<ExperienceFindingSeverity, number>>>((acc, f) => {
          acc[f.severity] = (acc[f.severity] ?? 0) + 1;
          return acc;
        }, {});

        const tally = tallies?.[idx] ?? null;
        const hardNote = skillNote(exp.hard_skills ?? []);
        const softNote = skillNote(exp.soft_skills ?? []);

        return (
          <div
            key={`${exp.company}-${exp.start ?? idx}`}
            style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, marginTop: 18, overflow: "hidden" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 24px", borderBottom: "1px solid var(--rc-border)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span style={{ ...SANS, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--rc-text)" }}>
                  {exp.company}
                </span>
                <span style={{ ...SANS, fontSize: 13.5, fontWeight: 500, color: "var(--rc-muted)" }}>{exp.title}</span>
                {dates && (
                  <span style={{ ...MONO, fontSize: 10.5, letterSpacing: "0.06em", fontWeight: 600, color: "var(--rc-hint)", textTransform: "uppercase" as const, fontVariantNumeric: "tabular-nums" }}>
                    {dates}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {!onlyCv &&
                  (exp.sources ?? []).map((src) => (
                    <span
                      key={src}
                      style={{ ...MONO, fontSize: 10, letterSpacing: "0.02em", textTransform: "lowercase" as const, fontWeight: 700, color: "var(--rc-muted)", background: "var(--rc-bg)", border: "1px solid var(--rc-border)", padding: "4px 8px", borderRadius: 4 }}
                    >
                      {src}
                    </span>
                  ))}
                <span
                  style={{ ...MONO, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase" as const, fontWeight: 700, color: senChip.color, background: senChip.bg, border: `1px solid ${senChip.border}`, padding: "4px 8px", borderRadius: 4 }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: 99, background: "currentColor", display: "inline-block" }} />
                  {L.reads(capitalize(exp.seniority_read))} · {alignLabel}
                </span>
              </div>
            </div>

            {/* 3-column body: ratings / hard skills / soft skills */}
            <div className="rc-mstack-lg" style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr" }}>
              <div className="rc-xp-col" style={{ padding: "22px 26px" }}>
                <div style={COL_KICK}>{L.ratings}</div>
                <RatingRow name={L.scope} value={exp.ratings.scope} />
                <RatingRow name={L.ownership} value={exp.ratings.ownership} />
                <RatingRow name={L.impact} value={exp.ratings.impact} warn={exp.ratings.impact <= 3} />
                {tally && (
                  <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                    {(
                      [
                        { label: L.tallyStrong(tally.strong), color: "var(--rc-green)" },
                        { label: L.tallyWeak(tally.weak), color: "var(--rc-amber)" },
                        { label: L.tallyFatal(tally.fatal), color: "var(--rc-red)" },
                      ] as const
                    ).map((t, i) => (
                      <span key={i} style={{ ...MONO, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: t.color, fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: t.color, display: "inline-block" }} />
                        {t.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rc-xp-col" style={{ padding: "22px 26px" }}>
                <div style={COL_KICK}>{L.hardKick}</div>
                <SkillChips skills={exp.hard_skills ?? []} note={hardNote} />
              </div>
              <div className="rc-xp-col" style={{ padding: "22px 26px" }}>
                <div style={COL_KICK}>{L.softKick}</div>
                <SkillChips skills={exp.soft_skills ?? []} note={softNote} />
              </div>
            </div>

            {/* Findings */}
            {findings.length > 0 && (
              <div style={{ borderTop: "1px solid var(--rc-border)", padding: "18px 26px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={{ ...COL_KICK, marginBottom: 0, marginRight: 6 }}>{L.findings}</span>
                  {(Object.keys(SEV_ORDER) as ExperienceFindingSeverity[]).map((sev) =>
                    (sevCounts[sev] ?? 0) > 0 ? (
                      <SevChip key={sev} sev={sev}>
                        {sevCounts[sev]}
                      </SevChip>
                    ) : null,
                  )}
                </div>
                {findings.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "88px 1fr",
                      gap: 14,
                      alignItems: "start",
                      padding: i === findings.length - 1 ? "8px 0 0" : "8px 0",
                      borderBottom: i === findings.length - 1 ? "none" : "1px solid rgba(212,207,201,0.4)",
                    }}
                  >
                    <SevChip sev={f.severity}>{L.sev[f.severity]}</SevChip>
                    <div>
                      <p style={{ ...SANS, fontSize: 13, fontWeight: 600, lineHeight: 1.5, margin: 0, color: "var(--rc-text)" }}>{f.what}</p>
                      <p style={{ ...SANS, fontSize: 12, color: "var(--rc-hint)", lineHeight: 1.5, margin: "2px 0 0" }}>{f.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Examiner's margin note */}
            {exp.margin_note && exp.margin_note.trim().length > 0 && (
              <div style={{ padding: "16px 26px 20px", borderTop: "1px solid var(--rc-border)", background: "var(--rc-surface-raised)" }}>
                <div style={{ ...COL_KICK, marginBottom: 5 }}>{L.margin}</div>
                <p style={{ ...SANS, fontSize: 13, fontStyle: "italic", lineHeight: 1.55, color: "var(--rc-muted)", margin: 0 }}>
                  {`« ${exp.margin_note.trim()} »`}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
