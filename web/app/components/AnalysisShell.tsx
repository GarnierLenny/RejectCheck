"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocTab = "cv" | "cover" | "linkedin";

export type AnalysisShellRenderProps = {
  focusedIssueId: string | null;
  onHighlightClick: (id: string) => void;
};

export type AnalysisShellProps = {
  cvBlobUrl: string | null;
  liBlobUrl?: string | null;
  mlBlobUrl?: string | null;
  reconstructedCv?: string | null;
  renderRight: (props: AnalysisShellRenderProps) => React.ReactNode;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const R_SM = "4px";

function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", ...style }}>
      {children}
    </span>
  );
}

function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", ...style }}>{children}</span>;
}

// ── ParsedCvView ──────────────────────────────────────────────────────────────

const SECTION_RE = /^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\s]{3,}$|^[A-Z][^a-z]{2,}:?\s*$/;
const ROLE_LINE_RE = /^[A-Z].*—|^[A-Z][^.]{5,}(?:\s—\s|\s[-–]\s)/;

function ParsedCvView({ text }: { text: string }) {
  const lines = text.split("\n");
  let first = true;
  return (
    <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.7, color: "var(--rc-muted)" }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 10 }} />;
        if (first && i < 5) {
          if (i === 0) { first = false; return <div key={i} style={{ fontFamily: "var(--font-sans)", fontSize: 21, fontWeight: 700, color: "var(--rc-text)", letterSpacing: "-0.01em", marginBottom: 2 }}>{trimmed}</div>; }
          return <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--rc-hint)", marginBottom: i === 1 ? 20 : 4 }}>{trimmed}</div>;
        }
        if (SECTION_RE.test(trimmed)) {
          return (
            <div key={i} style={{ marginTop: 22, marginBottom: 8 }}>
              <Eyebrow style={{ letterSpacing: "0.14em" }}>{trimmed.replace(/:$/, "")}</Eyebrow>
              <div style={{ height: 1, background: "var(--rc-border)", marginTop: 7 }} />
            </div>
          );
        }
        if (ROLE_LINE_RE.test(trimmed)) {
          return <div key={i} style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, color: "var(--rc-text)", marginTop: 16, marginBottom: 2 }}>{trimmed}</div>;
        }
        if (/^\d{4}/.test(trimmed) || /^[A-Za-z]+\s\d{4}/.test(trimmed)) {
          return <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rc-hint)", marginBottom: 8 }}>{trimmed}</div>;
        }
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("·")) {
          return (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <span style={{ color: "var(--rc-border)", flexShrink: 0, marginTop: 2 }}>·</span>
              <span>{trimmed.replace(/^[•\-·]\s*/, "")}</span>
            </div>
          );
        }
        return <div key={i} style={{ marginBottom: 4 }}>{trimmed}</div>;
      })}
    </div>
  );
}

// ── AnalysisShell ─────────────────────────────────────────────────────────────

export function AnalysisShell({
  cvBlobUrl,
  liBlobUrl = null,
  mlBlobUrl = null,
  reconstructedCv,
  renderRight,
}: AnalysisShellProps) {
  const [cvPanelOpen, setCvPanelOpen] = useState(true);
  const [docTab, setDocTab] = useState<DocTab>("cv");
  const [parsedMode, setParsedMode] = useState(false);
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);

  const allDocs: { id: DocTab; label: string; blobUrl: string | null; missingMsg: string }[] = [
    { id: "cv",       label: "CV",           blobUrl: cvBlobUrl,  missingMsg: "No CV was provided for this analysis." },
    { id: "cover",    label: "Cover letter", blobUrl: mlBlobUrl,  missingMsg: "No cover letter was provided for this analysis." },
    { id: "linkedin", label: "LinkedIn",     blobUrl: liBlobUrl,  missingMsg: "No LinkedIn PDF was provided for this analysis." },
  ];

  const currentDoc = allDocs.find((d) => d.id === docTab) ?? allDocs[0];
  const activeParsed = parsedMode;

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Left panel — Source documents ── */}
      <div style={{ width: cvPanelOpen ? 520 : 40, flexShrink: 0, borderRight: "1px solid var(--rc-border)", display: "flex", flexDirection: "column", background: "var(--rc-surface)", transition: "width 0.22s ease", overflow: "hidden" }}>
        {cvPanelOpen ? (
          <>
            {/* Header: label + collapse button */}
            <div style={{ flexShrink: 0, borderBottom: "1px solid var(--rc-border)", padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Eyebrow>Source document</Eyebrow>
                <button
                  onClick={() => setCvPanelOpen(false)}
                  title="Collapse panel"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: R_SM, border: "1px solid var(--rc-border)", background: "var(--rc-bg)", cursor: "pointer", color: "var(--rc-hint)", flexShrink: 0 }}
                >
                  <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2L3 6.5L8 11"/></svg>
                </button>
              </div>

              {/* Doc switcher + Raw/Parsed toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", border: "1px solid var(--rc-border)", borderRadius: R_SM, overflow: "hidden", background: "var(--rc-bg)", flexShrink: 0 }}>
                  {allDocs.map((d, i) => {
                    const active = d.id === docTab;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDocTab(d.id)}
                        style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, padding: "7px 13px", color: active ? "var(--rc-surface)" : d.blobUrl ? "var(--rc-muted)" : "var(--rc-border)", background: active ? "var(--rc-text)" : "transparent", borderLeft: i > 0 ? "1px solid var(--rc-border)" : "none", cursor: "pointer" }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: activeParsed ? "var(--rc-hint)" : "var(--rc-text)" }}>Raw</span>
                  <div
                    onClick={() => setParsedMode((v) => !v)}
                    style={{ width: 42, height: 22, borderRadius: 99, background: activeParsed ? "var(--rc-text)" : "var(--rc-border)", position: "relative", cursor: "pointer", transition: "background 0.15s" }}
                  >
                    <div style={{ position: "absolute", top: 2, left: activeParsed ? 22 : 2, width: 18, height: 18, borderRadius: 99, background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.18)" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: activeParsed ? "var(--rc-text)" : "var(--rc-hint)" }}>Parsed</span>
                </div>
              </div>
            </div>

            {/* Panel content */}
            {(() => {
              if (activeParsed && !(currentDoc.id === "cv" && reconstructedCv)) {
                const msg = currentDoc.id === "cv"
                  ? "Parsed text is not available for this analysis. Re-run the analysis to get it."
                  : "Parsed view is only available for the CV document.";
                return (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "0 40px", textAlign: "center" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--rc-border)" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-hint)", lineHeight: 1.6 }}>{msg}</div>
                  </div>
                );
              }
              if (activeParsed && currentDoc.id === "cv" && reconstructedCv) {
                return (
                  <div style={{ flex: 1, overflow: "auto", padding: "28px 34px", background: "var(--rc-surface-raised)", scrollbarWidth: "thin" as const }}>
                    <ParsedCvView text={reconstructedCv} />
                    <div style={{ marginTop: 26, paddingTop: 16, borderTop: "1px solid var(--rc-border)" }}>
                      <Mono style={{ fontSize: 10, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Parsed from your uploaded document</Mono>
                    </div>
                  </div>
                );
              }
              if (currentDoc.blobUrl) {
                return <iframe src={currentDoc.blobUrl} className="flex-1 border-0 w-full" title={`${currentDoc.label} preview`} style={{ minWidth: 519 }} />;
              }
              return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "0 40px", textAlign: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--rc-border)" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-hint)", lineHeight: 1.6 }}>{currentDoc.missingMsg}</div>
                </div>
              );
            })()}
          </>
        ) : (
          /* Collapsed strip */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 12 }}>
            <button
              onClick={() => setCvPanelOpen(true)}
              title="Expand panel"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: R_SM, border: "1px solid var(--rc-border)", background: "var(--rc-bg)", cursor: "pointer", color: "var(--rc-hint)" }}
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 2l5 4.5L5 11"/></svg>
            </button>
            <div style={{ writingMode: "vertical-rl", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-hint)", transform: "rotate(180deg)", marginTop: 6 }}>
              Docs
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {renderRight({ focusedIssueId, onHighlightClick: (id) => setFocusedIssueId(id) })}
      </div>

    </div>
  );
}
