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
    above: "above typical",
    below: "below typical",
    mechanicsNote:
      "These three measure surface mechanics: how often you quantify, lead with an action verb, and use numbers. They are not the recruiter-judgment score up top, so you can beat typical here and still have gaps to close.",
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
    above: "au-dessus du typique",
    below: "sous le typique",
    mechanicsNote:
      "Ces trois axes mesurent la mécanique de surface : à quelle fréquence tu chiffres, tu ouvres par un verbe d'action, et tu utilises des nombres. Ce n'est pas le score de jugement recruteur plus haut : tu peux battre le typique ici et garder des lacunes à combler.",
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

/**
 * One shared 0..axisMax scale per row so "you", "typical" and "strong" all sit
 * on the SAME ruler (the old per-mark scaling made bar length meaningless). The
 * axis ends a bit past "strong" so that tick never pins to the far edge.
 */
function makeScale(band: { median: number; p75: number }, your: number) {
  const axisMax = Math.max(band.p75 * 1.4, your * 1.12, band.median * 1.6, 1);
  return (v: number) => Math.min(100, Math.max(0, (v / axisMax) * 100));
}

/** Keep a mark's text label inside the track bounds near the edges. */
function anchor(pos: number): string {
  if (pos <= 8) return "translateX(0)";
  if (pos >= 92) return "translateX(-100%)";
  return "translateX(-50%)";
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

        {/* Legend, read once, applies to every row below. */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", paddingBottom: 16, marginBottom: 4, borderBottom: "1px solid var(--rc-border)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, ...MONO, fontSize: 10.5, letterSpacing: "0.04em", color: "var(--rc-hint)" }}>
            <span style={{ width: 11, height: 11, borderRadius: 99, background: "var(--rc-text)", border: "2px solid var(--rc-surface)", boxShadow: "0 0 0 1px var(--rc-text)" }} />
            {L.you}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, ...MONO, fontSize: 10.5, letterSpacing: "0.04em", color: "var(--rc-hint)" }}>
            <span style={{ width: 2, height: 13, background: "var(--rc-text)", opacity: 0.55 }} />
            {L.typical}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, ...MONO, fontSize: 10.5, letterSpacing: "0.04em", color: "var(--rc-hint)" }}>
            <span style={{ width: 2, height: 13, background: "var(--rc-green)" }} />
            {L.strong}
          </span>
        </div>

        {bench.axes.map((ax, idx) => {
          const label = AXIS_LABEL[ax.key];
          const scale = makeScale(ax.band, ax.your);
          const youPos = scale(ax.your);
          const medPos = scale(ax.band.median);
          const p75Pos = scale(ax.band.p75);
          const above = !ax.belowMedian;
          const color = above ? "var(--rc-green)" : "var(--rc-red)";
          return (
            <div key={ax.key} style={{ padding: "16px 0 12px", borderTop: idx === 0 ? "none" : "1px solid var(--rc-border)" }}>
              {/* metric name + plain-language verdict */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)" }}>
                  {label[lang]}
                </span>
                <span style={{ ...MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color }}>
                  {above ? L.above : L.below}
                </span>
              </div>

              {/* one labeled ruler: you dot + value bubble, typical + strong ticks below */}
              <div style={{ position: "relative", height: 52, marginTop: 20 }}>
                {/* your value bubble, above the dot */}
                <div style={{ position: "absolute", top: 0, left: `${youPos}%`, transform: anchor(youPos), ...MONO, fontSize: 12, fontWeight: 700, color, whiteSpace: "nowrap" as const }}>
                  {L.you} {ax.your}{label.unit}
                </div>

                {/* track */}
                <div style={{ position: "absolute", top: 24, left: 0, right: 0, height: 8, background: "var(--rc-surface-hero, var(--rc-border))", borderRadius: 99 }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${youPos}%`, background: color, borderRadius: 99, opacity: 0.28 }} />
                  {/* typical tick */}
                  <div style={{ position: "absolute", top: -4, bottom: -4, width: 2, left: `${medPos}%`, background: "var(--rc-text)", opacity: 0.55 }} />
                  {/* strong tick */}
                  <div style={{ position: "absolute", top: -4, bottom: -4, width: 2, left: `${p75Pos}%`, background: "var(--rc-green)" }} />
                  {/* your dot */}
                  <div style={{ position: "absolute", top: "50%", left: `${youPos}%`, transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: 99, background: color, border: "2px solid var(--rc-surface)", boxShadow: `0 0 0 1px ${color}` }} />
                </div>

                {/* tick value labels */}
                <div style={{ position: "absolute", top: 38, left: `${medPos}%`, transform: anchor(medPos), ...MONO, fontSize: 10, color: "var(--rc-hint)", whiteSpace: "nowrap" as const }}>
                  {L.typical} {ax.band.median}{label.unit}
                </div>
                <div style={{ position: "absolute", top: 38, left: `${p75Pos}%`, transform: anchor(p75Pos), ...MONO, fontSize: 10, color: "var(--rc-green)", whiteSpace: "nowrap" as const }}>
                  {L.strong} {ax.band.p75}{label.unit}
                </div>
              </div>
            </div>
          );
        })}

        {/* Surface-mechanics caveat: reconciles a strong benchmark with a weaker
            overall judgment score, so the two never read as a contradiction. */}
        <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid var(--rc-border)" }}>
          <p style={{ ...SANS, fontSize: 12.5, color: "var(--rc-hint)", margin: 0, lineHeight: 1.55, maxWidth: 660 }}>
            {L.mechanicsNote}
          </p>
        </div>

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
