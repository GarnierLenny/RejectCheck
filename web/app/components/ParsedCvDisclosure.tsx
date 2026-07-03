"use client";

import { useLanguage } from "../../context/language";

/**
 * "Parse proof" — shows the plain text an ATS actually extracts from the
 * uploaded PDF. Tangible differentiator: if the parsed text is garbled or out
 * of order, the recruiter's software sees the same, and the user can fix their
 * PDF's structure. Collapsed by default so it doesn't crowd the report.
 */
export function ParsedCvDisclosure({ text }: { text?: string | null }) {
  const { t } = useLanguage();
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;
  const c = t.analysisLayout.parsedCv;

  return (
    <details className="rc-parsed-cv" style={{ marginBottom: 20 }}>
      <summary
        style={{
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--rc-hint)",
          padding: "8px 0",
        }}
      >
        {c.summary}
      </summary>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--rc-muted)",
          margin: "4px 0 12px",
          maxWidth: 620,
        }}
      >
        {c.hint}
      </p>
      <pre
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--rc-text)",
          background: "var(--rc-surface)",
          border: "1px solid var(--rc-border)",
          borderRadius: 6,
          padding: "16px 18px",
          maxHeight: 360,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {trimmed}
      </pre>
    </details>
  );
}
