"use client";

import dynamic from "next/dynamic";

// Lazy + client-only: @react-pdf/renderer (~3 MB, ESM) must stay out of the
// server bundle, so we dynamic-import a LOCAL wrapper (CvPdfDocument) with
// ssr:false — same pattern as the negotiation salary chart. Importing the bare
// ESM package here directly breaks the server compile ("ESM packages need to be
// imported").
const CvPdfDocument = dynamic(() => import("./CvPdfDocument"), { ssr: false });

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
