"use client";

import { useLanguage } from "../../context/language";
import { GAP_MONTHS, type ConsistencyRow, type ConsistencyStatus } from "../lib/timeline-consistency";

// ── Style atoms ──────────────────────────────────────────────────────────────

const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };

const ICO: Record<Exclude<ConsistencyStatus, "na">, { char: string; color: string; bg: string; border: string }> = {
  pass: { char: "✓", color: "var(--rc-green)", bg: "var(--rc-green-bg)", border: "var(--rc-green-border)" },
  warn: { char: "!", color: "var(--rc-amber)", bg: "var(--rc-amber-bg)", border: "var(--rc-amber-border)" },
  fail: { char: "✕", color: "var(--rc-red)", bg: "var(--rc-red-bg)", border: "var(--rc-red-border)" },
};

// ── Data access (tolerates both contract-style and lib-style key spellings) ──

type RowData = Record<string, string | number>;

function num(d: RowData, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = d[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function str(d: RowData, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = d[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

// ── Copy ─────────────────────────────────────────────────────────────────────

const COPY = {
  en: {
    header: (p: number, w: number, f: number) => `Consistency checks · ${p} pass · ${w} warn · ${f} fail`,
    months: (m: number) => (m >= 12 ? `${(m / 12).toFixed(1).replace(/\.0$/, "")} years` : `${m} month${m === 1 ? "" : "s"}`),
    gaps: {
      passT: "No unexplained gaps",
      passD: "every transition between roles is covered.",
      warnT: "Old gap · low weight",
      warnD: (months: string | null) =>
        `${months ? `a ${months} break` : "a break"} early in your history. Recruiters weigh recent years, so this one rarely comes up; a short line on the CV still closes it.`,
      failT: "Unexplained gap",
      failTail: "no explanation on any source. Recruiters will ask; answer it on the CV first.",
      failOne: (months: string) => `${months} with no entry, `,
      failMany: (n: number, months: string) => `${n} gaps, the longest ${months} with no entry, `,
      failGeneric: `a break longer than ${GAP_MONTHS} months has `,
    },
    dates: {
      passT: "Dates agree across sources",
      passD: "the same role shows the same dates everywhere.",
      failT: "Dates disagree across sources",
      failCount: (n: number) =>
        `${n} date conflict${n === 1 ? "" : "s"} between your sources; the details are in the inconsistency list below.`,
      failGeneric: "at least one role's dates differ between sources; the details are in the inconsistency list below.",
    },
    overlaps: {
      passT: "No overlapping roles",
      passD: "one role at a time; nothing to explain.",
      failT: "Overlapping roles",
      failOne: (months: string | null) => `two entries run in parallel${months ? ` for ${months}` : ""}.`,
      failMany: (n: number, months: string | null) => `${n} role overlaps${months ? `, the longest ${months}` : ""}.`,
      failTail: " Fine if the extra work was part-time; label it so it does not read as double employment.",
    },
    progression: {
      passT: "Forward progression",
      passD: "titles step up or hold at every move. The arc is clean.",
      failT: "Title regression",
      failFromTo: (from: string, to: string) =>
        `"${from}" to "${to}" reads as a step down in title. If it was a scope change, reword it so the arc reads forward.`,
      failGeneric: "at least one move reads as a step down in title. If it was a scope change, reword it so the arc reads forward.",
    },
    tenure: {
      passT: "Healthy tenure",
      passD: (avg: string | null, roles: number | null) =>
        `${avg ?? "a solid average"} per role${roles ? ` across ${roles} roles` : ""}, no job-hopping pattern.`,
      failT: "Short tenure pattern",
      failD: (avg: string | null, roles: number | null) =>
        `${avg ?? "a short average"} per role${roles ? ` across ${roles} roles` : ""}. Under 18 months reads as job-hopping; give the short stints a reason.`,
    },
    future: {
      passT: "No future-dated entries",
      passD: "every end date is in the past or marked present.",
      failT: "Future-dated entry",
      failCount: (n: number) =>
        n === 1
          ? "one entry sits beyond the current month. Fix it; at best it reads as a typo."
          : `${n} entries sit beyond the current month. Fix them; at best they read as typos.`,
      failGeneric: "at least one date sits beyond the current month. Fix it; at best it reads as a typo.",
    },
  },
  fr: {
    header: (p: number, w: number, f: number) => `Checks de cohérence · ${p} ok · ${w} moyen · ${f} échec`,
    months: (m: number) => (m >= 12 ? `${(m / 12).toFixed(1).replace(/\.0$/, "").replace(".", ",")} ans` : `${m} mois`),
    gaps: {
      passT: "Aucun trou inexpliqué",
      passD: "chaque transition entre rôles est couverte.",
      warnT: "Trou ancien · peu de poids",
      warnD: (months: string | null) =>
        `${months ? `un trou de ${months}` : "un trou"} en début de parcours. Les recruteurs regardent surtout les années récentes ; celui-ci ressort rarement, une ligne sur le CV suffit à le clore.`,
      failT: "Trou inexpliqué",
      failTail: "sans explication sur aucune source. Les recruteurs demanderont ; réponds-y d'abord sur le CV.",
      failOne: (months: string) => `${months} sans entrée, `,
      failMany: (n: number, months: string) => `${n} trous, le plus long de ${months}, `,
      failGeneric: `une coupure de plus de ${GAP_MONTHS} mois est `,
    },
    dates: {
      passT: "Dates cohérentes entre sources",
      passD: "le même rôle affiche les mêmes dates partout.",
      failT: "Les dates divergent entre sources",
      failCount: (n: number) =>
        `${n} conflit${n === 1 ? "" : "s"} de dates entre tes sources ; le détail est dans la liste d'incohérences plus bas.`,
      failGeneric: "au moins un rôle a des dates différentes selon la source ; le détail est dans la liste d'incohérences plus bas.",
    },
    overlaps: {
      passT: "Aucun chevauchement",
      passD: "un rôle à la fois ; rien à expliquer.",
      failT: "Rôles qui se chevauchent",
      failOne: (months: string | null) => `deux entrées tournent en parallèle${months ? ` pendant ${months}` : ""}.`,
      failMany: (n: number, months: string | null) => `${n} chevauchements${months ? `, le plus long de ${months}` : ""}.`,
      failTail: " Normal si l'un était à temps partiel ; précise-le pour que ça ne se lise pas comme un double emploi.",
    },
    progression: {
      passT: "Progression continue",
      passD: "les titres montent ou se maintiennent à chaque étape. L'arc est propre.",
      failT: "Régression de titre",
      failFromTo: (from: string, to: string) =>
        `« ${from} » vers « ${to} » se lit comme un pas en arrière. Si c'était un changement de périmètre, reformule pour que l'arc avance.`,
      failGeneric: "au moins une étape se lit comme un pas en arrière. Si c'était un changement de périmètre, reformule pour que l'arc avance.",
    },
    tenure: {
      passT: "Ancienneté saine",
      passD: (avg: string | null, roles: number | null) =>
        `${avg ?? "une moyenne solide"} par rôle${roles ? ` sur ${roles} rôles` : ""}, pas de motif de job-hopping.`,
      failT: "Ancienneté courte",
      failD: (avg: string | null, roles: number | null) =>
        `${avg ?? "une moyenne courte"} par rôle${roles ? ` sur ${roles} rôles` : ""}. Sous 18 mois, ça se lit comme du job-hopping ; donne une raison aux passages courts.`,
    },
    future: {
      passT: "Aucune date future",
      passD: "chaque date de fin est passée ou marquée présent.",
      failT: "Entrée datée dans le futur",
      failCount: (n: number) =>
        n === 1
          ? "une entrée dépasse le mois courant. Corrige ; au mieux ça se lit comme une coquille."
          : `${n} entrées dépassent le mois courant. Corrige ; au mieux ça se lit comme des coquilles.`,
      failGeneric: "au moins une date dépasse le mois courant. Corrige ; au mieux ça se lit comme une coquille.",
    },
  },
};

type Lang = (typeof COPY)["en"];

function rowCopy(row: ConsistencyRow, L: Lang): { title: string; detail: string } {
  const d: RowData = row.data ?? {};
  const ok = row.status === "pass";
  switch (row.id) {
    case "unexplained_gaps": {
      const c = L.gaps;
      if (ok) return { title: c.passT, detail: c.passD };
      const months = num(d, "months", "longest_months");
      if (row.status === "warn") {
        return { title: c.warnT, detail: c.warnD(months !== null && months > 0 ? L.months(months) : null) };
      }
      const count = num(d, "gaps");
      const lead =
        months !== null && months > 0
          ? count !== null && count > 1
            ? c.failMany(count, L.months(months))
            : c.failOne(L.months(months))
          : c.failGeneric;
      return { title: c.failT, detail: `${lead}${c.failTail}` };
    }
    case "cross_source_dates": {
      const c = L.dates;
      if (ok) return { title: c.passT, detail: c.passD };
      const desc = str(d, "description");
      if (desc) return { title: c.failT, detail: desc };
      const conflicts = num(d, "conflicts");
      return { title: c.failT, detail: conflicts !== null && conflicts > 0 ? c.failCount(conflicts) : c.failGeneric };
    }
    case "overlaps": {
      const c = L.overlaps;
      if (ok) return { title: c.passT, detail: c.passD };
      const months = num(d, "months", "longest_months");
      const monthsLabel = months !== null && months > 0 ? L.months(months) : null;
      const count = num(d, "overlaps");
      const lead = count !== null && count > 1 ? c.failMany(count, monthsLabel) : c.failOne(monthsLabel);
      return { title: c.failT, detail: `${lead}${c.failTail}` };
    }
    case "forward_progression": {
      const c = L.progression;
      if (ok) return { title: c.passT, detail: c.passD };
      const from = str(d, "from");
      const to = str(d, "to");
      return { title: c.failT, detail: from && to ? c.failFromTo(from, to) : c.failGeneric };
    }
    case "average_tenure": {
      const c = L.tenure;
      const avg = num(d, "avgMonths", "avg_months");
      const roles = num(d, "roleCount", "roles");
      const avgLabel = avg !== null && avg > 0 ? L.months(avg) : null;
      if (ok) return { title: c.passT, detail: c.passD(avgLabel, roles) };
      return { title: c.failT, detail: c.failD(avgLabel, roles) };
    }
    case "future_dates": {
      const c = L.future;
      if (ok) return { title: c.passT, detail: c.passD };
      const count = num(d, "future");
      return { title: c.failT, detail: count !== null && count > 0 ? c.failCount(count) : c.failGeneric };
    }
  }
}

// ── Component ────────────────────────────────────────────────────────────────

type Props = { rows: ConsistencyRow[] };

/**
 * 04 consistency checklist: one row per deterministic timeline check, with the
 * pass/warn/fail icon and localized copy interpolated from the check's data.
 * Rows with status "na" are skipped entirely. Pure display.
 */
export function CvTimelineConsistency({ rows }: Props) {
  const { locale } = useLanguage();
  const L = locale === "fr" ? COPY.fr : COPY.en;

  const visible = (rows ?? []).filter((r) => r.status !== "na");
  if (visible.length === 0) return null;

  const pass = visible.filter((r) => r.status === "pass").length;
  const warn = visible.filter((r) => r.status === "warn").length;
  const fail = visible.filter((r) => r.status === "fail").length;

  return (
    <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, overflow: "hidden", marginTop: 16 }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--rc-border)" }}>
        <span style={{ ...MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, fontWeight: 700, color: "var(--rc-muted)", fontVariantNumeric: "tabular-nums" }}>
          {L.header(pass, warn, fail)}
        </span>
      </div>
      {visible.map((row, i) => {
        const ico = ICO[row.status as Exclude<ConsistencyStatus, "na">];
        const { title, detail } = rowCopy(row, L);
        return (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "26px 1fr",
              gap: 14,
              alignItems: "start",
              padding: "12px 24px",
              borderBottom: i === visible.length - 1 ? "none" : "1px solid var(--rc-border)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                borderRadius: 99,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: ico.color,
                background: ico.bg,
                border: `1px solid ${ico.border}`,
                marginTop: 1,
              }}
            >
              {ico.char}
            </span>
            <p style={{ ...SANS, fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, margin: 0, color: "var(--rc-text)" }}>
              {title}{" "}
              <span style={{ fontWeight: 400, color: "var(--rc-muted)", fontVariantNumeric: "tabular-nums" }}>· {detail}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
