"use client";

import { useState, useEffect } from "react";
import { X, FileDown, Check, FileText } from "lucide-react";
import type { AnalysisResult } from "./types";
import { generatePdf, generateMarkdown, triggerDownload, getExportFilenames } from "../utils/export";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
}

export function ExportModal({ isOpen, onClose, result }: ExportModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setSelectedFormats([]); // Reset on open
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format) 
        : [...prev, format]
    );
  };

  const handleDownload = async () => {
    if (!result || selectedFormats.length === 0) return;
    
    setIsDownloading(true);
    try {
      const { pdf: pdfName, md: mdName } = getExportFilenames(result);

      if (selectedFormats.includes("PDF")) {
        await generatePdf(result, pdfName);
      }
      
      if (selectedFormats.includes("Markdown")) {
        const mdContent = generateMarkdown(result);
        triggerDownload(mdContent, mdName, "text/markdown");
      }

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-rc-text/40 backdrop-blur-md" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className={`relative bg-white border border-rc-border rounded-3xl p-8 w-full max-w-[420px] shadow-[0_40px_100px_rgba(0,0,0,0.15)] transition-all duration-300 transform ${isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95"}`}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-rc-hint hover:text-rc-red transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <div className="w-12 h-12 bg-rc-red/5 rounded-2xl flex items-center justify-center mb-5 border border-rc-red/10">
            <FileDown className="w-6 h-6 text-rc-red" />
          </div>
          <h2 className="text-2xl font-bold text-rc-text mb-2">Export Analysis</h2>
          <p className="text-rc-muted text-sm leading-relaxed">Select the formats you want to download for this analysis.</p>
        </div>

        <div className="space-y-3 mb-10">
          <button 
            onClick={() => toggleFormat("PDF")}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${selectedFormats.includes("PDF") ? "bg-rc-red/5 border-rc-red/30" : "bg-rc-bg border-rc-border hover:border-rc-hint"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selectedFormats.includes("PDF") ? "bg-rc-red text-white" : "bg-white border border-rc-border text-rc-hint"}`}>
                <Check className={`w-4 h-4 transition-all ${selectedFormats.includes("PDF") ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
              </div>
              <span className={`font-medium ${selectedFormats.includes("PDF") ? "text-rc-text" : "text-rc-muted"}`}>PDF Report</span>
            </div>
            <FileText className={`w-4 h-4 ${selectedFormats.includes("PDF") ? "text-rc-red" : "text-rc-hint"}`} />
          </button>

          <button 
            onClick={() => toggleFormat("Markdown")}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${selectedFormats.includes("Markdown") ? "bg-rc-red/5 border-rc-red/30" : "bg-rc-bg border-rc-border hover:border-rc-hint"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selectedFormats.includes("Markdown") ? "bg-rc-red text-white" : "bg-white border border-rc-border text-rc-hint"}`}>
                <Check className={`w-4 h-4 transition-all ${selectedFormats.includes("Markdown") ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
              </div>
              <span className={`font-medium ${selectedFormats.includes("Markdown") ? "text-rc-text" : "text-rc-muted"}`}>Markdown (Obsidian/Notion)</span>
            </div>
            <span className={`font-mono text-[10px] p-1 rounded ${selectedFormats.includes("Markdown") ? "bg-rc-red/10 text-rc-red" : "bg-rc-border/50 text-rc-hint"}`}>.MD</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 px-6 rounded-2xl bg-rc-bg border border-rc-border font-mono text-[11px] tracking-widest uppercase text-rc-hint hover:text-rc-text transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            disabled={selectedFormats.length === 0 || isDownloading}
            className={`flex-[1.5] py-4 px-6 rounded-2xl font-mono text-[11px] tracking-widest uppercase transition-all shadow-lg ${
              selectedFormats.length > 0 
                ? "bg-rc-red text-white shadow-rc-red/20 hover:scale-[1.02] active:scale-95" 
                : "bg-rc-border text-rc-muted shadow-none cursor-not-allowed"
            }`}
          >
            {isDownloading ? "Downloading..." : "Download Selected"}
          </button>
        </div>
      </div>
    </div>
  );
}
