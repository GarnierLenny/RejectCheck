"use client";

import type { KeywordMatchEntry, KeywordMatchResult } from "./types";

// Verifiable present/absent keyword table (deterministic, no LLM). Rows come
// pre-sorted worst-gap-first from the backend, so this reads top-to-bottom as a
// "fix these first" to-do list.

type Labels = {
  present: string;
  missing: string;
  required: string;
  nice: string;
};

export function KeywordMatchTable({
  match,
  labels,
}: {
  match: KeywordMatchResult;
  labels: Labels;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {match.keywords.map((k) => (
        <Row key={`${k.term}-${k.category}`} k={k} labels={labels} />
      ))}
    </div>
  );
}

function Row({ k, labels }: { k: KeywordMatchEntry; labels: Labels }) {
  const present = k.presentInCv;
  const accent = present
    ? "var(--rc-green)"
    : k.required
      ? "var(--rc-red)"
      : "var(--rc-amber)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 12px",
        borderRadius: 4,
        background: present ? "transparent" : "color-mix(in srgb, " + accent + " 5%, transparent)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: accent,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--rc-text)",
        }}
      >
        {k.term}
      </span>
      {k.required && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--rc-red)",
            border: "1px solid color-mix(in srgb, var(--rc-red) 35%, transparent)",
            borderRadius: 3,
            padding: "1px 5px",
          }}
        >
          {labels.required}
        </span>
      )}
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {present ? labels.present : labels.missing}
      </span>
    </div>
  );
}
