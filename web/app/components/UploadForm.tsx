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

/* ── Icons ───────────────────────────────────────────────────────── */

function IcoFile({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
    </svg>
  );
}

function IcoBag({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <path d="M12 12v4"/><path d="M10 14h4"/>
    </svg>
  );
}

function IcoShield({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function IcoAudit({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/><path d="M8 13h2.5"/><path d="M8 17h5"/>
      <circle cx="16.5" cy="15.5" r="2.6"/><path d="m20.5 19.5-1.6-1.6"/>
    </svg>
  );
}

function IcoUpload() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IcoGlobe({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function IcoMail({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────────── */

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

  const fileRef = useRef<HTMLInputElement>(null);
  const liRef = useRef<HTMLInputElement>(null);
  const mlRef = useRef<HTMLInputElement>(null);
  const portfolioHydrated = useRef(false);

  const [loadingCvId, setLoadingCvId] = useState<number | null>(null);
  const [loadingLi, setLoadingLi] = useState(false);
  const [pingStatus, setPingStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [openSignal, setOpenSignal] = useState<"github" | "linkedin" | "portfolio" | "cover" | null>(null);
  const [mlMode, setMlMode] = useState<"file" | "text">("file");
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);
  const [previewLi, setPreviewLi] = useState(false);

  useEffect(() => {
    if (portfolioHydrated.current) return;
    if (savedPortfolioUrl && !portfolioUrl.trim()) setPortfolioUrl(savedPortfolioUrl);
    portfolioHydrated.current = true;
  }, [savedPortfolioUrl, portfolioUrl, setPortfolioUrl]);

  const hasCv = !!cvFile;
  const hasJob = jobDescription.trim().length > 0;

  const armedMode: "audit" | "compare" | "vet" | null =
    hasCv && hasJob ? "compare" :
    hasCv          ? "audit"   :
    hasJob         ? "vet"     :
    null;

  const warningKey = useJdValidation(jobDescription);
  const warningText = warningKey
    ? (t.uploadForm.jobListing.warnings as Record<JdWarningKey, string>)[warningKey]
    : null;
  const jdLen = jobDescription.trim().length;
  const jdValid = jdLen === 0 || (jdLen >= JD_MIN_CHARS && jdLen <= JD_MAX_CHARS);

  const canRun = armedMode === "audit" || (armedMode === "compare" && jdValid);

  const preset = URL_PRESETS[roleType ?? "software"];
  const isRecommended = (f: UrlField) => preset.recommended.includes(f);
  const quotaLeft = quota ? Math.max(0, quota.monthlyCap - quota.monthlyUsed) + quota.creditsBalance : null;

  const signalCount = [
    githubUsername.trim().length > 0,
    !!liFile,
    portfolioUrl.trim().length > 0,
  ].filter(Boolean).length;

  /* ── Arm state text ────────────────────────────────────────── */
  function auditArmState() {
    if (armedMode === "audit") return "● Armed";
    if (hasCv && hasJob) return "Remove job";
    return "Add CV";
  }
  function compareArmState() {
    if (armedMode === "compare") return "● Armed";
    if (!hasCv && !hasJob) return "Add both";
    if (!hasCv) return "Add CV";
    return "Add job";
  }
  /* ── CTA label & description ───────────────────────────────── */
  const ctaLabel = armedMode === "audit" ? "Run CV audit"
    : armedMode === "compare" ? "Run comparison"
    : armedMode === "vet" ? i.actionBar.comingSoon
    : "Add inputs to run";

  const footerTitle = armedMode === "audit" ? <>Armed: <em style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontStyle: "italic", fontWeight: 400, color: "var(--rc-red)" }}>CV audit</em></>
    : armedMode === "compare" ? <>Armed: <em style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontStyle: "italic", fontWeight: 400, color: "var(--rc-red)" }}>Compare</em></>
    : armedMode === "vet" ? <>Armed: <em style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontStyle: "italic", fontWeight: 400, color: "var(--rc-red)" }}>Vet the offer</em></>
    : "Add your CV or a job post";

  const footerDesc = armedMode === "audit" ? "6-dimension quality read + public signals · ~60s"
    : armedMode === "compare" ? "Skill gap, ATS, signals, red flags, negotiation · ~90s"
    : armedMode === "vet" ? "Scam signals, pay vs market, ghost-job likelihood · ~30s"
    : "Fill a bay to see which analysis is available";

  /* ── Arm class helper ──────────────────────────────────────── */
  const armCls = (mode: "audit" | "compare" | "vet") =>
    armedMode === mode ? "active" : "";

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <>
      {previewPdf && <PdfPreviewModal url={previewPdf.url} name={previewPdf.name} onClose={() => setPreviewPdf(null)} />}
      {previewLi && savedLinkedinUrl && <PdfPreviewModal url={savedLinkedinUrl} name="linkedin.pdf" onClose={() => setPreviewLi(false)} />}

      <style>{`
        /* Armed switch */
        .rc-armed { display:grid; grid-template-columns:repeat(2,1fr); margin:0 0 20px; border:1px solid var(--rc-border); border-radius:6px; background:#fff; box-shadow:0 1px 2px rgba(20,20,20,0.04); overflow:hidden; }
        .rc-arm { padding:14px 18px; border-right:1px solid var(--rc-border); display:flex; align-items:center; gap:12px; position:relative; transition:background 160ms ease; }
        .rc-arm:last-child { border-right:0; }
        .rc-arm__dot { width:9px; height:9px; border-radius:99px; flex-shrink:0; background:var(--rc-border); transition:background 160ms ease; }
        .rc-arm__txt { display:flex; flex-direction:column; }
        .rc-arm__lab { font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--rc-hint); font-weight:700; }
        .rc-arm__needs { font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.04em; color:var(--rc-hint); margin-top:2px; }
        .rc-arm__state { margin-left:auto; font-family:var(--font-mono); font-size:9px; letter-spacing:0.08em; text-transform:uppercase; color:var(--rc-hint); white-space:nowrap; }
        .rc-arm.active { background:rgba(201,58,57,0.05); }
        .rc-arm.active::after { content:''; position:absolute; left:0; right:0; bottom:0; height:2px; background:var(--rc-red); }
        .rc-arm.active .rc-arm__dot { background:var(--rc-red); animation:armpulse 1.8s ease-in-out infinite; }
        @keyframes armpulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,58,57,0.4);}50%{box-shadow:0 0 0 6px rgba(201,58,57,0);} }
        .rc-arm.active .rc-arm__lab { color:var(--rc-red); }
        .rc-arm.active .rc-arm__state { color:var(--rc-red); font-weight:700; }

        /* Bays */
        .rc-bays { display:grid; grid-template-columns:1fr 1fr; gap:18px; align-items:stretch; }
        .rc-bay { background:#fff; border:1px solid var(--rc-border); border-radius:6px; padding:22px; display:flex; flex-direction:column; box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04); }
        .rc-bay--filled { border-color:rgba(34,163,80,0.35); }
        .rc-bay__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .rc-bay__title { font-family:var(--font-mono); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--rc-hint); font-weight:700; display:inline-flex; align-items:center; gap:9px; }
        .rc-bay__num { width:20px; height:20px; border-radius:4px; background:var(--rc-bg); color:var(--rc-hint); display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:10px; font-weight:700; }
        .rc-bay__body { flex:1; display:flex; flex-direction:column; }
        .rc-bay__dz { display:flex; flex-direction:column; align-items:center; justify-content:center; border:1.5px dashed var(--rc-border); border-radius:6px; padding:28px; text-align:center; transition:all 180ms ease; cursor:pointer; background:#fff; }
        .rc-bay__dz:hover { border-color:var(--rc-red); background:rgba(201,58,57,0.03); }
        .rc-bay__dz:hover .rc-dz-ico { color:var(--rc-red); }
        .rc-dz-ico { color:var(--rc-hint); margin-bottom:12px; }
        .rc-dz-h { font-family:var(--font-mono); font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin:0 0 6px; color:var(--rc-hint); }
        .rc-dz-hint { font-family:var(--font-mono); font-size:11px; color:var(--rc-hint); letter-spacing:0.04em; }

        /* Signals */
        .rc-signals { margin-top:16px; padding-top:16px; border-top:1px solid var(--rc-border); }
        .rc-signals__lab { font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--rc-hint); font-weight:700; margin-bottom:10px; display:flex; justify-content:space-between; }
        .rc-chips { display:flex; gap:8px; }
        .rc-chip { flex:1; display:flex; align-items:center; gap:7px; justify-content:center; padding:9px 6px; border:1px solid var(--rc-border); border-radius:4px; background:var(--rc-bg); font-family:var(--font-mono); font-size:10px; letter-spacing:0.06em; color:var(--rc-hint); transition:all 140ms ease; cursor:pointer; white-space:nowrap; }
        .rc-chip:hover { border-color:var(--rc-hint); color:var(--rc-muted); }
        .rc-chip.on { background:rgba(34,163,80,0.08); border-color:rgba(34,163,80,0.4); color:var(--rc-green); }
        .rc-chip svg { flex-shrink:0; }
        .rc-signal-expand { margin-top:10px; padding:12px 14px; background:var(--rc-surface-hero); border:1px solid var(--rc-border); border-radius:6px; }

        /* Job bay textarea */
        .rc-ta-wrap { flex:1; display:flex; flex-direction:column; border:1px solid var(--rc-border); border-radius:6px; overflow:hidden; background:#fff; transition:border-color 150ms ease; }
        .rc-ta-wrap:focus-within { border-color:var(--rc-red); }
        .rc-ta { flex:1; width:100%; box-sizing:border-box; resize:none; background:transparent; border:0; outline:0; padding:16px 18px; min-height:200px; font-family:var(--font-sans); font-size:14px; line-height:1.55; color:var(--rc-text); }
        .rc-ta::placeholder { color:var(--rc-hint); }
        .rc-ta-foot { padding:9px 16px; border-top:1px solid var(--rc-border); display:flex; justify-content:space-between; align-items:center; font-family:var(--font-mono); font-size:10px; letter-spacing:0.06em; color:var(--rc-hint); background:var(--rc-bg); }

        /* Bay hint */
        .rc-bay__hint { margin-top:14px; padding:11px 14px; background:var(--rc-surface-hero); border:1px solid var(--rc-border); border-radius:4px; font-size:12px; line-height:1.5; color:var(--rc-muted); display:flex; gap:9px; align-items:flex-start; }
        .rc-bay__hint svg { flex-shrink:0; color:var(--rc-hint); margin-top:1px; }

        /* Filecard */
        .rc-filecard { display:flex; align-items:center; gap:14px; padding:16px 18px; background:var(--rc-surface-hero); border:1px solid var(--rc-border); border-radius:6px; }
        .rc-filecard__ico { width:42px; height:42px; border-radius:4px; background:#fff; border:1px solid var(--rc-border); display:flex; align-items:center; justify-content:center; color:var(--rc-red); flex-shrink:0; }
        .rc-filecard__meta { flex:1; min-width:0; }
        .rc-filecard__meta b { font-family:var(--font-sans); font-size:14px; font-weight:600; color:var(--rc-text); display:block; }
        .rc-filecard__meta span { font-family:var(--font-mono); font-size:11px; color:var(--rc-hint); margin-top:3px; display:block; letter-spacing:0.04em; }
        .rc-filecard__x { background:none; border:0; color:var(--rc-hint); font-family:var(--font-mono); font-size:18px; line-height:1; padding:4px; cursor:pointer; transition:color 100ms; }
        .rc-filecard__x:hover { color:var(--rc-red); }

        /* Footer */
        .rc-foot { margin-top:18px; display:flex; align-items:center; justify-content:space-between; gap:24px; padding:18px 22px; background:#fff; border:1px solid var(--rc-border); border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04); }
        .rc-foot__read { display:flex; align-items:center; gap:14px; }
        .rc-foot__ico { width:40px; height:40px; border-radius:4px; background:rgba(201,58,57,0.06); color:var(--rc-red); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .rc-foot__txt b { font-family:var(--font-sans); font-size:15px; font-weight:600; color:var(--rc-text); display:block; letter-spacing:-0.01em; }
        .rc-foot__txt span { font-family:var(--font-mono); font-size:11px; color:var(--rc-hint); letter-spacing:0.04em; margin-top:2px; display:block; }
        .rc-foot__r { display:flex; align-items:center; gap:18px; }

        /* Tags */
        .rc-tag { font-family:var(--font-mono); font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:3px 8px; border-radius:4px; border:1px solid currentColor; }
        .rc-tag--reco { color:var(--rc-amber); background:rgba(224,123,0,0.07); }
        .rc-tag--opt { color:var(--rc-hint); }

        /* Quota */
        .rc-quota { display:flex; gap:16px; align-items:center; font-family:var(--font-mono); font-size:11px; color:var(--rc-hint); letter-spacing:0.05em; }
        .rc-quota__sep { width:1px; height:12px; background:var(--rc-border); }
        .rc-quota b { color:var(--rc-text); font-weight:600; }
      `}</style>

      <div className="w-full flex-1 overflow-y-auto">
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "48px 36px 90px" }}>

          {/* ── Armed status switch ─────────────────────────────── */}
          <div className="rc-armed">
            {/* CV audit */}
            <div className={`rc-arm ${armCls("audit")}`}>
              <span className="rc-arm__dot" />
              <div className="rc-arm__txt">
                <span className="rc-arm__lab">{i.modes.audit.eyebrow}</span>
                <span className="rc-arm__needs">{i.modes.audit.needs}</span>
              </div>
              <span className="rc-arm__state">{auditArmState()}</span>
            </div>
            {/* Compare */}
            <div className={`rc-arm ${armCls("compare")}`}>
              <span className="rc-arm__dot" />
              <div className="rc-arm__txt">
                <span className="rc-arm__lab">{i.modes.compare.eyebrow}</span>
                <span className="rc-arm__needs">{i.modes.compare.needs}</span>
              </div>
              <span className="rc-arm__state">{compareArmState()}</span>
            </div>
          </div>

          {/* ── Two bays ────────────────────────────────────────── */}
          <div className="rc-bays">

            {/* CV bay */}
            <div className={`rc-bay ${hasCv ? "rc-bay--filled" : ""}`}>
              <div className="rc-bay__head">
                <span className="rc-bay__title">
                  <span className="rc-bay__num">1</span>
                  {t.uploadForm.cv.label}
                </span>
                <span className="rc-tag rc-tag--reco">Recommended</span>
              </div>
              <div className="rc-bay__body">

                {/* File area — fixed-height container so the bay doesn't jump on select */}
                <div style={{ flex: 1, minHeight: 200, display: "flex", flexDirection: "column" }}>
                  {!cvFile ? (
                    savedCvFiles && savedCvFiles.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {savedCvFiles.map((cv) => (
                          <div key={cv.id}
                            className={`group flex items-center gap-3 px-3.5 py-3 bg-rc-red/[0.03] border border-rc-red/25 hover:border-rc-red/50 rounded transition-all ${loadingCvId === cv.id ? "opacity-60" : ""}`}>
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
                              <div className="w-8 h-8 rounded bg-rc-red/8 border border-rc-red/20 flex items-center justify-center shrink-0 text-rc-red">
                                {loadingCvId === cv.id
                                  ? <span className="w-3.5 h-3.5 border-2 border-rc-red/60 border-t-transparent rounded-full animate-spin" />
                                  : <IcoFile size={13} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-rc-text truncate">{cv.name}</p>
                                <p className="font-mono text-[9px] text-rc-hint mt-0.5">{i.slots.savedUse}</p>
                              </div>
                            </button>
                            <button type="button" onClick={() => setPreviewPdf({ url: cv.url, name: cv.name })}
                              className="shrink-0 text-rc-hint/40 hover:text-rc-hint transition-colors p-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded border border-dashed border-rc-border hover:border-rc-red/30 font-mono text-[9px] uppercase tracking-widest text-rc-hint hover:text-rc-red transition-all">
                          {i.slots.uploadDifferent}
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => fileRef.current?.click()} className="rc-bay__dz" style={{ flex: 1 }}>
                        <div className="rc-dz-ico"><IcoUpload /></div>
                        <p className="rc-dz-h">{i.slots.cvDropPrompt.split(" or ")[0]}</p>
                        <p className="rc-dz-hint">{i.slots.cvFormat}</p>
                        {user && (
                          <p className="font-mono text-[9px] mt-2" style={{ color: "rgba(107,104,96,0.6)" }}>
                            <Link href={localePath("/settings")} className="underline underline-offset-2 hover:text-rc-hint transition-colors">{i.slots.saveHint}</Link>
                          </p>
                        )}
                      </div>
                    )
                  ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div className="rc-filecard">
                        <div className="rc-filecard__ico"><IcoFile size={20} /></div>
                        <div className="rc-filecard__meta">
                          <b>{cvFile.name}</b>
                          <span>{(cvFile.size / 1024).toFixed(0)} KB · PDF</span>
                        </div>
                        <button type="button" className="rc-filecard__x"
                          onClick={() => { if (fileRef.current) fileRef.current.value = ""; setCvFile(null); }}>✕</button>
                      </div>
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded border border-dashed border-rc-border hover:border-rc-red/30 font-mono text-[9px] uppercase tracking-widest text-rc-hint hover:text-rc-red transition-all">
                        {i.slots.uploadDifferent}
                      </button>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileRef} accept=".pdf" className="hidden"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)} />

                {/* Signals chips */}
                <div className="rc-signals">
                  <div className="rc-signals__lab">
                    <span>Public signals · optional</span>
                    {signalCount > 0 && (
                      <span style={{ color: "var(--rc-green)" }}>{signalCount} added</span>
                    )}
                  </div>
                  <div className="rc-chips">
                    {/* GitHub */}
                    <button type="button"
                      className={`rc-chip ${githubUsername.trim() ? "on" : ""}`}
                      onClick={() => {
                        if (githubUsername.trim()) { setGithubUsername(""); return; }
                        setOpenSignal(openSignal === "github" ? null : "github");
                      }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.83 1.19 3.09 0 4.44-2.7 5.41-5.26 5.7.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
                      GitHub
                    </button>
                    {/* LinkedIn */}
                    <button type="button"
                      className={`rc-chip ${liFile ? "on" : ""}`}
                      onClick={() => {
                        if (liFile) { if (liRef.current) liRef.current.value = ""; setLiFile(null); return; }
                        setOpenSignal(openSignal === "linkedin" ? null : "linkedin");
                      }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zM6.5 6.7c-.97 0-1.75-.79-1.75-1.76 0-.97.78-1.75 1.75-1.75s1.75.79 1.75 1.75c0 .97-.78 1.76-1.75 1.76zM20 19h-3v-5.6c0-3.37-4-3.11-4 0V19h-3V8h3v1.77c1.4-2.59 7-2.78 7 2.48V19z"/></svg>
                      LinkedIn
                    </button>
                    {/* Portfolio */}
                    <button type="button"
                      className={`rc-chip ${portfolioUrl.trim() ? "on" : ""}`}
                      onClick={() => {
                        if (portfolioUrl.trim()) { setPortfolioUrl(""); setPingStatus("idle"); return; }
                        setOpenSignal(openSignal === "portfolio" ? null : "portfolio");
                      }}>
                      <IcoGlobe size={13} />
                      Portfolio
                    </button>
                    {/* Cover letter — compare mode only */}
                    {armedMode === "compare" && (
                      <button type="button"
                        className={`rc-chip ${(mlFile || mlText.trim()) ? "on" : ""}`}
                        onClick={() => {
                          if (mlFile || mlText.trim()) { if (mlRef.current) mlRef.current.value = ""; setMlFile(null); setMlText(""); return; }
                          setOpenSignal(openSignal === "cover" ? null : "cover");
                        }}>
                        <IcoMail size={13} />
                        Cover letter
                      </button>
                    )}
                  </div>

                  {/* Expanded signal inputs */}
                  {openSignal === "github" && (
                    <div className="rc-signal-expand">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-2">GitHub username</p>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-rc-hint pointer-events-none">github.com/</span>
                        <input
                          type="text"
                          placeholder="username"
                          value={githubUsername}
                          autoFocus
                          onChange={(e) => setGithubUsername(e.target.value)}
                          onBlur={() => { if (githubUsername.trim()) setOpenSignal(null); }}
                          className="w-full bg-rc-bg border border-rc-border rounded py-2 pr-3 pl-[74px] text-rc-text font-mono text-[11px] outline-none focus:border-rc-red/30 transition-colors placeholder:text-rc-hint/50"
                        />
                      </div>
                    </div>
                  )}
                  {openSignal === "linkedin" && (
                    <div className="rc-signal-expand">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-2">{t.uploadForm.linkedin.hint}</p>
                      {savedLinkedinUrl ? (
                        <div className="flex flex-col gap-1.5">
                          <div className={`group flex items-center gap-2 px-2.5 py-2 bg-[#0a66c2]/[0.03] border border-[#0a66c2]/25 hover:border-[#0a66c2]/50 rounded transition-all ${loadingLi ? "opacity-60" : ""}`}>
                            <button
                              type="button"
                              disabled={loadingLi}
                              onClick={async () => {
                                setLoadingLi(true);
                                try { const blob = await fetch(savedLinkedinUrl).then((r) => r.blob()); setLiFile(new File([blob], "linkedin.pdf", { type: "application/pdf" })); setOpenSignal(null); }
                                finally { setLoadingLi(false); }
                              }}
                              className="flex items-center gap-2 flex-1 text-left disabled:cursor-not-allowed"
                            >
                              <span className="font-mono text-[11px] text-rc-text">linkedin.pdf</span>
                              <span className="font-mono text-[9px] text-rc-hint ml-1">{i.slots.savedUse}</span>
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
                      )}
                      <input type="file" ref={liRef} accept=".pdf" className="hidden"
                        onChange={(e) => { setLiFile(e.target.files?.[0] || null); setOpenSignal(null); }} />
                    </div>
                  )}
                  {openSignal === "portfolio" && (
                    <div className="rc-signal-expand">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-2">{t.uploadForm.portfolio.label}</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder={t.uploadForm.portfolio.placeholder}
                          value={portfolioUrl}
                          autoFocus
                          onChange={(e) => { setPortfolioUrl(e.target.value); setPingStatus("idle"); }}
                          onBlur={() => { if (portfolioUrl.trim()) setOpenSignal(null); }}
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
                  )}
                  {openSignal === "cover" && (
                    <div className="rc-signal-expand">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-rc-hint">{t.uploadForm.coverLetter.label}</p>
                        <div className="flex bg-rc-surface border border-rc-border rounded p-0.5">
                          <button onClick={() => setMlMode("file")} className={`px-2 py-0.5 font-mono text-[8px] uppercase rounded transition-all ${mlMode === "file" ? "bg-rc-red text-white" : "text-rc-hint hover:text-rc-muted"}`}>PDF</button>
                          <button onClick={() => setMlMode("text")} className={`px-2 py-0.5 font-mono text-[8px] uppercase rounded transition-all ${mlMode === "text" ? "bg-rc-red text-white" : "text-rc-hint hover:text-rc-muted"}`}>Text</button>
                        </div>
                      </div>
                      {mlMode === "file" ? (
                        <>
                          {!mlFile ? (
                            <div onClick={() => mlRef.current?.click()} className="border border-dashed border-rc-border hover:border-rc-red/30 rounded py-2.5 px-3 text-center cursor-pointer transition-all bg-rc-bg hover:bg-rc-red/[0.025]">
                              <p className="text-[12px] text-rc-muted font-medium">{t.uploadForm.coverLetter.dropPrompt}</p>
                              <span className="font-mono text-[9px] text-rc-hint">or <span className="text-rc-red decoration-dotted underline">{t.uploadForm.coverLetter.browse}</span></span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-2.5 py-2 bg-rc-green-bg border border-rc-green-border rounded">
                              <IcoFile size={11} />
                              <span className="text-[11px] text-rc-text flex-1 truncate">{mlFile.name}</span>
                              <button type="button" onClick={() => { if (mlRef.current) mlRef.current.value = ""; setMlFile(null); }} className="text-rc-hint hover:text-rc-red transition-colors">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            </div>
                          )}
                          <input type="file" ref={mlRef} accept=".pdf" className="hidden" onChange={(e) => { setMlFile(e.target.files?.[0] || null); setMlText(""); setOpenSignal(null); }} />
                        </>
                      ) : (
                        <textarea
                          value={mlText}
                          autoFocus
                          onChange={(e) => { setMlText(e.target.value); setMlFile(null); }}
                          onBlur={() => { if (mlText.trim()) setOpenSignal(null); }}
                          placeholder={t.uploadForm.coverLetter.paste}
                          className="w-full bg-rc-bg border border-rc-border focus:border-rc-red/30 rounded px-3 py-2.5 text-rc-text text-[12px] min-h-[72px] resize-y outline-none transition-colors placeholder:text-rc-hint/50"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job bay */}
            <div className="rc-bay">
              <div className="rc-bay__head">
                <span className="rc-bay__title">
                  <span className="rc-bay__num">2</span>
                  {i.slots.jobLabel}
                </span>
                <span className="rc-tag rc-tag--opt">Optional</span>
              </div>
              <div className="rc-bay__body">
                <div className="rc-ta-wrap" style={{ flex: 1 }}>
                  <textarea
                    id="rc-jd-ta"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder={i.slots.jobPlaceholder}
                    className="rc-ta"
                  />
                  <div className="rc-ta-foot">
                    <span>
                      {warningText
                        ? <span style={{ color: "var(--rc-amber)" }}>{warningText}</span>
                        : <span style={jdLen > 0 && !jdValid ? { color: "var(--rc-amber)" } : {}}>{jdLen > 0 ? `${jdLen} / 5000` : ""}</span>
                      }
                    </span>
                    {jdLen > 0 && (
                      <button type="button"
                        onClick={() => setJobDescription("")}
                        className="text-rc-hint hover:text-rc-red font-mono text-[10px] transition-colors bg-transparent border-0">
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="rc-bay__hint">
                  <IcoShield size={15} />
                  <span style={{ fontSize: "12px" }}>
                    Add it to <b style={{ color: "var(--rc-text)", fontWeight: 600 }}>compare</b> your CV against this role — or paste a post with <b style={{ color: "var(--rc-text)", fontWeight: 600 }}>no CV</b> to just vet the offer for scams &amp; red flags.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer readout + action ─────────────────────────── */}
          <div className="rc-foot">
            <div className="rc-foot__read">
              <div className="rc-foot__ico">
                <IcoAudit size={20} />
              </div>
              <div className="rc-foot__txt">
                <b>{footerTitle}</b>
                <span>{footerDesc}</span>
              </div>
            </div>
            <div className="rc-foot__r">
              {quotaLeft !== null && (
                <div className="rc-quota">
                  <span><b>{quotaLeft}</b> {i.actionBar.analysesLeft}</span>
                  <span className="rc-quota__sep" />
                  <span><b>{i.actionBar.noCard.split(" ").slice(0, -1).join(" ")}</b> {i.actionBar.noCard.split(" ").slice(-1)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={canRun ? onSubmit : undefined}
                disabled={!canRun || loading}
                className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase px-5 py-3 rounded transition-all duration-150 flex items-center gap-2 whitespace-nowrap disabled:cursor-not-allowed"
                style={
                  canRun && !loading
                    ? { background: "var(--rc-text)", color: "#fff" }
                    : { background: "var(--rc-bg)", color: "var(--rc-hint)", border: "1px solid var(--rc-border)" }
                }
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {i.actionBar.analyzing}
                  </>
                ) : ctaLabel}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rc-red/5 border border-rc-red/20 rounded text-[12px] text-rc-red font-mono text-center">
              {error}
            </div>
          )}

          <p className="text-center font-mono text-[11px] text-rc-hint tracking-[0.05em] mt-5">
            {i.privacy}
          </p>

        </div>
      </div>
    </>
  );
}
