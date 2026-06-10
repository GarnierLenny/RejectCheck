"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../context/language";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DocTab = "cv" | "cover" | "linkedin";

export type HighlightEntry = { term: string; tooltip?: string };

export type HighlightMap = {
  flags:   HighlightEntry[];  // red    — ambiguous ownership ("participated in")
  issues:  HighlightEntry[];  // amber  — audit issues / weak positioning
  skills:  HighlightEntry[];  // green  — matched job-description skills
  weak:    HighlightEntry[];  // purple — passive / weak language phrases
  metrics: HighlightEntry[];  // blue   — quantified achievements (positive)
};

export type AnalysisShellRenderProps = {
  focusedIssueId: string | null;
  onHighlightClick: (id: string) => void;
  /** Switch left panel to a doc tab and optionally enable parsed mode. */
  focusDoc: (tab: DocTab, enableParsed?: boolean) => void;
};

export type AnalysisShellProps = {
  cvBlobUrl: string | null;
  liBlobUrl?: string | null;
  mlBlobUrl?: string | null;
  reconstructedCv?: string | null;
  liText?: string | null;
  coverLetterText?: string | null;
  highlights?: HighlightMap;
  /** Per-document highlights — takes precedence over `highlights` for each tab. */
  highlightsByDoc?: Partial<Record<DocTab, HighlightMap>>;
  onHighlightTypeClick?: (type: keyof HighlightMap) => void;
  renderRight: (props: AnalysisShellRenderProps) => React.ReactNode;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const R_SM = "4px";
const R_MD = "8px";
const SHADOW_XS = "0 1px 3px rgba(0,0,0,0.10)";

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

const CV_SECTION_HEADERS =
  /\b(PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EDUCATION|TECHNICAL SKILLS|SKILLS|PROFILE|SUMMARY|PROJECTS?|CERTIFICATIONS?|LANGUAGES?|INTERESTS?|EXPÉRIENCE|FORMATION|COMPÉTENCES|PROFIL|PROJETS?)\b/g;

function normalizeCvLines(raw: string): string[] {
  const byNewline = raw.split(/\r?\n/);
  if (byNewline.filter((l) => l.trim().length > 0).length >= 6) return byNewline;

  // Flat text: inject newlines at section boundaries and other common splits
  const rebroken = raw
    .replace(CV_SECTION_HEADERS, "\n$1")
    // Break before dates like "05/2025", "Jan 2024", "2023 –"
    .replace(/([a-zà-ÿ.),])\s+((?:\d{2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Janv|Févr|Mars|Avr|Juin|Juil|Août|Sept|Oct|Nov|Déc)[a-z]*\.?\s+\d{4}|\d{4}\s*[–-]))/g, "$1\n$2")
    // Break before bullet markers embedded mid-text
    .replace(/([a-zà-ÿ.,])\s+(•|·|\*)\s/g, "$1\n$2 ")
    // Break before each new sentence that starts with a capital after a period
    .replace(/\.\s+([A-Z][a-z])/g, ".\n$1");

  return rebroken.split("\n");
}

// ── Highlight helpers ─────────────────────────────────────────────────────────

// Normalize curly/typographic apostrophes to straight apostrophe for matching.
// Claude often returns U+0027 while PDF-parsed text may have U+2018/U+2019/U+02BC.
const normApos = (s: string) => s.replace(/[''ʼ]/g, "'");

type HType = keyof HighlightMap;

type HStyle = {
  lineStyle: "solid" | "dashed" | "dotted" | "wavy";
  thickness: string;
  offset: string;
  dot: string;
  label: string;
};

const H: Record<HType, HStyle> = {
  flags:   { lineStyle: "solid",  thickness: "2px",   offset: "3px", dot: "var(--rc-red)",   label: "Ownership gap" },
  issues:  { lineStyle: "wavy",   thickness: "1.5px", offset: "4px", dot: "var(--rc-amber)", label: "Issue" },
  skills:  { lineStyle: "dotted", thickness: "2px",   offset: "3px", dot: "var(--rc-green)", label: "Skill match" },
  weak:    { lineStyle: "dashed", thickness: "1.5px", offset: "3px", dot: "#8b5cf6",         label: "Weak language" },
  metrics: { lineStyle: "solid",  thickness: "1.5px", offset: "3px", dot: "#0284c7",         label: "Quantified impact" },
};

const H_PRIORITY: HType[] = ["flags", "issues", "metrics", "skills", "weak"];

function buildEntries(highlights: HighlightMap) {
  return H_PRIORITY
    .flatMap(type => highlights[type].map(e => ({ term: e.term, type, tooltip: e.tooltip })))
    .sort((a, b) => b.term.length - a.term.length || H_PRIORITY.indexOf(a.type) - H_PRIORITY.indexOf(b.type));
}

function hitType(trimmedLower: string, highlights: HighlightMap): HType | null {
  const norm = normApos(trimmedLower);
  for (const type of H_PRIORITY) {
    if (highlights[type].some(e => norm.includes(normApos(e.term.toLowerCase())))) return type;
  }
  return null;
}

function HighlightMark({ children, htype, tooltip, onClick }: { children: React.ReactNode; htype: HType; tooltip?: string; onClick?: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const c = H[htype];

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTipPos({
      x: Math.max(8, Math.min(rect.left, window.innerWidth - 272)),
      y: rect.top,
    });
    setHovered(true);
  };

  return (
    <span style={{ position: "relative", display: "inline" }}>
      <mark
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        style={{
          background: hovered
            ? `color-mix(in srgb, ${c.dot} 22%, transparent)`
            : `color-mix(in srgb, ${c.dot} 10%, transparent)`,
          color: "inherit",
          borderRadius: 3,
          padding: "1px 3px",
          textDecoration: "underline",
          textDecorationStyle: c.lineStyle,
          textDecorationColor: c.dot,
          textDecorationThickness: c.thickness,
          textUnderlineOffset: c.offset,
          cursor: onClick ? "pointer" : "text",
          transition: "background 0.15s ease",
        }}
      >
        {children}
      </mark>
      {tooltip && (
        <span style={{ position: "fixed", left: tipPos.x, top: tipPos.y, transform: hovered ? "translateY(calc(-100% - 8px))" : "translateY(calc(-100% - 3px))", opacity: hovered ? 1 : 0, zIndex: 1000, pointerEvents: "none", width: "max-content", maxWidth: 260, transition: "opacity 0.15s ease, transform 0.15s ease" }}>
          <span style={{ display: "block", background: "var(--rc-surface)", border: `1px solid var(--rc-border)`, borderLeft: `3px solid ${c.dot}`, borderRadius: 6, padding: "7px 10px", fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.55, color: "var(--rc-muted)", boxShadow: "0 4px 14px rgba(0,0,0,0.10)", whiteSpace: "normal", wordBreak: "break-word" }}>
            {tooltip}
          </span>
        </span>
      )}
    </span>
  );
}

function highlightLine(
  text: string,
  highlights: HighlightMap,
  entries: ReturnType<typeof buildEntries>,
  onTermClick?: (type: HType) => void,
): React.ReactNode {
  if (!entries.length) return text;
  const escaped = entries.map(e =>
    normApos(e.term)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")  // escape regex specials first
      .replace(/'/g, "[''ʼ]")                    // then make apostrophes flexible
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return p ? <span key={i}>{p}</span> : null;
        const pl = normApos(p.toLowerCase());
        const entry = entries.find(e => normApos(e.term.toLowerCase()) === pl) ?? entries.find(e => pl.includes(normApos(e.term.toLowerCase())));
        if (!entry) return <span key={i}>{p}</span>;
        return (
          <HighlightMark
            key={i}
            htype={entry.type}
            tooltip={entry.tooltip}
            onClick={onTermClick ? (e) => { e.stopPropagation(); onTermClick(entry.type); } : undefined}
          >
            {p}
          </HighlightMark>
        );
      })}
    </>
  );
}

// ── ParsedCvView ──────────────────────────────────────────────────────────────

const EMPTY_HIGHLIGHTS: HighlightMap = { flags: [], issues: [], skills: [], weak: [], metrics: [] };

function ParsedCvView({ text, highlights = EMPTY_HIGHLIGHTS, onTermClick }: { text: string; highlights?: HighlightMap; onTermClick?: (type: HType) => void }) {
  const entries = buildEntries(highlights);
  const hasAny = entries.length > 0;
  const lines = normalizeCvLines(text);
  let first = true;
  return (
    <div>

      {/* Legend chips */}
      {hasAny && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {H_PRIORITY.filter(k => highlights[k].length > 0).map(k => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 9px 3px 8px", borderRadius: 20, background: "transparent" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, lineHeight: 1, textDecoration: "underline", textDecorationStyle: H[k].lineStyle, textDecorationColor: H[k].dot, textDecorationThickness: H[k].thickness, textUnderlineOffset: H[k].offset, color: H[k].dot }}>Aa</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--rc-hint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{H[k].label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Paper card */}
      <div style={{ background: "var(--rc-bg)", borderRadius: 8, border: "1px solid var(--rc-border)", padding: "32px 36px", boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, lineHeight: 1.8, color: "var(--rc-text)" }}>
          {lines.map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} style={{ height: 10 }} />;
            const tl = trimmed.toLowerCase();
            const ht = hitType(tl, highlights);
            const hitBlock: React.CSSProperties = ht
              ? { borderLeft: `2px solid ${H[ht].dot}60`, paddingLeft: 10, paddingTop: 1, paddingBottom: 1 }
              : {};
            if (first && i < 5 && trimmed.length <= 70) {
              if (i === 0) { first = false; return <div key={i} style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 4, ...hitBlock }}>{highlightLine(trimmed, highlights, entries, onTermClick)}</div>; }
              return <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--rc-hint)", marginBottom: i === 1 ? 24 : 4, ...hitBlock }}>{highlightLine(trimmed, highlights, entries, onTermClick)}</div>;
            }
            if (first && trimmed.length > 70) first = false;
            if (SECTION_RE.test(trimmed)) {
              return (
                <div key={i} style={{ marginTop: 28, marginBottom: 10 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--rc-hint)", paddingBottom: 7, borderBottom: "1.5px solid var(--rc-border)" }}>
                    {trimmed.replace(/:$/, "")}
                  </div>
                </div>
              );
            }
            if (ROLE_LINE_RE.test(trimmed)) {
              return <div key={i} style={{ fontSize: 14.5, fontWeight: 600, marginTop: 16, marginBottom: 2, ...hitBlock }}>{highlightLine(trimmed, highlights, entries, onTermClick)}</div>;
            }
            if (/^\d{4}/.test(trimmed) || /^[A-Za-z]+\s\d{4}/.test(trimmed)) {
              return <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rc-hint)", marginBottom: 8, ...hitBlock }}>{highlightLine(trimmed, highlights, entries, onTermClick)}</div>;
            }
            if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("·")) {
              return (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, ...hitBlock }}>
                  <span style={{ color: ht ? H[ht].dot : "var(--rc-border)", flexShrink: 0, marginTop: 6, fontSize: 8, lineHeight: 1 }}>▸</span>
                  <span style={{ color: "var(--rc-muted)" }}>{highlightLine(trimmed.replace(/^[•\-·]\s*/, ""), highlights, entries, onTermClick)}</span>
                </div>
              );
            }
            return <div key={i} style={{ marginBottom: 5, color: "var(--rc-muted)", ...hitBlock }}>{highlightLine(trimmed, highlights, entries, onTermClick)}</div>;
          })}
        </div>
      </div>

      <div style={{ marginTop: 14, textAlign: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--rc-border)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Parsed from uploaded document</span>
      </div>
    </div>
  );
}

// ── AnalysisShell ─────────────────────────────────────────────────────────────

export function AnalysisShell({
  cvBlobUrl,
  liBlobUrl = null,
  mlBlobUrl = null,
  reconstructedCv,
  liText = null,
  coverLetterText = null,
  highlights = EMPTY_HIGHLIGHTS,
  highlightsByDoc,
  onHighlightTypeClick,
  renderRight,
}: AnalysisShellProps) {
  const { t } = useLanguage();
  const [cvPanelOpen, setCvPanelOpen] = useState(true);
  const [docTab, setDocTab] = useState<DocTab>("cv");
  const [parsedMode, setParsedMode] = useState(!!(reconstructedCv || liText || coverLetterText));
  useEffect(() => {
    if (reconstructedCv || liText || coverLetterText) setParsedMode(true);
  }, [reconstructedCv, liText, coverLetterText]);
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);

  const allDocs: { id: DocTab; label: string; blobUrl: string | null; missingMsg: string }[] = [
    { id: "cv",       label: t.analysisShell.labelCv,      blobUrl: cvBlobUrl,  missingMsg: t.analysisShell.missingCv },
    { id: "cover",    label: t.analysisShell.labelCover,   blobUrl: mlBlobUrl,  missingMsg: t.analysisShell.missingCover },
    { id: "linkedin", label: t.analysisShell.labelLinkedin, blobUrl: liBlobUrl, missingMsg: t.analysisShell.missingLinkedin },
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
                <Eyebrow>{t.analysisShell.sourceDocument}</Eyebrow>
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
                <div style={{ display: "inline-flex", gap: 3, padding: 3, background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, flexShrink: 0 }}>
                  {allDocs.map((d) => {
                    const active = d.id === docTab;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDocTab(d.id)}
                        style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "7px 14px", borderRadius: R_SM, cursor: "pointer", color: active ? "var(--rc-surface)" : d.blobUrl ? "var(--rc-hint)" : "var(--rc-border)", background: active ? "var(--rc-text)" : "transparent", border: "1px solid transparent", boxShadow: active ? SHADOW_XS : "none" }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: activeParsed ? "var(--rc-hint)" : "var(--rc-text)" }}>{t.analysisShell.raw}</span>
                  <div
                    onClick={() => setParsedMode((v) => !v)}
                    style={{ width: 42, height: 22, borderRadius: 99, background: activeParsed ? "var(--rc-text)" : "var(--rc-border)", position: "relative", cursor: "pointer", transition: "background 0.15s" }}
                  >
                    <div style={{ position: "absolute", top: 2, left: activeParsed ? 22 : 2, width: 18, height: 18, borderRadius: 99, background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.18)" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: activeParsed ? "var(--rc-text)" : "var(--rc-hint)" }}>{t.analysisShell.parsed}</span>
                </div>
              </div>
            </div>

            {/* Panel content */}
            {(() => {
              const parsedText =
                currentDoc.id === "cv" ? (reconstructedCv ?? null) :
                currentDoc.id === "linkedin" ? (liText ?? null) :
                currentDoc.id === "cover" ? (coverLetterText ?? null) : null;

              if (activeParsed && parsedText) {
                const activeHighlights = highlightsByDoc?.[currentDoc.id] ?? highlights;
                return (
                  <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "var(--rc-surface-raised)", scrollbarWidth: "thin" as const }}>
                    <ParsedCvView
                      text={parsedText}
                      highlights={activeHighlights}
                      onTermClick={currentDoc.id === "cv" ? onHighlightTypeClick : undefined}
                    />
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
        {renderRight({
          focusedIssueId,
          onHighlightClick: (id) => setFocusedIssueId(id),
          focusDoc: (tab, enableParsed) => {
            setDocTab(tab);
            if (enableParsed) setParsedMode(true);
          },
        })}
      </div>

    </div>
  );
}
