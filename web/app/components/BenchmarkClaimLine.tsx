"use client";

import { useMemo } from "react";
import { useLanguage } from "../../context/language";
import { buildBenchmarkClaim, FAMILY_LABEL, AXIS_CLAIM_LABEL } from "../lib/role-benchmark";

const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };

type Props = {
  /** Reconstructed CV text. Null/empty renders nothing. */
  cvText: string | null | undefined;
  /** projected_profile.target_roles + domains, same hints the benchmark panel uses. */
  roleHints: string[];
  /** cv_quality.overall — the headline this claim sits under, and gates on. */
  overall: number;
};

/**
 * The one comparative claim we put next to the headline score: "top quartile on
 * X, vs N <family> resumes". Gives the bare number a referent, which is the
 * whole reason a score is worth sharing at all.
 *
 * Renders NOTHING unless the CV genuinely clears the corpus top quartile on some
 * axis (buildBenchmarkClaim returns null otherwise). No consolation phrasing, no
 * softened version for a weak CV: an unearned flex would be exactly the
 * fabrication the anchored scorer exists to prevent.
 */
export function BenchmarkClaimLine({ cvText, roleHints, overall }: Props) {
  const { locale } = useLanguage();
  const lang = locale === "fr" ? "fr" : "en";
  // roleHints is built inline by the caller, so a new array identity every
  // render. Key the memo on its contents, not its reference.
  const hintKey = roleHints.join("|");
  const claim = useMemo(
    () =>
      cvText && cvText.trim().length > 0
        ? buildBenchmarkClaim(cvText, roleHints, overall)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cvText, hintKey, overall],
  );

  if (!claim) return null;

  const fam = FAMILY_LABEL[claim.family]?.[lang] ?? claim.family;
  const axis = AXIS_CLAIM_LABEL[claim.axis][lang];
  const text =
    lang === "fr"
      ? `Quartile supérieur sur ${axis}, vs ${claim.n} CV ${fam}`
      : `Top quartile on ${axis}, vs ${claim.n} ${fam} resumes`;

  return (
    <div style={{ margin: "16px 0 0" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 13px",
          background: "var(--rc-green-bg)",
          border: "1px solid var(--rc-green-border)",
          borderRadius: 6,
        }}
      >
        <span
          style={{
            ...MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--rc-green)",
          }}
        >
          {lang === "fr" ? "Point fort" : "Standout"}
        </span>
        <span style={{ ...SANS, fontSize: 12.5, fontWeight: 600, color: "var(--rc-text)", fontVariantNumeric: "tabular-nums" }}>
          {text}
        </span>
      </span>
      <p style={{ ...MONO, fontSize: 10.5, lineHeight: 1.5, color: "var(--rc-hint)", margin: "8px 0 0", maxWidth: 560 }}>
        {lang === "fr"
          ? "Mesuré sur la mécanique de surface, contre des CV typiques du domaine (pas labellisés par résultat)."
          : "Measured on surface mechanics, against typical resumes in your field (not outcome-labeled)."}
      </p>
    </div>
  );
}
