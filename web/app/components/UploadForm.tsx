"use client";

import { useRef } from "react";

type Props = {
  cvFile: File | null;
  setCvFile: (f: File | null) => void;
  liFile: File | null;
  setLiFile: (f: File | null) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  githubUsername: string;
  setGithubUsername: (v: string) => void;
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading: boolean;
  error: string | null;
};

type AccuracyLevel = {
  segments: number;
  label: string;
  color: string;
};

function getAccuracy(cvFile: File | null, jd: string, github: string, liFile: File | null): AccuracyLevel {
  const hasCV = !!cvFile;
  const hasJD = jd.trim().length > 0;
  const hasGH = github.trim().length > 0;
  const hasLI = !!liFile;

  const score = (hasCV ? 1 : 0) + (hasJD ? 1 : 0) + (hasGH ? 1 : 0) + (hasLI ? 1 : 0);

  if (score <= 1) return { segments: 1, label: "Basic accuracy", color: "bg-rc-red" };
  if (score === 2) return { segments: 2, label: "Basic accuracy", color: "bg-rc-red" };
  if (score === 3) return { segments: 3, label: "Enhanced accuracy", color: "bg-rc-amber" };
  return { segments: 5, label: "Full signal", color: "bg-rc-green" };
}

export function UploadForm({
  cvFile, setCvFile,
  liFile, setLiFile,
  jobDescription, setJobDescription,
  githubUsername, setGithubUsername,
  onSubmit, loading, error,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const liRef = useRef<HTMLInputElement>(null);

  const hasRequired = !!cvFile && jobDescription.trim().length > 0;
  const accuracy = getAccuracy(cvFile, jobDescription, githubUsername, liFile);

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">

        {/* ══════════════════════════════════════
            LEFT — Required inputs
        ══════════════════════════════════════ */}
        <div className="space-y-5">

          {/* CV Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-muted">Your CV</span>
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-rc-red border border-rc-red/30 px-2 py-0.5 rounded">Required</span>
            </div>

            {!cvFile ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="group border border-dashed border-rc-red/40 bg-rc-red/[0.03] hover:bg-rc-red/[0.055] hover:border-rc-red/60 rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-14 gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-rc-red/10 border border-rc-red/20 group-hover:bg-rc-red/15 group-hover:border-rc-red/30 flex items-center justify-center transition-all duration-200">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(226,75,74,0.8)" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[15px] text-rc-muted group-hover:text-rc-text transition-colors font-medium">
                    Drop your CV or <span className="text-rc-red underline decoration-dotted underline-offset-2">browse</span>
                  </p>
                  <p className="font-mono text-[11px] text-rc-hint mt-1">PDF · max 5MB</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5 bg-rc-surface border border-rc-green/30 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-rc-green/10 border border-rc-green/20 flex items-center justify-center shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-rc-text font-medium truncate">{cvFile.name}</p>
                  <p className="font-mono text-[10px] text-rc-hint mt-0.5">{(cvFile.size / 1024).toFixed(0)} KB · PDF</p>
                </div>
                <button type="button" onClick={() => { if (fileRef.current) fileRef.current.value = ""; setCvFile(null); }} className="text-rc-hint hover:text-rc-red transition-colors p-1.5 rounded-lg hover:bg-rc-red/8">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}
            <input type="file" ref={fileRef} accept=".pdf" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
          </div>

          {/* Job Description */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-muted">Job description</span>
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-rc-red border border-rc-red/30 px-2 py-0.5 rounded">Required</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={"Paste the full job posting — title,\nrequirements, tech stack, responsibilities,\nnice-to-haves..."}
              className="w-full bg-rc-surface border border-rc-border hover:border-rc-border/70 focus:border-rc-red/20 rounded-xl px-5 py-4 text-rc-text text-[14px] min-h-[180px] resize-y outline-none transition-colors placeholder:text-rc-hint leading-[1.65]"
            />
            <p className="font-mono text-[10px] text-rc-hint mt-2">The more complete the posting, the sharper the diagnosis.</p>
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT — Signals + Accuracy + CTA
        ══════════════════════════════════════ */}
        <div className="lg:sticky lg:top-[40px] space-y-3">

          {/* GitHub card */}
          <div className="bg-rc-surface border border-rc-border rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                <img src="/icons/github.svg" alt="GitHub" width="16" height="16" className="invert" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-rc-text">GitHub</span>
                  <span className="font-mono text-[9px] text-rc-green border border-rc-green/30 bg-rc-green/8 px-1.5 py-0.5 rounded tracking-wide">+accuracy</span>
                </div>
                <p className="font-mono text-[10px] text-rc-hint mt-0.5">repos · languages · activity</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-rc-hint pointer-events-none select-none">github.com/</span>
              <input
                type="text"
                placeholder="username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="w-full bg-rc-bg border border-rc-border focus:border-rc-border/70 rounded-lg py-2.5 pr-3 pl-[78px] text-rc-text font-mono text-[12px] outline-none transition-colors placeholder:text-rc-hint/50"
              />
            </div>
          </div>

          {/* LinkedIn card */}
          <div className="bg-rc-surface border border-rc-border rounded-xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center shrink-0">
                <span className="font-mono text-[11px] font-bold text-white">in</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-rc-text">LinkedIn</span>
                  <span className="font-mono text-[9px] text-rc-green border border-rc-green/30 bg-rc-green/8 px-1.5 py-0.5 rounded tracking-wide">+accuracy</span>
                </div>
                <p className="font-mono text-[10px] text-rc-hint mt-0.5">export your profile as PDF</p>
              </div>
            </div>
            {!liFile ? (
              <div
                onClick={() => liRef.current?.click()}
                className="border border-[#0a66c2]/30 hover:border-[#0a66c2]/55 rounded-lg py-3 px-4 text-center cursor-pointer transition-all bg-[#0a66c2]/[0.06] hover:bg-[#0a66c2]/[0.1]"
              >
                <p className="text-[13px] text-[#5ba3d9] font-medium mb-0.5">Drop LinkedIn PDF export</p>
                <span className="font-mono text-[10px] text-rc-hint">Settings → Data Privacy → Get a copy</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-rc-bg border border-rc-green/30 rounded-lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="text-[12px] text-rc-text flex-1 truncate">{liFile.name}</span>
                <button type="button" onClick={() => { if (liRef.current) liRef.current.value = ""; setLiFile(null); }} className="text-rc-hint hover:text-rc-red transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}
            <input type="file" ref={liRef} accept=".pdf" className="hidden" onChange={(e) => setLiFile(e.target.files?.[0] || null)} />
          </div>

          {/* Accuracy + CTA card */}
          <div className="bg-rc-surface border border-rc-border rounded-xl p-4">

            {/* Accuracy widget */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-[3px] w-8 rounded-full transition-all duration-300 ${
                        i <= accuracy.segments ? accuracy.color : "bg-rc-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-rc-hint tracking-wide">{accuracy.label}</span>
              </div>
            </div>

            {/* Free credit badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-rc-muted">Cost</span>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-rc-green/8 border border-rc-green/20 rounded-md">
                <span className="text-[10px]">✦</span>
                <span className="font-mono text-[10px] text-rc-green font-medium uppercase tracking-tight">Free credit available</span>
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={onSubmit}
              disabled={loading || !hasRequired}
              className="w-full relative group font-mono text-[13px] tracking-[0.12em] uppercase font-medium text-white/90 bg-rc-red rounded-lg py-3.5 border-none cursor-pointer transition-all duration-200 hover:bg-[#c93a39] hover:shadow-[0_6px_24px_rgba(226,75,74,0.2)] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-rc-red overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </span>
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              )}
            </button>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-4 mt-3">
              {[
                { icon: "⏱", text: "~45s" },
                { icon: "🔒", text: "No data stored" },
                { icon: "✦", text: "1 credit" },
              ].map(({ icon, text }) => (
                <span key={text} className="font-mono text-[9px] text-rc-hint flex items-center gap-1 tracking-wide">
                  <span className="opacity-60">{icon}</span>{text}
                </span>
              ))}
            </div>

            {error && (
              <div className="mt-3 p-2.5 bg-rc-red/5 border border-rc-red/20 rounded-lg text-[11px] text-rc-red text-center font-mono">
                {error}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
