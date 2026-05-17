"use client";
import ReactMarkdown from "react-markdown";

// Renders markdown inline — strips the wrapping <p> so it works inside
// existing block elements (h4, p, blockquote, etc.).
export function Md({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
      {children}
    </ReactMarkdown>
  );
}
