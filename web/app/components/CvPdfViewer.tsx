"use client";

import { useCallback, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  url: string;
}

export function CvPdfViewer({ url }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const onContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    setContainerWidth(node.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(node);
  }, []);

  return (
    <div
      ref={onContainerRef}
      className="overflow-y-auto bg-rc-bg border border-rc-border"
      style={{ height: "calc(100vh - 180px)" }}
    >
      {loading && (
        <div className="flex items-center justify-center h-40">
          <span className="font-mono text-[11px] uppercase tracking-widest text-rc-hint animate-pulse">
            Loading PDF…
          </span>
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setLoading(false);
        }}
        onLoadError={() => setLoading(false)}
        loading={null}
        className="flex flex-col items-center gap-2 py-4"
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            width={containerWidth > 0 ? containerWidth - 16 : undefined}
            renderTextLayer={true}
            renderAnnotationLayer={false}
            className="shadow-sm"
          />
        ))}
      </Document>
    </div>
  );
}
