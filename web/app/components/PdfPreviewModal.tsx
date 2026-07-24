"use client";

import { useRef, useState } from "react";
import { useModalA11y } from "../hooks/useModalA11y";
import { X } from "lucide-react";

interface PdfPreviewModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export function PdfPreviewModal({ url, name, onClose }: PdfPreviewModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  // Escape was already handled here; the hook adds the focus trap, initial
  // focus and body scroll lock this dialog was missing.
  useModalA11y(panelRef, true, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className="relative bg-rc-surface border border-rc-border rounded-lg shadow-2xl flex flex-col"
        style={{ width: "min(860px, 95vw)", height: "min(90vh, 1000px)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-rc-border shrink-0">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(201,58,57,0.7)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="font-mono text-[10px] text-rc-hint truncate max-w-[400px]">{name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-rc-hint hover:text-rc-text transition-colors p-1 rounded hover:bg-rc-bg"
            aria-label="Close preview"
          >
            <X size={14} />
          </button>
        </div>

        {/* PDF iframe. A slow PDF used to leave a blank pane with no signal
            that anything was happening. */}
        <div className="relative flex-1 min-h-0">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[11px] uppercase tracking-widest text-rc-hint animate-pulse">
                Loading PDF…
              </span>
            </div>
          )}
          <iframe
            src={url}
            className="w-full h-full rounded-b-lg"
            title={name}
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
