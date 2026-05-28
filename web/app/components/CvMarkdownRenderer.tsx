"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };

const components: Components = {
  h1: ({ children }) => (
    <h1 style={{ ...SANS, fontSize: 22, fontWeight: 700, color: "var(--rc-text)", letterSpacing: "-0.025em", marginBottom: 4, marginTop: 0 }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      <h2 style={{ ...MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, color: "var(--rc-text)", marginBottom: 4 }}>{children}</h2>
      <div style={{ height: 1, background: "var(--rc-border)" }} />
    </div>
  ),
  h3: ({ children }) => (
    <h3 style={{ ...SANS, fontSize: 13, fontWeight: 600, color: "var(--rc-text)", marginTop: 12, marginBottom: 2 }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ ...SANS, fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.65, marginBottom: 4, marginTop: 0 }}>{children}</p>
  ),
  ul: ({ children }) => <ul style={{ marginBottom: 4, paddingLeft: 0, listStyle: "none" }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ marginBottom: 4, paddingLeft: 16 }}>{children}</ol>,
  li: ({ children }) => (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--rc-muted)", lineHeight: 1.65, marginBottom: 2, ...SANS }}>
      <span style={{ color: "var(--rc-red)", marginTop: 1, flexShrink: 0 }}>–</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600, color: "var(--rc-text)" }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle: "italic" }}>{children}</em>
  ),
  hr: () => null,
};

export function CvMarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <div style={{ ...SANS }}>
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
