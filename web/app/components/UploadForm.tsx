"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Tooltip } from "./Tooltip";
import Link from "next/link";
import { useLanguage } from "../../context/language";
import { useAuth } from "../../context/auth";
import { useJdValidation, JD_MIN_CHARS, JD_MAX_CHARS } from "../hooks/useJdValidation";
import type { JdWarningKey } from "../hooks/useJdValidation";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { URL_PRESETS, type UrlField } from "../../lib/onboarding-data";
import { useQuota, type RoleType } from "../../lib/queries";

type IntakeMode = "compare" | "audit" | "vet";

type Props = {
  cvFile: File | null;
  setCvFile: (f: File | null) => void;
  liFile: File | null;
  setLiFile: (f: File | null) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  githubUsername: string;
  setGithubUsername: (v: string) => void;
  portfolioUrl: string;
  setPortfolioUrl: (v: string) => void;
  mlFile: File | null;
  setMlFile: (f: File | null) => void;
  mlText: string;
  setMlText: (v: string) => void;
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading: boolean;
  error: string | null;
  savedCvFiles?: Array<{ id: number; name: string; url: string }>;
  savedLinkedinUrl?: string;
  savedPortfolioUrl?: string;
  roleType?: RoleType | null;
  roleLabel?: string | null;
};

/* ── Icons ─────────────────────────────────────────────────────────────── */

function IconCV({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/>
    </svg>
  );
}

function IconJob({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14"/><path d="M5 12h14"/>
    </svg>
  );
}

function IconSwap() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5"/><path d="M21 3l-7 7"/>
      <path d="M8 21H3v-5"/><path d="M3 21l7-7"/>
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}

function IconCheck({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

/* ── Mode card ─────────────────────────────────────────────────────────── */

type ModeConfig = {
  eyebrow: string;
  headline: string;
  desc: string;
  needs: string;
  needsCv: boolean;
  needsJob: boolean;
  ctaLabel: string;
  showSignals: boolean;
  soon?: string;
};

function ModeCard({ m, cfg, active, onClick }: { m: IntakeMode; cfg: ModeConfig; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left bg-rc-surface border rounded-md p-[22px] cursor-pointer transition-all duration-150 flex flex-col min-h-[200px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 ${
        active
          ? "border-rc-red shadow-[0_0_0_1px_var(--color-rc-red),0_4px_16px_rgba(192,57,43,0.12)]"
          : "border-rc-border hover:border-[#b8b3ad] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-[38px] h-[38px] rounded flex items-center justify-center transition-all duration-150 ${active ? "bg-rc-red/10 text-rc-red" : "bg-rc-bg text-rc-muted"}`}>
          {m === "compare" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h6"/><path d="M14 2v6h6"/>
              <rect x="14" y="13" width="8" height="8" rx="1"/><path d="M18 13v-2"/>
            </svg>
          )}
          {m === "audit" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/><path d="M8 13h2.5"/><path d="M8 17h5"/>
              <circle cx="16" cy="15.5" r="3"/><path d="m20.5 20-1.8-1.8"/>
            </svg>
          )}
          {m === "vet" && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9.5 12l1.8 1.8 3.4-3.6"/>
            </svg>
          )}
        </div>
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150 ${active ? "bg-rc-red border-rc-red text-white" : "bg-rc-bg border-rc-border"}`}>
          {active && <IconCheck size={10} />}
        </div>
      </div>

      <div className={`font-mono text-[10px] tracking-[0.14em] uppercase mb-1.5 flex items-center gap-2 ${active ? "text-rc-red" : "text-rc-hint"}`}>
        {cfg.eyebrow}
        {cfg.soon && (
          <span className="text-[9px] tracking-[0.06em] text-rc-amber border border-rc-amber/40 px-1.5 py-0.5 rounded">{cfg.soon}</span>
        )}
      </div>
      <h2 className="font-sans font-semibold text-[15px] leading-[1.25] tracking-[-0.015em] text-rc-text mb-1.5">{cfg.headline}</h2>
      <p className="text-[12.5px] text-rc-muted leading-[1.5] flex-1 mb-4">{cfg.desc}</p>
      <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-rc-hint border-t border-rc-border pt-3">
        {cfg.needs}
      </div>
    </button>
  );
}

/* ── Slot label ────────────────────────────────────────────────────────── */

function SlotLabel({ icon, label, required, requiredText, optionalText }: {
  icon: React.ReactNode; label: string; required: boolean;
  requiredText: string; optionalText: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-rc-muted font-semibold flex items-center gap-2">
        {icon}{label}
      </span>
      {required
        ? <span className="font-mono text-[9px] font-bold tracking-[0.1em] uppercase text-rc-red border border-rc-red/30 bg-rc-red/5 px-1.5 py-0.5 rounded">{requiredText}</span>
        : <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-rc-hint border border-rc-border px-1.5 py-0.5 rounded">{optionalText}</span>
      }
    </div>
  );
}

/* ── Signal badge ──────────────────────────────────────────────────────── */

function SignalBadge({ recommended, recommendedText, optionalText }: {
  recommended: boolean; recommendedText: string; optionalText: string;
}) {
  return recommended
    ? <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-rc-red border border-rc-red/30 px-1.5 py-0.5 rounded">{recommendedText}</span>
    : <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-rc-hint border border-rc-border px-1.5 py-0.5 rounded">{optionalText}</span>;
}

/* ── Main component ─────────────────────────────────────────────────────── */

export function UploadForm({
  cvFile, setCvFile,
  liFile, setLiFile,
  jobDescription, setJobDescription,
  githubUsername, setGithubUsername,
  portfolioUrl, setPortfolioUrl,
  mlFile, setMlFile,
  mlText, setMlText,
  onSubmit, loading, error,
  savedCvFiles, savedLinkedinUrl, savedPortfolioUrl,
  roleType,
}: Props) {
  const { t, localePath } = useLanguage();
  const { user } = useAuth();
  const { data: quota } = useQuota();

  const i = t.uploadForm.intake;

  const MODES: Record<IntakeMode, ModeConfig> = {
    compare: {
      eyebrow: i.modes.compare.eyebrow,
      headline: i.modes.compare.headline,
      desc: i.modes.compare.desc,
      needs: i.modes.compare.needs,
      needsCv: true,
      needsJob: true,
      ctaLabel: t.uploadForm.submit.runAnalysis,
      showSignals: true,
    },
    audit: {
      eyebrow: i.modes.audit.eyebrow,
      headline: i.modes.audit.headline,
      desc: i.modes.audit.desc,
      needs: i.modes.audit.needs,
      needsCv: true,
      needsJob: false,
      ctaLabel: t.uploadForm.submit.runAnalysis,
      showSignals: true,
    },
    vet: {
      eyebrow: i.modes.vet.eyebrow,
      headline: i.modes.vet.headline,
      desc: i.modes.vet.desc,
      needs: i.modes.vet.needs,
      needsCv: false,
      needsJob: true,
      ctaLabel: i.actionBar.comingSoon,
      showSignals: false,
      soon: i.modes.vet.soon,
    },
  };

  const [mode, setMode] = useState<IntakeMode>("compare");
  const [suppressNudge, setSuppressNudge] = useState(false);
  const [cvAdded, setCvAdded] = useState(false);
  const [jobAdded, setJobAdded] = useState(false);
  const [mlMode, setMlMode] = useState<"file" | "text">("file");
  const [loadingCvId, setLoadingCvId] = useState<number | null>(null);
  const [loadingLi, setLoadingLi] = useState(false);
  const [pingStatus, setPingStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);
  const [previewLi, setPreviewLi] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const liRef = useRef<HTMLInputElement>(null);
  const mlRef = useRef<HTMLInputElement>(null);
  const portfolioHydrated = useRef(false);

  useEffect(() => {
    if (portfolioHydrated.current) return;
    if (savedPortfolioUrl && !portfolioUrl.trim()) setPortfolioUrl(savedPortfolioUrl);
    portfolioHydrated.current = true;
  }, [savedPortfolioUrl, portfolioUrl, setPortfolioUrl]);

  const hasCv = !!cvFile;
  const hasJob = jobDescription.trim().length > 0;
  const cfg = MODES[mode];

  const effectiveMode: IntakeMode | null = (() => {
    if (hasCv && hasJob) return "compare";
    if (hasCv && !hasJob) return "audit";
    if (!hasCv && hasJob) return "vet";
    return null;
  })();

  const showNudge = !suppressNudge && effectiveMode !== null && effectiveMode !== mode;
  const showCvSlot = cfg.needsCv || hasCv || cvAdded;
  const showJobSlot = cfg.needsJob || hasJob || jobAdded;

  const warningKey = useJdValidation(jobDescription);
  const warningText = warningKey
    ? (t.uploadForm.jobListing.warnings as Record<JdWarningKey, string>)[warningKey]
    : null;
  const jdLen = jobDescription.trim().length;
  const jdValid = jdLen === 0 || (jdLen >= JD_MIN_CHARS && jdLen <= JD_MAX_CHARS);

  const canRun = (() => {
    if (mode === "vet") return false;
    if (mode === "compare") return hasCv && hasJob && jdValid;
    if (mode === "audit") return hasCv;
    return false;
  })();

  const ctaLabel = (() => {
    if (mode === "vet") return i.actionBar.comingSoon;
    if (mode === "compare") {
      if (!hasCv && !hasJob) return `${i.ghost.addCv} + ${i.ghost.addJob}`;
      if (!hasCv) return i.ghost.addCv;
      if (!hasJob) return i.ghost.addJob;
    }
    if (mode === "audit" && !hasCv) return i.ghost.addCv;
    return cfg.ctaLabel;
  })();

  function selectMode(m: IntakeMode) {
    setMode(m);
    setCvAdded(false);
    setJobAdded(false);
    setSuppressNudge(true);
  }

  function switchToMode(m: IntakeMode) {
    setMode(m);
    setSuppressNudge(false);
  }

  const preset = URL_PRESETS[roleType ?? "software"];
  const isRecommended = (f: UrlField) => preset.recommended.includes(f);
  const quotaLeft = quota ? Math.max(0, quota.monthlyCap - quota.monthlyUsed) + quota.creditsBalance : null;

  const nudgeLabel = (m: IntakeMode) =>
    m === "compare" ? i.nudge.looksLikeCompare
    : m === "audit" ? i.nudge.looksLikeAudit
    : i.nudge.looksLikeVet;

  const nudgeReason = (m: IntakeMode) =>
    m === "audit" ? i.nudge.reasonAudit
    : m === "vet" ? i.nudge.reasonVet
    : i.nudge.reasonCompare;

  const switchLabel = (m: IntakeMode) =>
    i.nudge.switchTo.replace("{mode}", MODES[m].eyebrow);

  const requiredText = t.common.required;
  const optionalText = t.common.optional;

  return (
    <>
      {previewPdf && <PdfPreviewModal url={previewPdf.url} name={previewPdf.name} onClose={() => setPreviewPdf(null)} />}
      {previewLi && savedLinkedinUrl && <PdfPreviewModal url={savedLinkedinUrl} name="linkedin.pdf" onClose={() => setPreviewLi(false)} />}

      <div className="w-full flex-1 overflow-y-auto">
        <div className="max-w-[1120px] mx-auto px-8 py-12 pb-24">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="text-center flex flex-col items-center mb-10">
            <span className="inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red px-3 py-1.5 bg-rc-red/[0.07] border border-rc-red/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-rc-red animate-pulse" />
              {i.eyebrow}
            </span>
            <h1 className="mt-5 font-sans font-medium leading-[1.02] tracking-[-0.03em] text-rc-text" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
              {i.headline.split("?")[0]}
              <em style={{ fontFamily: "Georgia, serif" }} className="not-italic text-rc-red">?</em>
            </h1>
            <p className="mt-4 text-[16px] text-rc-muted leading-[1.55] max-w-[560px]">
              {i.lead}
            </p>
          </div>

          {/* ── Mode picker ────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3.5 mb-7">
            {(["compare", "audit", "vet"] as IntakeMode[]).map((m) => (
              <ModeCard key={m} m={m} cfg={MODES[m]} active={mode === m} onClick={() => selectMode(m)} />
            ))}
          </div>

          {/* ── Form area ──────────────────────────────────────────── */}
          <div className={mode === "vet" ? "hidden" : ""}>

            {/* Context bar */}
            <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-[var(--rc-surface-hero)] border border-rc-border rounded-r-md" style={{ borderLeft: "3px solid var(--color-rc-red)" }}>
              <span className="text-rc-red flex-shrink-0"><IconInfo /></span>
              <p className="text-[13.5px] text-rc-text leading-[1.5]">
                <strong className="font-semibold">{cfg.eyebrow}.</strong>{" "}
                {i.ctx[mode]}
              </p>
            </div>

            {/* Smart nudge */}
            {showNudge && effectiveMode && (
              <div className="flex items-center gap-3.5 mb-4 px-4 py-3 bg-[var(--rc-amber-bg)] border border-[var(--rc-amber-border)] rounded-r-md" style={{ borderLeft: "3px solid var(--color-rc-amber)" }}>
                <span className="text-rc-amber flex-shrink-0"><IconSwap /></span>
                <div className="flex-1 text-[13px] text-rc-text leading-[1.45]">
                  <strong className="font-semibold">{nudgeLabel(effectiveMode)}</strong>{" "}
                  <span className="text-rc-muted">{nudgeReason(effectiveMode)}</span>
                </div>
                {effectiveMode !== "vet" && (
                  <button
                    type="button"
                    onClick={() => switchToMode(effectiveMode)}
                    className="flex-shrink-0 font-mono text-[10px] font-bold tracking-[0.08em] uppercase whitespace-nowrap px-3 py-2 rounded bg-rc-amber text-white flex items-center gap-1.5 hover:brightness-110 transition-[filter]"
                  >
                    <IconSwap />
                    {switchLabel(effectiveMode)}
                  </button>
                )}
              </div>
            )}

            {/* Input slots */}
            <div className={`grid gap-[18px] ${showCvSlot && showJobSlot ? "grid-cols-2" : "grid-cols-1"}`}>

              {/* CV slot */}
              {showCvSlot && (
                <div>
                  <SlotLabel icon={<IconCV />} label={t.uploadForm.cv.label} required={cfg.needsCv} requiredText={requiredText} optionalText={optionalText} />
                  {!cvFile ? (
                    savedCvFiles && savedCvFiles.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {savedCvFiles.map((cv) => (
                          <div key={cv.id} className={`group flex items-center gap-3 px-3.5 py-3 bg-rc-red/[0.03] border border-rc-red/25 hover:border-rc-red/50 rounded transition-all ${loadingCvId === cv.id ? "opacity-60" : ""}`}>
                            <button
                              type="button"
                              disabled={loadingCvId === cv.id}
                              onClick={async () => {
                                setLoadingCvId(cv.id);
                                try { const blob = await fetch(cv.url).then((r) => r.blob()); setCvFile(new File([blob], cv.name, { type: "application/pdf" })); }
                                finally { setLoadingCvId(null); }
                              }}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                            >
                              <div className="w-8 h-8 rounded bg-rc-red/8 border border-rc-red/20 flex items-center justify-center shrink-0">
                                {loadingCvId === cv.id
                                  ? <span className="w-3.5 h-3.5 border-2 border-rc-red/60 border-t-transparent rounded-full animate-spin" />
                                  : <IconCV size={13} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-rc-text truncate">{cv.name}</p>
                                <p className="font-mono text-[9px] text-rc-hint mt-0.5">{i.slots.savedUse}</p>
                              </div>
                            </button>
                            <button type="button" onClick={() => setPreviewPdf({ url: cv.url, name: cv.name })} className="shrink-0 text-rc-hint/40 hover:text-rc-hint transition-colors p-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 py-2 rounded border border-dashed border-rc-border hover:border-rc-red/30 font-mono text-[9px] uppercase tracking-widest text-rc-hint hover:text-rc-red transition-all">
                          {i.slots.uploadDifferent}
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="group border border-dashed border-rc-border hover:border-rc-red bg-rc-surface hover:bg-rc-red/[0.025] rounded-md p-7 text-center cursor-pointer transition-all flex flex-col items-center gap-3"
                      >
                        <span className="text-rc-hint group-hover:text-rc-red transition-colors"><IconUpload /></span>
                        <p className="font-sans font-semibold text-[15px] text-rc-muted group-hover:text-rc-text transition-colors">
                          {i.slots.cvDropPrompt.split(" or ")[0]}
                          {" "}<em style={{ fontFamily: "Georgia, serif" }} className="text-rc-red font-normal">
                            {i.slots.cvDropPrompt.includes(" or ") ? `or ${i.slots.cvDropPrompt.split(" or ")[1]}` : ""}
                          </em>
                        </p>
                        <p className="font-mono text-[11px] text-rc-hint">{i.slots.cvFormat}</p>
                        {user && (
                          <p className="font-mono text-[9px] text-rc-hint/60 mt-1">
                            <Link href={localePath("/settings")} className="underline underline-offset-2 hover:text-rc-hint transition-colors">{i.slots.saveHint}</Link>
                          </p>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-3.5 px-4 py-3 bg-[var(--rc-surface-hero)] border border-rc-border rounded-md">
                      <div className="w-10 h-10 rounded bg-rc-surface border border-rc-border flex items-center justify-center shrink-0 text-rc-red">
                        <IconCV size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold text-[14px] text-rc-text truncate">{cvFile.name}</p>
                        <p className="font-mono text-[11px] text-rc-hint mt-0.5">{(cvFile.size / 1024).toFixed(0)} KB · PDF</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (fileRef.current) fileRef.current.value = ""; setCvFile(null); setSuppressNudge(false); }}
                        className="font-mono text-[18px] leading-none text-rc-hint hover:text-rc-red transition-colors p-1"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <input type="file" ref={fileRef} accept=".pdf" className="hidden" onChange={(e) => { setCvFile(e.target.files?.[0] || null); setSuppressNudge(false); }} />
                </div>
              )}

              {/* Job slot */}
              {showJobSlot && (
                <div>
                  <SlotLabel icon={<IconJob />} label={i.slots.jobLabel} required={cfg.needsJob} requiredText={requiredText} optionalText={optionalText} />
                  <div className="bg-rc-surface border border-rc-border focus-within:border-rc-red rounded-md overflow-hidden transition-colors">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => { setJobDescription(e.target.value); setSuppressNudge(false); }}
                      placeholder={i.slots.jobPlaceholder}
                      className="w-full bg-transparent border-0 outline-none resize-none px-4 py-3.5 text-[14px] text-rc-text leading-[1.55] placeholder:text-rc-hint"
                      style={{ minHeight: "104px" }}
                    />
                    <div className="px-4 py-2 border-t border-rc-border bg-rc-bg flex justify-between items-center font-mono text-[10px] tracking-[0.06em] text-rc-hint">
                      <span>
                        {warningText
                          ? <span className="text-rc-amber">{warningText}</span>
                          : <span className={jdLen > 0 && !jdValid ? "text-rc-amber" : ""}>{jdLen} / 5000</span>
                        }
                      </span>
                      <button type="button" className="text-rc-red hover:underline bg-transparent border-0 font-mono text-[10px] tracking-[0.06em]">
                        {i.slots.pasteUrl}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ghost buttons */}
            {(!showCvSlot || !showJobSlot) && (
              <div className="flex gap-2.5 mt-3.5">
                {!showCvSlot && (
                  <button
                    type="button"
                    onClick={() => { setCvAdded(true); setSuppressNudge(false); }}
                    className="flex-1 flex items-center justify-center gap-2.5 py-3 border border-dashed border-rc-border hover:border-rc-red hover:text-rc-red hover:bg-rc-red/[0.025] text-rc-muted rounded-md font-mono text-[11px] tracking-[0.06em] uppercase font-semibold transition-all"
                  >
                    <IconPlus />
                    {i.ghost.addCv}
                    <small className="font-sans text-[11px] text-rc-hint font-normal normal-case tracking-normal">· {i.ghost.addCvSub}</small>
                  </button>
                )}
                {!showJobSlot && (
                  <button
                    type="button"
                    onClick={() => { setJobAdded(true); setSuppressNudge(false); }}
                    className="flex-1 flex items-center justify-center gap-2.5 py-3 border border-dashed border-rc-border hover:border-rc-red hover:text-rc-red hover:bg-rc-red/[0.025] text-rc-muted rounded-md font-mono text-[11px] tracking-[0.06em] uppercase font-semibold transition-all"
                  >
                    <IconPlus />
                    {i.ghost.addJob}
                    <small className="font-sans text-[11px] text-rc-hint font-normal normal-case tracking-normal">· {i.ghost.addJobSub}</small>
                  </button>
                )}
              </div>
            )}

            {/* Signals */}
            {cfg.showSignals && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-[11px] tracking-[0.12em] uppercase text-rc-muted font-semibold">{i.signals.title}</h3>
                  <span className="font-mono text-[10px] text-rc-hint">{i.signals.subtitle}</span>
                </div>
                <div className={`grid gap-2.5 ${mode === "compare" ? "grid-cols-2" : "grid-cols-3"}`}>

                  {/* GitHub */}
                  <div className="border border-rc-border rounded-md overflow-hidden">
                    <div className="px-3 py-2.5 bg-rc-bg border-b border-rc-border flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center shrink-0">
                        <img src="/icons/github.svg" alt="GitHub" width="12" height="12" className="invert" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-medium text-rc-text">GitHub</div>
                        <p className="font-mono text-[9px] text-rc-hint">{i.signals.githubHint}</p>
                      </div>
                      <SignalBadge recommended={isRecommended("github")} recommendedText={t.uploadForm.pills.recommended} optionalText={optionalText} />
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-rc-hint pointer-events-none select-none">github.com/</span>
                        <input
                          type="text"
                          placeholder="username"
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value)}
                          className="w-full bg-rc-bg border border-rc-border rounded py-2 pr-3 pl-[74px] text-rc-text font-mono text-[11px] outline-none focus:border-rc-red/30 transition-colors placeholder:text-rc-hint/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="border border-rc-border rounded-md overflow-hidden">
                    <div className="px-3 py-2.5 bg-rc-bg border-b border-rc-border flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#0A66C2] flex items-center justify-center shrink-0">
                        <span className="font-mono text-[9px] font-bold text-white">in</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-medium text-rc-text">LinkedIn</div>
                        <p className="font-mono text-[9px] text-rc-hint">{t.uploadForm.linkedin.hint}</p>
                      </div>
                      <SignalBadge recommended={isRecommended("linkedin")} recommendedText={t.uploadForm.pills.recommended} optionalText={optionalText} />
                    </div>
                    <div className="px-3 py-2.5">
                      {!liFile ? (
                        savedLinkedinUrl ? (
                          <div className="flex flex-col gap-1.5">
                            <div className={`group flex items-center gap-2 px-2.5 py-2 bg-[#0a66c2]/[0.03] border border-[#0a66c2]/25 hover:border-[#0a66c2]/50 rounded transition-all ${loadingLi ? "opacity-60" : ""}`}>
                              <button
                                type="button"
                                disabled={loadingLi}
                                onClick={async () => {
                                  setLoadingLi(true);
                                  try { const blob = await fetch(savedLinkedinUrl).then((r) => r.blob()); setLiFile(new File([blob], "linkedin.pdf", { type: "application/pdf" })); }
                                  finally { setLoadingLi(false); }
                                }}
                                className="flex items-center gap-2 flex-1 text-left disabled:cursor-not-allowed"
                              >
                                <div className="w-6 h-6 rounded bg-[#0a66c2]/8 border border-[#0a66c2]/20 flex items-center justify-center shrink-0">
                                  {loadingLi
                                    ? <span className="w-3 h-3 border-2 border-[#0a66c2]/60 border-t-transparent rounded-full animate-spin" />
                                    : <span className="font-mono text-[8px] font-bold text-[#5ba3d9]">in</span>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium text-rc-text">linkedin.pdf</p>
                                  <p className="font-mono text-[9px] text-rc-hint">{i.slots.savedUse}</p>
                                </div>
                              </button>
                              <button type="button" onClick={() => setPreviewLi(true)} className="text-rc-hint/40 hover:text-rc-hint p-0.5 transition-colors">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                            </div>
                            <button type="button" onClick={() => liRef.current?.click()} className="w-full flex items-center justify-center gap-1 py-1.5 rounded border border-rc-border font-mono text-[9px] uppercase tracking-widest text-rc-hint hover:text-rc-text transition-all">
                              {i.signals.uploadDifferent}
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => liRef.current?.click()} className="border border-[#0a66c2]/30 hover:border-[#0a66c2]/55 rounded py-2.5 px-3 text-center cursor-pointer transition-all bg-[#0a66c2]/[0.04] hover:bg-[#0a66c2]/[0.08]">
                            <p className="text-[12px] text-[#5ba3d9] font-medium">{t.uploadForm.linkedin.dropPrompt}</p>
                            <span className="font-mono text-[9px] text-rc-hint">{t.uploadForm.linkedin.exportHint}</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 px-2.5 py-2 bg-[var(--rc-green-bg)] border border-[var(--rc-green-border)] rounded">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rc-green shrink-0"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span className="text-[11px] text-rc-text flex-1 truncate">{liFile.name}</span>
                          <button type="button" onClick={() => { if (liRef.current) liRef.current.value = ""; setLiFile(null); }} className="text-rc-hint hover:text-rc-red transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      )}
                      <input type="file" ref={liRef} accept=".pdf" className="hidden" onChange={(e) => setLiFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className="border border-rc-border rounded-md overflow-hidden">
                    <div className="px-3 py-2.5 bg-rc-bg border-b border-rc-border flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-rc-red/5 border border-rc-red/20 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(201,58,57,0.8)" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-medium text-rc-text">{t.uploadForm.portfolio.label}</div>
                        <p className="font-mono text-[9px] text-rc-hint">{t.uploadForm.portfolio.hint}</p>
                      </div>
                      <SignalBadge recommended={isRecommended("portfolio")} recommendedText={t.uploadForm.pills.recommended} optionalText={optionalText} />
                    </div>
                    <div className="px-3 py-2.5 flex items-center gap-2">
                      <input
                        type="url"
                        placeholder={t.uploadForm.portfolio.placeholder}
                        value={portfolioUrl}
                        onChange={(e) => { setPortfolioUrl(e.target.value); setPingStatus("idle"); }}
                        className="flex-1 bg-rc-bg border border-rc-border rounded py-2 px-3 text-rc-text font-mono text-[11px] outline-none focus:border-rc-red/30 transition-colors placeholder:text-rc-hint/50"
                      />
                      {pingStatus === "ok" && <Tooltip text="URL accessible — le site répond correctement."><CheckCircle2 size={14} className="text-rc-green shrink-0 cursor-help" /></Tooltip>}
                      {pingStatus === "error" && <Tooltip text="URL inaccessible — vérifiez l'adresse."><XCircle size={14} className="text-rc-red shrink-0 cursor-help" /></Tooltip>}
                      <button
                        type="button"
                        disabled={!portfolioUrl.trim() || pingStatus === "checking"}
                        onClick={async () => {
                          const url = portfolioUrl.trim(); if (!url) return;
                          setPingStatus("checking");
                          try { await fetch(url, { method: "HEAD", mode: "no-cors", signal: AbortSignal.timeout(5000) }); setPingStatus("ok"); }
                          catch { setPingStatus("error"); }
                        }}
                        className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-rc-border text-rc-hint hover:text-rc-text hover:border-rc-text/30 transition-colors disabled:opacity-40 shrink-0"
                      >
                        {pingStatus === "checking" ? "..." : "Check"}
                      </button>
                    </div>
                  </div>

                  {/* Cover letter — Compare mode only */}
                  {mode === "compare" && (
                    <div className="border border-rc-border rounded-md overflow-hidden">
                      <div className="px-3 py-2.5 bg-rc-bg border-b border-rc-border flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-rc-red/5 border border-rc-red/20 flex items-center justify-center shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(201,58,57,0.8)" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[12px] font-medium text-rc-text">{t.uploadForm.coverLetter.label}</div>
                          <p className="font-mono text-[9px] text-rc-hint">{t.uploadForm.coverLetter.hint}</p>
                        </div>
                        <div className="flex bg-rc-surface border border-rc-border rounded p-0.5">
                          <button onClick={() => setMlMode("file")} className={`px-2 py-0.5 font-mono text-[8px] uppercase rounded transition-all ${mlMode === "file" ? "bg-rc-red text-white" : "text-rc-hint hover:text-rc-muted"}`}>PDF</button>
                          <button onClick={() => setMlMode("text")} className={`px-2 py-0.5 font-mono text-[8px] uppercase rounded transition-all ${mlMode === "text" ? "bg-rc-red text-white" : "text-rc-hint hover:text-rc-muted"}`}>Text</button>
                        </div>
                      </div>
                      <div className="px-3 py-2.5">
                        {mlMode === "file" ? (
                          <>
                            {!mlFile ? (
                              <div onClick={() => mlRef.current?.click()} className="border border-dashed border-rc-border hover:border-rc-red/30 rounded py-2.5 px-3 text-center cursor-pointer transition-all bg-rc-bg hover:bg-rc-red/[0.025]">
                                <p className="text-[12px] text-rc-muted font-medium">{t.uploadForm.coverLetter.dropPrompt}</p>
                                <span className="font-mono text-[9px] text-rc-hint">or <span className="text-rc-red decoration-dotted underline">{t.uploadForm.coverLetter.browse}</span></span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-2.5 py-2 bg-[var(--rc-green-bg)] border border-[var(--rc-green-border)] rounded">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-rc-green"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <span className="text-[11px] text-rc-text flex-1 truncate">{mlFile.name}</span>
                                <button type="button" onClick={() => { if (mlRef.current) mlRef.current.value = ""; setMlFile(null); }} className="text-rc-hint hover:text-rc-red transition-colors">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                              </div>
                            )}
                            <input type="file" ref={mlRef} accept=".pdf" className="hidden" onChange={(e) => { setMlFile(e.target.files?.[0] || null); setMlText(""); }} />
                          </>
                        ) : (
                          <textarea
                            value={mlText}
                            onChange={(e) => { setMlText(e.target.value); setMlFile(null); }}
                            onBlur={() => { if (mlText.trim()) setMlFile(null); }}
                            placeholder={t.uploadForm.coverLetter.paste}
                            className="w-full bg-rc-bg border border-rc-border focus:border-rc-red/30 rounded px-3 py-2.5 text-rc-text text-[12px] min-h-[72px] resize-y outline-none transition-colors placeholder:text-rc-hint/50"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vet checks */}
            {mode === "vet" && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-[11px] tracking-[0.12em] uppercase text-rc-muted font-semibold">{i.vetChecks.title}</h3>
                  <span className="font-mono text-[10px] text-rc-hint">{i.vetChecks.subtitle}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7z"/></svg>, label: i.vetChecks.scam },
                    { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>, label: i.vetChecks.unrealistic },
                    { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4"/></svg>, label: i.vetChecks.pay },
                    { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a2.5 2.5 0 0 0 0-5H6.5a2.5 2.5 0 0 1 0-5H19"/><circle cx="5" cy="9" r="1"/></svg>, label: i.vetChecks.ghost },
                    { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14z"/><path d="M11.6 16.8a3 3 0 0 1-5.8-1.6"/></svg>, label: i.vetChecks.pressure },
                    { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>, label: i.vetChecks.intent },
                  ] as { svg: React.ReactNode; label: string }[]).map(({ svg, label }) => (
                    <div key={label} className="flex items-center gap-2 p-2.5 bg-rc-surface border border-rc-border rounded text-[12px] text-rc-muted">
                      <span className="text-rc-red shrink-0">{svg}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between mt-7 pt-6 border-t border-rc-border gap-4">
              <div className="flex items-center gap-4 font-mono text-[11px] text-rc-hint tracking-[0.05em]">
                {quotaLeft !== null && (
                  <>
                    <span><b className="text-rc-text font-semibold">{quotaLeft}</b> {i.actionBar.analysesLeft}</span>
                    <span className="w-px h-3 bg-rc-border" />
                  </>
                )}
                <span><b className="text-rc-text font-semibold">{i.actionBar.noCard.split(" ").slice(0, -1).join(" ")}</b> {i.actionBar.noCard.split(" ").slice(-1)}</span>
              </div>
              <button
                type="button"
                onClick={canRun ? onSubmit : undefined}
                disabled={!canRun || loading}
                className="font-sans font-medium text-[14px] px-5 py-3 rounded-md transition-all duration-150 flex items-center gap-2 whitespace-nowrap disabled:cursor-not-allowed"
                style={
                  canRun && !loading
                    ? { background: "linear-gradient(180deg, #C0392B, #A93226)", color: "#fff", boxShadow: "0 10px 30px rgba(192,57,43,0.30)" }
                    : { background: "var(--rc-bg)", color: "var(--rc-hint)", border: "1px solid var(--rc-border)" }
                }
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {i.actionBar.analyzing}
                  </>
                ) : (
                  <>{ctaLabel}{canRun && " →"}</>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rc-red/5 border border-rc-red/20 rounded text-[12px] text-rc-red font-mono text-center">
                {error}
              </div>
            )}

            <p className="text-center font-mono text-[11px] text-rc-hint tracking-[0.05em] mt-6">
              {i.privacy}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
