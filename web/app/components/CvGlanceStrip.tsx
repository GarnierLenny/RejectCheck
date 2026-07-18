"use client";

import { useLanguage } from "../../context/language";

const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };

type Props = {
  mergedCounts: { critical: number; major: number; minor: number };
  /** Deterministic structural checks summary; chip omitted when null/undefined. */
  checksPassed?: { passed: number; total: number } | null;
  /** Timeline consistency warn+fail count; chip omitted when null/undefined. */
  timelineFlags?: number | null;
  /** Overall CV strength 0-100 (drives the finish-line sentence). */
  overall: number;
};

/** Invariant label regardless of count (EN adjectives don't pluralize here). */
const invariant = (label: string) => (n: number) => {
  void n;
  return label;
};

const COPY = {
  en: {
    strongBar: "80 = Strong.",
    away: (n: number) =>
      `You are ${n} point${n === 1 ? "" : "s"} away; the two biggest gains are waiting in § 01.`,
    congrats: (overall: number) =>
      `You cleared the bar at ${overall}; what remains below is polish, not rescue.`,
    critical: invariant("critical"),
    major: invariant("major"),
    minor: invariant("minor"),
    checks: (n: number) => (n === 1 ? "structural check passes" : "structural checks pass"),
    flags: (n: number) => (n === 1 ? "timeline flag" : "timeline flags"),
  },
  fr: {
    strongBar: "80 = Fort.",
    away: (n: number) =>
      `Il te manque ${n} point${n === 1 ? "" : "s"} ; les deux plus gros gains t'attendent en § 01.`,
    congrats: (overall: number) =>
      `Barre franchie à ${overall} ; ce qui reste plus bas est du polish, pas du sauvetage.`,
    critical: (n: number) => (n === 1 ? "critique" : "critiques"),
    major: (n: number) => (n === 1 ? "majeur" : "majeurs"),
    minor: (n: number) => (n === 1 ? "mineur" : "mineurs"),
    checks: (n: number) => (n === 1 ? "check structurel ok" : "checks structurels ok"),
    flags: (n: number) => (n === 1 ? "flag timeline" : "flags timeline"),
  },
};

function GlanceChip({
  n,
  label,
  numberColor,
  title,
}: {
  n: number;
  label: string;
  numberColor?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      style={{
        ...SANS,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--rc-surface)",
        border: "1px solid var(--rc-border)",
        borderRadius: 6,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--rc-muted)",
      }}
    >
      <b style={{ fontSize: 15, fontWeight: 700, color: numberColor ?? "var(--rc-text)", fontVariantNumeric: "tabular-nums" }}>
        {n}
      </b>
      {label}
    </span>
  );
}

/**
 * Hero glance strip: the finish-line sentence ("80 = Strong ...") plus the
 * one-row summary chips (issue counts, structural checks, timeline flags).
 * Each optional chip is omitted when its input is null/undefined. Pure display.
 */
export function CvGlanceStrip({ mergedCounts, checksPassed = null, timelineFlags = null, overall }: Props) {
  const { locale } = useLanguage();
  const L = locale === "fr" ? COPY.fr : COPY.en;

  const away = Math.max(0, 80 - overall);

  return (
    <div>
      <p style={{ ...SANS, fontSize: 13, lineHeight: 1.55, color: "var(--rc-hint)", margin: "0 0 18px", fontVariantNumeric: "tabular-nums" }}>
        <b style={{ color: "var(--rc-text)", fontWeight: 600 }}>{L.strongBar}</b>{" "}
        {overall >= 80 ? L.congrats(overall) : L.away(away)}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <GlanceChip
          n={mergedCounts.critical}
          label={L.critical(mergedCounts.critical)}
          numberColor={mergedCounts.critical > 0 ? "var(--rc-red)" : undefined}
        />
        <GlanceChip
          n={mergedCounts.major}
          label={L.major(mergedCounts.major)}
          numberColor={mergedCounts.major > 0 ? "var(--rc-amber)" : undefined}
        />
        <GlanceChip n={mergedCounts.minor} label={L.minor(mergedCounts.minor)} />
        {checksPassed != null && (
          <GlanceChip
            n={checksPassed.passed}
            label={L.checks(checksPassed.passed)}
            numberColor="var(--rc-green)"
            title={`${checksPassed.passed}/${checksPassed.total}`}
          />
        )}
        {timelineFlags != null && (
          <GlanceChip
            n={timelineFlags}
            label={L.flags(timelineFlags)}
            numberColor={timelineFlags > 0 ? "var(--rc-amber)" : "var(--rc-green)"}
          />
        )}
      </div>
    </div>
  );
}
