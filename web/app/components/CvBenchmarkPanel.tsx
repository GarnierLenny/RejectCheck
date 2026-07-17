"use client";

import { useMemo } from "react";
import { useLanguage } from "../../context/language";
import { computeBenchmark, type BenchAxis, type BenchAxisKey } from "../lib/role-benchmark";

type Props = {
  cvText: string;
  /** Role hints (projected_profile.target_roles + domains) to resolve the family. */
  roleHints: string[];
};

const COPY = {
  en: {
    kicker: "§ 02.5 · Benchmark",
    title: "You vs typical resumes in your field.",
    basis: (n: number, fam: string) =>
      `Based on ${n} ${fam} resumes (typical resumes, not outcome-labeled). "Strong" = the top quartile.`,
    you: "you",
    typical: "typical",
    strong: "strong",
    onTrack: "You're at or above typical resumes on every measured axis. Focus on the recruiter-judgment notes above.",
    nextLabel: "Your one lever",
  },
  fr: {
    kicker: "§ 02.5 · Benchmark",
    title: "Toi vs les CV typiques de ton domaine.",
    basis: (n: number, fam: string) =>
      `Basé sur ${n} CV ${fam} (CV typiques, pas labellisés par résultat). "Fort" = le quartile supérieur.`,
    you: "toi",
    typical: "typique",
    strong: "fort",
    onTrack: "Tu es au niveau ou au-dessus des CV typiques sur chaque axe mesuré. Concentre-toi sur les notes recruteur plus haut.",
    nextLabel: "Ton levier n°1",
  },
};

const FAMILY_LABEL: Record<string, { en: string; fr: string }> = {
  software: { en: "software", fr: "tech" },
  engineering: { en: "engineering", fr: "ingénierie" },
  finance: { en: "finance", fr: "finance" },
  sales: { en: "sales", fr: "vente" },
  marketing: { en: "marketing", fr: "marketing" },
  design: { en: "design", fr: "design" },
  hr: { en: "HR", fr: "RH" },
  legal: { en: "legal", fr: "juridique" },
  healthcare: { en: "healthcare", fr: "santé" },
  education: { en: "education", fr: "éducation" },
  consulting: { en: "consulting", fr: "conseil" },
  operations: { en: "operations", fr: "opérations" },
  hospitality: { en: "hospitality", fr: "hôtellerie" },
  trades: { en: "trades", fr: "métiers" },
};

const AXIS_LABEL: Record<BenchAxisKey, { en: string; fr: string; unit: string }> = {
  quantified_bullet_pct: { en: "Quantified bullets", fr: "Bullets chiffrés", unit: "%" },
  action_verb_pct: { en: "Action-verb bullets", fr: "Bullets en verbe d'action", unit: "%" },
  metric_density: { en: "Numbers per 100 words", fr: "Nombres / 100 mots", unit: "" },
};

function nextActionCopy(
  ax: BenchAxis,
  fam: string,
  lang: "en" | "fr",
): string {
  const m = ax.band.median;
  const p = ax.band.p75;
  const y = ax.your;
  if (ax.key === "quantified_bullet_pct") {
    return lang === "fr"
      ? `Chiffre plus de bullets : les CV ${fam} typiques sont à ~${m}% (forts ~${p}%), tu es à ${y}%. Ajoute un résultat mesurable par bullet.`
      : `Quantify more bullets: typical ${fam} resumes hit ~${m}% (strong ~${p}%), you're at ${y}%. Add one measurable result per bullet.`;
  }
  if (ax.key === "action_verb_pct") {
    return lang === "fr"
      ? `Ouvre plus de bullets par un verbe d'action : ~${m}% chez les CV ${fam} typiques (forts ~${p}%), tu es à ${y}%.`
      : `Open more bullets with an action verb: ~${m}% for typical ${fam} resumes (strong ~${p}%), you're at ${y}%.`;
  }
  return lang === "fr"
    ? `Ajoute des chiffres concrets : ~${m} pour 100 mots chez les CV ${fam} typiques (forts ~${p}), tu es à ${y}.`
    : `Add concrete numbers: ~${m} per 100 words for typical ${fam} resumes (strong ~${p}), you're at ${y}.`;
}

const MONO = { fontFamily: "var(--rc-mono, ui-monospace, monospace)" } as const;
const SANS = { fontFamily: "var(--rc-sans, system-ui, sans-serif)" } as const;

/** Position (0-100%) of a value on a scale that ends a bit past p75. */
function posOf(v: number, band: { p75: number }): number {
  const max = Math.max(band.p75 * 1.3, v * 1.1, 1);
  return Math.min(100, (v / max) * 100);
}

export function CvBenchmarkPanel({ cvText, roleHints }: Props) {
  const { locale } = useLanguage();
  const lang = locale === "fr" ? "fr" : "en";
  const L = COPY[lang];

  const bench = useMemo(() => computeBenchmark(cvText, roleHints), [cvText, roleHints]);

  // Confidence gate: no recognised family -> hide, the scorecard (A+B) covers it.
  if (!bench) return null;

  const famLabel = (FAMILY_LABEL[bench.family] ?? { en: bench.family, fr: bench.family })[lang];

  return (
    <section data-ca-sec="s2d" id="s2d" style={{ padding: "64px 0", borderTop: "1px solid var(--rc-border)" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 12 }}>
          {L.kicker}
        </div>
        <h2 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(24px,2.8vw,36px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0, maxWidth: 720 }}>
          {L.title}
        </h2>
        <p style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)", maxWidth: 640, marginTop: 12 }}>
          {L.basis(bench.n, famLabel)}
        </p>
      </div>

      <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "22px 28px" }}>
        {bench.axes.map((ax, idx) => {
          const label = AXIS_LABEL[ax.key];
          const youPos = posOf(ax.your, ax.band);
          const medPos = posOf(ax.band.median, ax.band);
          const p75Pos = posOf(ax.band.p75, ax.band);
          const color = ax.belowMedian ? "var(--rc-red)" : "var(--rc-green)";
          return (
            <div key={ax.key} style={{ padding: "14px 0", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)" }}>
                  {label[lang]}
                </span>
                <span style={{ ...MONO, fontSize: 13 }}>
                  <span style={{ color, fontWeight: 700 }}>{ax.your}{label.unit}</span>
                  <span style={{ color: "var(--rc-hint)" }}> {L.you} · {ax.band.median}{label.unit} {L.typical} · {ax.band.p75}{label.unit} {L.strong}</span>
                </span>
              </div>
              {/* scale with typical (median) and strong (p75) ticks + your marker */}
              <div style={{ position: "relative", height: 8, background: "var(--rc-surface-hero, var(--rc-border))", borderRadius: 99 }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${youPos}%`, background: color, borderRadius: 99, opacity: 0.4 }} />
                <div style={{ position: "absolute", top: -3, bottom: -3, width: 2, left: `${medPos}%`, background: "var(--rc-text)", opacity: 0.55 }} title={`${L.typical}: ${ax.band.median}`} />
                <div style={{ position: "absolute", top: -3, bottom: -3, width: 2, left: `${p75Pos}%`, background: "var(--rc-green)" }} title={`${L.strong}: ${ax.band.p75}`} />
              </div>
            </div>
          );
        })}

        {/* Single next action (A) */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--rc-border)" }}>
          <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 8 }}>
            {L.nextLabel}
          </div>
          <p style={{ ...SANS, fontSize: 14, color: "var(--rc-text)", margin: 0, lineHeight: 1.5 }}>
            {bench.nextAxis ? nextActionCopy(bench.nextAxis, famLabel, lang) : L.onTrack}
          </p>
        </div>
      </div>
    </section>
  );
}
