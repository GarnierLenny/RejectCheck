"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-[22px] font-bold text-rc-text tracking-tight mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <div className="mt-5 mb-2">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-rc-text mb-1">{children}</h2>
      <div className="h-px bg-rc-border" />
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-semibold text-rc-text mt-3 mb-0.5">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[12px] text-rc-muted leading-relaxed mb-1">{children}</p>
  ),
  ul: ({ children }) => <ul className="mb-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-1">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-[12px] text-rc-muted leading-relaxed mb-0.5">
      <span className="text-rc-red mt-0.5 shrink-0">–</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-rc-text">{children}</strong>
  ),
  hr: () => null,
};

export function CvMarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <div className="font-sans">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
