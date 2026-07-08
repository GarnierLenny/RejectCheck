"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Download, CheckCircle2, Wand2, Zap, ScanSearch, TrendingUp, FileWarning } from "lucide-react";
import { generateCvPdf } from "../../utils/export";
import { CvMarkdownRenderer } from "../CvMarkdownRenderer";
import { useLanguage } from "../../../context/language";
import { PremiumPaywall } from "../PremiumFeature";

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const SANS: React.CSSProperties = { fontFamily: "var(--font-sans)" };
const DISPLAY_ITALIC: React.CSSProperties = {
  fontWeight: 700, color: "var(--rc-red)",
};

type ImproveTabProps = {
  reconstructedCv: string | null;
  isLoading: boolean;
  isPremium: boolean;
  hasAnalysisId: boolean;
  onRewrite: () => void;
};

export function ImproveTab({ reconstructedCv, isLoading, isPremium, hasAnalysisId, onRewrite }: ImproveTabProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { t } = useLanguage();

  async function handleExport() {
    if (!reconstructedCv) return;
    setIsExportingPdf(true);
    try {
      await generateCvPdf(reconstructedCv, "cv-rewritten.pdf");
    } catch {
      // silently fail
    } finally {
      setIsExportingPdf(false);
    }
  }

  if (!isPremium) {
    return (
      <PremiumPaywall
        badge={t.improveTab.premiumBadge}
        title={t.improveTab.premiumTitle}
        description={t.improveTab.premiumDesc}
        ctaLabel={t.improveTab.unlockButton}
      />
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--rc-red)" }} />
        <span style={{ ...MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-hint)" }}>
          {t.improveTab.rewriting}
        </span>
      </div>
    );
  }

  if (reconstructedCv) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: "var(--rc-green)", flexShrink: 0 }} />
            <span style={{ ...SANS, fontSize: 15, fontWeight: 600, color: "var(--rc-text)" }}>{t.improveTab.cvReady}</span>
          </div>
          <button
            onClick={onRewrite}
            style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {t.improveTab.regenerate}
          </button>
        </div>

        <div>
          <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-red)", fontWeight: 700, marginBottom: 10 }}>
            {t.improveTab.yourImprovedCv}
          </div>
          <div style={{ height: 520, overflowY: "auto", borderRadius: 6, border: "1px solid rgba(201,58,57,0.2)", background: "var(--rc-surface)", padding: "28px 32px" }}>
            <CvMarkdownRenderer markdown={reconstructedCv} />
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExportingPdf}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
            ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "13px 26px", background: "var(--rc-red)", color: "#fff",
            border: "none", borderRadius: 6, cursor: isExportingPdf ? "wait" : "pointer",
            opacity: isExportingPdf ? 0.7 : 1, boxShadow: "0 8px 24px rgba(201,58,57,0.22)",
          }}
        >
          {isExportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {t.improveTab.downloadPdf}
        </button>

        <span style={{ ...MONO, fontSize: 10, color: "var(--rc-hint)", lineHeight: 1.6 }}>
          {t.improveTab.pdfNote}
        </span>
      </div>
    );
  }

  const fixes = [
    { Icon: Zap,         color: "var(--rc-red)",   text: t.improveTab.fixes[0].text },
    { Icon: ScanSearch,  color: "var(--rc-amber)",  text: t.improveTab.fixes[1].text },
    { Icon: TrendingUp,  color: "#8b5cf6",          text: t.improveTab.fixes[2].text },
    { Icon: FileWarning, color: "var(--rc-hint)",   text: t.improveTab.fixes[3].text },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h3 style={{ ...SANS, fontWeight: 500, fontSize: "clamp(22px,2.4vw,32px)", letterSpacing: "-0.025em", margin: "0 0 6px", lineHeight: 1.1 }}>
          {t.improveTab.cvFixed.split(",")[0]},{" "}
          <span style={DISPLAY_ITALIC}>{t.improveTab.cvFixed.split(",")[1]?.trim()}</span>
        </h3>
        <p style={{ ...MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--rc-hint)", margin: 0 }}>
          {t.improveTab.cvFixedSubtitle}
        </p>
      </div>

      <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6, padding: "22px 24px" }}>
        <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700, marginBottom: 16 }}>
          {t.improveTab.whatGetsRewritten}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fixes.map(({ Icon, color, text }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Icon size={14} style={{ color, flexShrink: 0, marginTop: 1 }} />
              <span style={{ ...SANS, fontSize: 13, color: "var(--rc-text)", lineHeight: 1.55 }}>
                <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{text}</ReactMarkdown>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: 6 }}>
        <Wand2 size={13} style={{ color: "var(--rc-hint)", flexShrink: 0, marginTop: 1 }} />
        <span style={{ ...MONO, fontSize: 10, color: "var(--rc-hint)", lineHeight: 1.6 }}>
          {t.improveTab.noFabrication}
        </span>
      </div>

      {!hasAnalysisId ? (
        <span style={{ ...SANS, fontSize: 13, color: "var(--rc-hint)" }}>{t.improveTab.signInRequired}</span>
      ) : (
        <button
          onClick={onRewrite}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
            ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "13px 26px", background: "var(--rc-red)", color: "#fff",
            border: "none", borderRadius: 6, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(201,58,57,0.22)",
          }}
        >
          <Wand2 size={14} />
          {t.improveTab.rewriteButton}
        </button>
      )}
    </div>
  );
}
