"use client";

import { useState } from "react";
import { Loader2, Copy, Check, RefreshCw, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useGenerateCoverLetter } from "../../../lib/mutations";
import { generateCoverLetterPdf } from "../../utils/export";
import { useLanguage } from "../../../context/language";
import { PremiumPaywall } from "../PremiumFeature";

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Match job description" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
];

const LANG_NAMES: Record<string, string> = {
  en: "English", fr: "French", es: "Spanish", de: "German",
};

type Props = {
  analysisId: number | null;
  isPremium: boolean;
  company?: string | null;
  candidateName?: string | null;
  savedCoverLetter?: string | null;
};

export function CoverLetterTab({ analysisId, isPremium, company, candidateName, savedCoverLetter }: Props) {
  const { t } = useLanguage();
  const [language, setLanguage] = useState("auto");
  const [coverLetter, setCoverLetter] = useState<string | null>(savedCoverLetter ?? null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { mutate, isPending, isError } = useGenerateCoverLetter();

  if (!isPremium) {
    return (
      <PremiumPaywall
        badge={t.coverLetterTab.premiumBadge}
        title={t.coverLetterTab.premiumTitle}
        description={t.coverLetterTab.premiumDesc}
        ctaLabel={t.coverLetterTab.unlockButton}
      />
    );
  }

  function handleGenerate() {
    if (!analysisId) return;
    mutate(
      { analysisId, language },
      {
        onSuccess: (data) => {
          setCoverLetter(data.coverLetter);
          setDetectedLanguage(data.detectedLanguage);
        },
      },
    );
  }

  async function handleCopy() {
    if (!coverLetter) return;
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExportPdf() {
    if (!coverLetter) return;
    setIsExportingPdf(true);
    try {
      const namePart = (candidateName ?? "cover-letter").replace(/\s+/g, "_");
      const companyPart = (company ?? "").replace(/\s+/g, "_");
      const filename = [namePart, companyPart, "cover"].filter(Boolean).join("_") + ".pdf";
      await generateCoverLetterPdf(coverLetter, filename);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold text-rc-text tracking-tight">
            {t.coverLetterTab.title}
          </h2>
          <p className="text-[13px] text-rc-muted mt-0.5">
            {t.coverLetterTab.subtitle}
          </p>
        </div>
        {/* Language selector */}
        <div className="flex flex-col items-end gap-1">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-rc-hint">
            {t.coverLetterTab.languageLabel}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="font-mono text-[11px] bg-rc-surface border border-rc-border rounded-lg px-3 py-1.5 text-rc-text focus:outline-none focus:border-rc-red/40"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {detectedLanguage && language === "auto" && (
            <span className="font-mono text-[10px] text-rc-hint">
              {t.coverLetterTab.autoDetected}: {LANG_NAMES[detectedLanguage] ?? detectedLanguage}
            </span>
          )}
        </div>
      </div>

      {/* Generate button - shown before first generation */}
      {!coverLetter && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleGenerate}
            disabled={isPending || !analysisId}
            className="flex items-center gap-2 px-8 py-4 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.coverLetterTab.generating}
              </>
            ) : (
              t.coverLetterTab.generateButton
            )}
          </button>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <p className="text-center text-[13px] text-rc-red">{t.coverLetterTab.error}</p>
      )}

      {/* Cover letter card */}
      {coverLetter && (
        <div className="space-y-4">
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-8">
            <div className="font-sans">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-[18px] font-bold text-rc-text mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-[16px] font-semibold text-rc-text mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-[14px] font-semibold text-rc-text mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-[14px] text-rc-text leading-[1.8] mb-4 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-rc-text">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-[14px] text-rc-text leading-[1.8]">{children}</li>,
                }}
              >
                {coverLetter}
              </ReactMarkdown>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 border border-rc-border rounded-lg text-[12px] font-mono text-rc-muted hover:text-rc-text hover:border-rc-text/20 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rc-green" />
                  {t.coverLetterTab.copied}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {t.coverLetterTab.copy}
                </>
              )}
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 border border-rc-border rounded-lg text-[12px] font-mono text-rc-muted hover:text-rc-text hover:border-rc-text/20 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isExportingPdf ? t.coverLetterTab.exporting : t.coverLetterTab.exportPdf}
            </button>

            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="flex items-center gap-2 text-[12px] font-mono text-rc-hint hover:text-rc-muted transition-colors ml-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
              {isPending ? t.coverLetterTab.regenerating : t.coverLetterTab.regenerate}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
