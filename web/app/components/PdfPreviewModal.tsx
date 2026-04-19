"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface PdfPreviewModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export function PdfPreviewModal({ url, name, onClose }: PdfPreviewModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
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
          >
            <X size={14} />
          </button>
        </div>

        {/* PDF iframe */}
        <iframe
          src={url}
          className="flex-1 w-full rounded-b-lg"
          title={name}
        />
      </div>
    </div>
  );
}
