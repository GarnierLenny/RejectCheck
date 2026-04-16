"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-rc-text mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <div className="mt-5 mb-2">
      <h2 className="text-[9px] font-bold uppercase tracking-[2px] text-rc-text">{children}</h2>
      <div className="h-px bg-rc-border mt-1" />
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-[11px] font-bold text-rc-text mt-2 mb-0.5">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[11px] text-rc-muted leading-relaxed mb-1">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-0.5 mb-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-0.5 mb-1 list-none">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-[11px] text-rc-muted leading-relaxed">
      <span className="shrink-0 mt-0.5">–</span>
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
