"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { CvRewritePdf } from "./CvRewritePdf";

/**
 * Client-only inner: statically imports the ESM @react-pdf/renderer viewer and
 * the shared CvRewritePdf template. Loaded exclusively through a
 * next/dynamic(..., { ssr: false }) call in CvPdfPreview, so it never enters the
 * server bundle (which cannot externalise the ESM package).
 */
export default function CvPdfDocument({ cvText }: { cvText: string }) {
  return (
    <PDFViewer showToolbar={false} style={{ width: "100%", height: "100%", border: "none" }}>
      <CvRewritePdf cvText={cvText} />
    </PDFViewer>
  );
}
