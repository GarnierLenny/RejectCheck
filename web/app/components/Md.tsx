"use client";
import ReactMarkdown from "react-markdown";

// House rule: no long dashes (em "—", en "–", horizontal bar "―") in any
// AI-generated copy — they read as machine-written. The backend already strips
// them from every finished payload; this cleans the streamed partials too, so a
// dash never flashes on screen mid-generation. Numeric ranges stay a hyphen.
export function stripLongDashes(text: string): string {
  if (!/[–—―]/.test(text)) return text;
  return text
    .replace(/(\d)[ \t]*[–—―][ \t]*(\d)/g, "$1-$2")
    .replace(/[ \t]*[–—―]+[ \t]*/g, ", ");
}

// Renders markdown inline — strips the wrapping <p> so it works inside
// existing block elements (h4, p, blockquote, etc.).
export function Md({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
      {stripLongDashes(children)}
    </ReactMarkdown>
  );
}
