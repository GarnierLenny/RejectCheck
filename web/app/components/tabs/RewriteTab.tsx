"use client";

import { useState } from "react";
import { Download, CheckCircle2, Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import type { AnalysisResult } from "../types";
import { CvPdfPreview } from "../CvPdfPreview";
import { SectionBand } from "../SectionBand";
import { useGenerateCoverLetter } from "../../../lib/mutations";
import { generateCvPdf, generateCoverLetterPdf } from "../../utils/export";
import { useLanguage } from "../../../context/language";

// ── Constants ─────────────────────────────────────────────────────────────────

const R_SM = "4px";
const R_MD  = "8px";
const R_FULL = "9999px";
const SHADOW_XS = "0 1px 2px rgba(0,0,0,0.06)";
const SHADOW_SM = "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";

// ── Primitives ─────────────────────────────────────────────────────────────────

function Eyebrow({ children, color, style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: color ?? "var(--rc-hint)", ...style }}>
      {children}
    </span>
  );
}

function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", ...style }}>{children}</span>;
}

// ── SVG icons (from design) ────────────────────────────────────────────────────

const IcBolt   = (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13.5H11l-1 8.5L18.5 10H12l1-8z"/></svg>;
const IcScan   = (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5a1 1 0 011-1h2M20 7V5a1 1 0 00-1-1h-2M4 17v2a1 1 0 001 1h2M20 17v2a1 1 0 01-1 1h-2"/><circle cx="12" cy="12" r="3.2"/></svg>;
const IcTrend  = (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7"/><path d="M17 8h4v4"/></svg>;
const IcDoc    = (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4M9 13l2 2 4-4"/></svg>;
const IcWand   = (c: string) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 10V8M11.5 6.5h-2M20.5 6.5h-2M4 20l9-9M17 7l2 2"/></svg>;
const IcMail   = (c: string) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
const IcShield = (c: string) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>;

// ── CTA button ─────────────────────────────────────────────────────────────────

function CTA({ icon, children, onClick, kind = "primary", disabled }: { icon: React.ReactNode; children: React.ReactNode; onClick?: () => void; kind?: "primary" | "ghost"; disabled?: boolean }) {
  const primary = kind === "primary";
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "13px 22px", borderRadius: R_MD, color: primary ? "#fff" : "var(--rc-text)", background: primary ? "var(--rc-red)" : "var(--rc-surface)", border: `1px solid ${primary ? "var(--rc-red)" : "var(--rc-border)"}`, boxShadow: primary ? SHADOW_SM : SHADOW_XS, opacity: disabled ? 0.5 : 1 }}>
      {icon}{children}
    </button>
  );
}

// ── Before → after diff row ────────────────────────────────────────────────────

function DiffRow({ tag, color, before, after, last, wasLabel, nowLabel }: { tag: string; color: string; before: string; after: string; last?: boolean; wasLabel: string; nowLabel: string }) {
  return (
    <div style={{ padding: "22px 26px", borderBottom: last ? "none" : "1px solid var(--rc-border)" }}>
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 9px", borderRadius: R_FULL, color, background: `color-mix(in srgb, ${color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 26%, transparent)` }}>{tag}</span>
      </div>
      <div style={{ display: "flex", gap: 13, alignItems: "baseline", marginBottom: 12 }}>
        <Mono style={{ fontSize: 9, fontWeight: 700, color: "var(--rc-hint)", textTransform: "uppercase", letterSpacing: "0.1em", width: 40, flexShrink: 0, paddingTop: 2 }}>{wasLabel}</Mono>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--rc-hint)", lineHeight: 1.55, textDecoration: "line-through", textDecorationColor: "color-mix(in srgb, var(--rc-red) 50%, transparent)" }}>{before}</span>
      </div>
      <div style={{ display: "flex", gap: 13, alignItems: "baseline" }}>
        <Mono style={{ fontSize: 9, fontWeight: 700, color: "var(--rc-green)", textTransform: "uppercase", letterSpacing: "0.1em", width: 40, flexShrink: 0, paddingTop: 2 }}>{nowLabel}</Mono>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "var(--rc-text)", lineHeight: 1.55 }}>{after}</span>
      </div>
    </div>
  );
}

// ── Change stat card ───────────────────────────────────────────────────────────

function ChangeStat({ icon, n, label, desc, color }: { icon: (c: string) => React.ReactNode; n: number; label: string; desc: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: "18px 20px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, boxShadow: SHADOW_XS }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: R_SM, background: `color-mix(in srgb, ${color} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon(color)}</span>
        <Mono style={{ fontSize: 30, fontWeight: 700, color: "var(--rc-text)", lineHeight: 1 }}>{n}</Mono>
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--rc-text)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--rc-muted)", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

// ── Inline option toggle (angle / language pickers) ────────────────────────────

function InlineToggle<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--rc-border)", borderRadius: R_SM, overflow: "hidden", background: "var(--rc-bg)" }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: on ? 600 : 500, padding: "8px 14px", cursor: "pointer", border: "none", background: on ? "var(--rc-surface)" : "transparent", color: on ? "var(--rc-text)" : "var(--rc-hint)", boxShadow: on ? SHADOW_XS : "none" }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Ghost action button ────────────────────────────────────────────────────────

const ghostStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "7px 12px", border: "1px solid var(--rc-border)", borderRadius: R_SM, cursor: "pointer", background: "var(--rc-surface)", color: "var(--rc-hint)" };

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  sectionTag: string;
  result: AnalysisResult;
  reconstructedCv: string | null;
  isRewriting: boolean;
  onRewrite: () => void;
  analysisId: number | null;
};

// ── Main ──────────────────────────────────────────────────────────────────────

export function RewriteTab({ sectionTag, result, reconstructedCv, isRewriting, onRewrite, analysisId }: Props) {
  const { t } = useLanguage();
  const [angle, setAngle]   = useState<"jd" | "exp" | "tech">("jd");
  const [lang, setLang]     = useState<"auto" | "en" | "fr">("auto");
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingCv, setIsExportingCv]   = useState(false);
  const [isExportingCl, setIsExportingCl]   = useState(false);

  const { mutate: generateLetter, isPending: isGenerating, isError: isGenError } = useGenerateCoverLetter();

  const tone = result.cv_tone;
  const sen  = result.seniority_analysis;
  const ats  = result.ats_simulation;
  const reqMissing = ats?.critical_missing_keywords?.filter((k) => k.required) ?? [];

  // Before/after pairs — only cv_tone examples/rewrites are actual bullet text
  const diffPairs = (tone.rewrites && tone.rewrites.length > 0)
    ? tone.examples.map((before, i) => ({
        tag: i < 2 ? t.rewriteTab.cv.tagPassive : t.rewriteTab.cv.tagQuantified,
        color: i < 2 ? "var(--rc-red)" : "var(--rc-amber)",
        before,
        after: tone.rewrites![i],
      })).filter((_, i) => !!tone.rewrites![i]).slice(0, 4)
    : [];

  const matchedSkills = result.audit.jd_match?.required_skills.filter((s) => s.found) ?? [];

  const angles = [
    { id: "jd"   as const, label: t.rewriteTab.coverLetter.angleJd },
    { id: "exp"  as const, label: t.rewriteTab.coverLetter.angleExp },
    { id: "tech" as const, label: t.rewriteTab.coverLetter.angleTech },
  ];
  const langs = [
    { id: "auto" as const, label: t.rewriteTab.coverLetter.langAuto },
    { id: "en"   as const, label: t.rewriteTab.coverLetter.langEn },
    { id: "fr"   as const, label: t.rewriteTab.coverLetter.langFr },
  ];

  function handleGenerate() {
    if (!analysisId) return;
    generateLetter({ analysisId, language: lang }, { onSuccess: (data) => setCoverLetter(data.coverLetter) });
  }

  async function handleCopy() {
    if (!coverLetter) return;
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56, padding: "28px 30px" }}>

      {/* ══ CV REWRITE ════════════════════════════════════════════════════════ */}
      <section>
        {/* Header */}
        <SectionBand
          className="mb-8"
          tag={sectionTag}
          title={<>{t.rewriteTab.cv.title} <span style={{ fontWeight: 700 }}>{t.rewriteTab.cv.titleItalic}</span></>}
          subtitle={t.rewriteTab.cv.subtitle}
        />

        {/* Change stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <ChangeStat icon={IcBolt}  color="var(--rc-red)"   n={tone.examples?.length ?? 0}      label={t.rewriteTab.cv.statPassiveLabel}   desc={t.rewriteTab.cv.statPassiveDesc} />
          <ChangeStat icon={IcScan}  color="#0D9488"          n={reqMissing.length}               label={t.rewriteTab.cv.statAtsLabel}      desc={t.rewriteTab.cv.statAtsDesc} />
          <ChangeStat icon={IcTrend} color="var(--rc-amber)"  n={sen.fix?.steps?.length ?? 1}    label={t.rewriteTab.cv.statSeniorityLabel} desc={t.rewriteTab.cv.statSeniorityDesc} />
          <ChangeStat icon={IcDoc}   color="var(--rc-green)"  n={result.audit.cv.issues.length}  label={t.rewriteTab.cv.statAuditLabel}    desc={t.rewriteTab.cv.statAuditDesc} />
        </div>

        {/* Before → after preview */}
        {diffPairs.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ marginBottom: 14 }}>
              <Eyebrow style={{ display: "block", marginBottom: 6 }}>{t.rewriteTab.cv.previewEyebrow}</Eyebrow>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "var(--rc-text)", letterSpacing: "-0.01em", marginBottom: 4 }}>{t.rewriteTab.cv.previewTitle}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-muted)" }}>{t.rewriteTab.cv.previewSubtitle}</div>
            </div>
            <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, overflow: "hidden" }}>
              {diffPairs.map((d, i) => <DiffRow key={i} {...d} last={i === diffPairs.length - 1} wasLabel={t.rewriteTab.cv.was} nowLabel={t.rewriteTab.cv.now} />)}
            </div>
          </div>
        )}

        {/* ATS keywords injection */}
        {reqMissing.length > 0 && (
          <div style={{ marginBottom: 20, padding: "20px 24px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, boxShadow: SHADOW_XS }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
              <span style={{ display: "flex" }}>{IcScan("#0D9488")}</span>
              <Eyebrow color="#0D9488">{t.rewriteTab.cv.keywordsEyebrow}</Eyebrow>
              <Mono style={{ fontSize: 11, color: "var(--rc-hint)" }}>{t.rewriteTab.cv.keywordsNote}</Mono>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {reqMissing.map((k) => (
                <span key={k.keyword} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 12, padding: "6px 11px", borderRadius: R_FULL, color: "var(--rc-text)", background: "color-mix(in srgb, #0D9488 7%, transparent)", border: "1px solid color-mix(in srgb, #0D9488 28%, transparent)" }}>
                  <span style={{ fontWeight: 700 }}>{k.keyword}</span>
                  <span style={{ color: "var(--rc-hint)", fontSize: 10 }}>→ {k.sections_missing.join(" · ")}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CV ready state */}
        {reconstructedCv ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} style={{ color: "var(--rc-green)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--rc-text)" }}>{t.rewriteTab.cv.readyLabel}</span>
              </div>
              <button onClick={onRewrite} style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {t.rewriteTab.cv.regenerate}
              </button>
            </div>
            <CvPdfPreview cvText={reconstructedCv} />
            <button
              onClick={async () => { setIsExportingCv(true); try { await generateCvPdf(reconstructedCv, "cv-rewritten.pdf"); } finally { setIsExportingCv(false); } }}
              disabled={isExportingCv}
              style={{ display: "inline-flex", alignItems: "center", gap: 10, alignSelf: "flex-start", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "13px 22px", borderRadius: R_MD, color: "#fff", background: "var(--rc-red)", border: "1px solid var(--rc-red)", boxShadow: SHADOW_SM, cursor: isExportingCv ? "wait" : "pointer", opacity: isExportingCv ? 0.6 : 1 }}
            >
              <Download size={14} />
              {isExportingCv ? t.rewriteTab.cv.exporting : t.rewriteTab.cv.download}
            </button>
          </div>
        ) : (
          /* Trust copy + CTA */
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11, maxWidth: 560 }}>
              <span style={{ flexShrink: 0, paddingTop: 1 }}>{IcShield("var(--rc-green)")}</span>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--rc-muted)", lineHeight: 1.6 }}>
                <span style={{ color: "var(--rc-text)", fontWeight: 600 }}>{t.rewriteTab.cv.trustBold}</span> {t.rewriteTab.cv.trustDesc}
              </div>
            </div>
            {isRewriting
              ? <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "13px 22px", color: "var(--rc-hint)" }}><Loader2 size={14} className="animate-spin" /> {t.rewriteTab.cv.rewriting}</div>
              : <CTA icon={IcWand("#fff")} onClick={onRewrite}>{!analysisId ? t.rewriteTab.cv.signInCta : t.rewriteTab.cv.rewriteCta}</CTA>
            }
          </div>
        )}
      </section>

      {/* ══ COVER LETTER ═════════════════════════════════════════════════════ */}
      <section>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <Eyebrow color="var(--rc-red)" style={{ display: "block", marginBottom: 12, letterSpacing: "0.16em" }}>{t.rewriteTab.coverLetter.eyebrow}</Eyebrow>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--rc-text)", lineHeight: 1.1 }}>
            {t.rewriteTab.coverLetter.title} <span style={{ fontWeight: 700, color: "var(--rc-red)" }}>{t.rewriteTab.coverLetter.titleItalic}</span>
          </h2>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--rc-muted)", lineHeight: 1.6, marginTop: 12, maxWidth: 560 }}>
            {t.rewriteTab.coverLetter.subtitle}
          </div>
        </div>

        <div style={{ background: "var(--rc-surface)", border: "1px solid var(--rc-border)", borderRadius: R_MD, boxShadow: SHADOW_XS, overflow: "hidden" }}>

          {/* Matched skills */}
          {matchedSkills.length > 0 && (
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--rc-border)" }}>
              <Eyebrow color="var(--rc-green)" style={{ display: "block", marginBottom: 12 }}>{t.rewriteTab.coverLetter.requirementsTitle}</Eyebrow>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {matchedSkills.map((s) => (
                  <span key={s.skill} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-mono)", fontSize: 11.5, padding: "5px 11px", borderRadius: R_FULL, color: "var(--rc-green)", background: "var(--rc-green-bg)", border: "1px solid var(--rc-green-border)" }}>
                    <span style={{ fontWeight: 700 }}>✓</span>{s.skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Controls + generate CTA */}
          {!coverLetter && (
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                <div>
                  <Eyebrow style={{ display: "block", marginBottom: 9 }}>{t.rewriteTab.coverLetter.angleLabel}</Eyebrow>
                  <InlineToggle value={angle} options={angles} onChange={setAngle} />
                </div>
                <div>
                  <Eyebrow style={{ display: "block", marginBottom: 9 }}>{t.rewriteTab.coverLetter.languageLabel}</Eyebrow>
                  <InlineToggle value={lang} options={langs} onChange={setLang} />
                </div>
              </div>
              <CTA icon={isGenerating ? <Loader2 size={14} className="animate-spin" /> : IcMail("#fff")} onClick={handleGenerate} disabled={!analysisId || isGenerating}>
                {isGenerating ? t.rewriteTab.coverLetter.generating : t.rewriteTab.coverLetter.generate}
              </CTA>
            </div>
          )}

          {isGenError && (
            <div style={{ padding: "12px 24px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--rc-red)" }}>
              {t.rewriteTab.coverLetter.error}
            </div>
          )}

          {/* Generated letter */}
          {coverLetter && (
            <div style={{ padding: "28px 32px" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--rc-text)", lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 20 }}>
                {coverLetter}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 16, borderTop: "1px solid var(--rc-border)" }}>
                <button onClick={handleCopy} style={ghostStyle}>
                  {copied ? <><Check size={12} style={{ color: "var(--rc-green)" }} />{t.rewriteTab.coverLetter.copied}</> : <><Copy size={12} />{t.rewriteTab.coverLetter.copy}</>}
                </button>
                <button onClick={async () => { setIsExportingCl(true); try { await generateCoverLetterPdf(coverLetter, "cover-letter.pdf"); } finally { setIsExportingCl(false); } }} disabled={isExportingCl} style={{ ...ghostStyle, opacity: isExportingCl ? 0.5 : 1, cursor: isExportingCl ? "wait" : "pointer" }}>
                  <Download size={12} />{isExportingCl ? t.rewriteTab.coverLetter.exporting : t.rewriteTab.coverLetter.exportPdf}
                </button>
                <button onClick={handleGenerate} disabled={isGenerating} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--rc-hint)", background: "none", border: "none", cursor: isGenerating ? "wait" : "pointer", marginLeft: "auto", padding: 0 }}>
                  <RefreshCw size={12} />{isGenerating ? t.rewriteTab.coverLetter.regenerating : t.rewriteTab.coverLetter.regenerate}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
