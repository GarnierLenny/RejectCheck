"use client";

import dynamic from "next/dynamic";

// Lazy + client-only: @react-pdf/renderer (~3 MB, ESM) must stay out of the
// server bundle, so we dynamic-import a LOCAL wrapper (CvPdfDocument) with
// ssr:false — same pattern as the negotiation salary chart. Importing the bare
// ESM package here directly breaks the server compile ("ESM packages need to be
// imported").
// The chunk is ~3 MB, so without a `loading` fallback the user stares at an
// empty 520px box while it downloads.
const CvPdfDocument = dynamic(() => import("./CvPdfDocument"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--rc-hint)",
      }}
    >
      <span className="animate-pulse">Building your PDF preview…</span>
    </div>
  ),
});

/**
 * Renders the exact CvRewritePdf document (the same template used for the
 * download) inside an inline viewer, so the preview matches the downloaded PDF
 * pixel for pixel — a real A4 page instead of screen-styled markdown.
 */
export function CvPdfPreview({ cvText, height = 520 }: { cvText: string | null; height?: number }) {
  if (!cvText || cvText.trim().length === 0) return null;

  return (
    <div style={{ height, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(201,58,57,0.2)", background: "var(--rc-surface-hero)" }}>
      <CvPdfDocument cvText={cvText} />
    </div>
  );
}
