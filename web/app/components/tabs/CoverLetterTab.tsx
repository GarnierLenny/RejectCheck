"use client";

import { useState } from "react";
import { Loader2, Copy, Check, RefreshCw, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useGenerateCoverLetter } from "../../../lib/mutations";
import { generateCoverLetterPdf } from "../../utils/export";
import { useLanguage } from "../../../context/language";
import { PremiumPaywall } from "../PremiumFeature";

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
const DISPLAY_ITALIC: React.CSSProperties = {
  fontWeight: 700, color: "var(--rc-red)",
};

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

  const ghostBtn: React.CSSProperties = {
    ...MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "7px 12px", border: "1px solid var(--rc-border)", borderRadius: 4,
    cursor: "pointer", background: "var(--rc-surface)", color: "var(--rc-hint)",
    display: "inline-flex", alignItems: "center", gap: 6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header + language selector */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(22px,2.4vw,32px)", letterSpacing: "-0.025em", margin: "0 0 6px", lineHeight: 1.1 }}>
            {t.coverLetterTab.headline} <span style={DISPLAY_ITALIC}>{t.coverLetterTab.headlineAccent}</span>
          </h3>
          <p style={{ ...MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--rc-hint)", margin: 0 }}>
            {t.coverLetterTab.subtitle}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
          <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--rc-hint)" }}>
            {t.coverLetterTab.languageLabel}
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ ...MONO, fontSize: 11, background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 4, padding: "6px 10px", color: "var(--rc-text)", cursor: "pointer" }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {detectedLanguage && language === "auto" && (
            <span style={{ ...MONO, fontSize: 9, color: "var(--rc-hint)" }}>
              {t.coverLetterTab.autoDetected}: {LANG_NAMES[detectedLanguage] ?? detectedLanguage}
            </span>
          )}
        </div>
      </div>

      {/* Generate CTA (before first generation) */}
      {!coverLetter && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <button
            onClick={handleGenerate}
            disabled={isPending || !analysisId}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "14px 32px", background: "var(--rc-red)", color: "#fff",
              border: "none", borderRadius: 6,
              cursor: isPending || !analysisId ? "not-allowed" : "pointer",
              opacity: isPending || !analysisId ? 0.55 : 1,
              boxShadow: "0 8px 24px rgba(201,58,57,0.22)",
            }}
          >
            {isPending
              ? <><Loader2 size={14} className="animate-spin" />{t.coverLetterTab.generating}</>
              : t.coverLetterTab.generateButton
            }
          </button>
        </div>
      )}

      {isError && (
        <p style={{ ...SANS, fontSize: 13, color: "var(--rc-red)", textAlign: "center", margin: 0 }}>{t.coverLetterTab.error}</p>
      )}

      {/* Result */}
      {coverLetter && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: "36px 40px" }}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ ...SANS, fontSize: 18, fontWeight: 700, color: "var(--rc-text)", marginBottom: 16 }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ ...SANS, fontSize: 16, fontWeight: 600, color: "var(--rc-text)", marginBottom: 12 }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ ...SANS, fontSize: 14, fontWeight: 600, color: "var(--rc-text)", marginBottom: 10 }}>{children}</h3>,
                p: ({ children }) => <p style={{ ...SANS, fontSize: 14, color: "var(--rc-text)", lineHeight: 1.8, marginBottom: 16 }}>{children}</p>,
                strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 16 }}>{children}</ul>,
                li: ({ children }) => <li style={{ ...SANS, fontSize: 14, color: "var(--rc-text)", lineHeight: 1.8 }}>{children}</li>,
              }}
            >
              {coverLetter}
            </ReactMarkdown>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleCopy} style={ghostBtn}>
              {copied
                ? <><Check size={12} style={{ color: "var(--rc-green)" }} />{t.coverLetterTab.copied}</>
                : <><Copy size={12} />{t.coverLetterTab.copy}</>
              }
            </button>
            <button onClick={handleExportPdf} disabled={isExportingPdf} style={{ ...ghostBtn, opacity: isExportingPdf ? 0.5 : 1, cursor: isExportingPdf ? "wait" : "pointer" }}>
              <Download size={12} />
              {isExportingPdf ? t.coverLetterTab.exporting : t.coverLetterTab.exportPdf}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              style={{ ...MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--rc-hint)", background: "none", border: "none", cursor: isPending ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto", padding: 0 }}
            >
              <RefreshCw size={12} className={isPending ? "animate-spin" : ""} />
              {isPending ? t.coverLetterTab.regenerating : t.coverLetterTab.regenerate}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
