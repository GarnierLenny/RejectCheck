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
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
};

export function UploadForm({
  cvFile, setCvFile,
  liFile, setLiFile,
  jobDescription, setJobDescription,
  githubUsername, setGithubUsername,
  onSubmit, loading, error,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const liRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-[780px] mx-auto">
      <div className="mb-8">
        <h1 className="font-sans text-[32px] tracking-[0.03em] text-rc-text mb-1.5 uppercase">
          Analyze your application
        </h1>
        <p className="text-[13px] text-rc-muted font-mono">More inputs = more accurate diagnosis</p>
      </div>

      {/* CV Upload */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-rc-muted flex items-center gap-2">
            Your CV{" "}
            <span className="text-[10px] px-2 py-[2px] rounded-[10px] bg-rc-red-bg text-rc-red border-[0.5px] border-rc-red-border lowercase tracking-normal">required</span>
          </div>
        </div>
        {!cvFile ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-[0.5px] border-dashed border-rc-red/35 rounded-[10px] p-6 text-center cursor-pointer transition-all bg-rc-red-bg hover:border-rc-red hover:bg-[#e24b4a1f] group relative"
          >
            <div className="opacity-70 flex items-center justify-center mb-2.5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="2" width="16" height="20" rx="2" stroke="rgba(226,75,74,0.8)" strokeWidth="1.5"/>
                <path d="M8 9h8M8 13h8M8 17h5" stroke="rgba(226,75,74,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="21" cy="21" r="5" fill="#0a0a08" stroke="rgba(226,75,74,0.8)" strokeWidth="1.5"/>
                <path d="M21 18.5v5M18.5 21h5" stroke="rgba(226,75,74,0.8)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[13px] text-rc-muted mb-[3px] group-hover:text-rc-text transition-colors">Drop your CV or click to browse</p>
            <span className="font-mono text-[11px] text-rc-hint">PDF — max 5MB</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-[11px] px-[14px] bg-rc-surface border-[0.5px] border-rc-green-border rounded-[8px]">
            <div className="w-7 h-7 rounded-[6px] bg-rc-green-bg border-[0.5px] border-rc-green-border flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="1" width="9" height="12" rx="1.5" stroke="#639922" strokeWidth="1.2"/>
                <path d="M4 5h6M4 7.5h6M4 10h4" stroke="#639922" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[13px] text-rc-text flex-1 truncate">{cvFile.name}</span>
            <span className="font-mono text-[11px] text-rc-muted">{(cvFile.size / 1024).toFixed(0)} KB</span>
            <button type="button" onClick={() => { if (fileRef.current) fileRef.current.value = ""; setCvFile(null); }} className="bg-transparent border-none text-rc-muted cursor-pointer text-[18px] leading-none px-1 hover:text-rc-red transition-colors">&times;</button>
          </div>
        )}
        <input type="file" ref={fileRef} accept=".pdf" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
      </div>

      {/* Job Description */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-rc-muted flex items-center gap-2">
            Job description{" "}
            <span className="text-[10px] px-2 py-[2px] rounded-[10px] bg-rc-red-bg text-rc-red border-[0.5px] border-rc-red-border lowercase tracking-normal">required</span>
          </div>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description — title, requirements, tech stack, responsibilities..."
          className="w-full bg-rc-surface border-[0.5px] border-rc-border rounded-[10px] px-4 py-[14px] text-rc-text font-sans text-[13px] min-h-[110px] resize-y outline-none transition-colors focus:border-rc-red/40 placeholder:text-rc-hint leading-[1.6]"
        />
      </div>

      <div className="h-[0.5px] bg-rc-border my-6" />

      {/* Profile inputs */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-rc-muted flex items-center gap-2">
            Your profiles{" "}
            <span className="text-[10px] px-2 py-[2px] rounded-[10px] bg-rc-green-bg text-rc-green border-[0.5px] border-rc-green-border lowercase tracking-normal">boosts accuracy</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GitHub */}
          <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-[10px] p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-[6px] bg-black flex items-center justify-center shrink-0">
                <img src="/icons/github.svg" alt="GitHub" width={16} height={16} style={{ filter: 'invert(1)' }} />
              </div>
              <div>
                <div className="text-[13px] font-medium">GitHub</div>
                <div className="font-mono text-[11px] text-rc-hint">username</div>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-rc-hint pointer-events-none">github.com/</span>
              <input
                type="text"
                placeholder="username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="w-full bg-rc-bg border-[0.5px] border-rc-border rounded-[8px] py-[10px] pr-3 pl-[80px] text-rc-text font-mono text-[12px] outline-none transition-colors focus:border-white/20 placeholder:text-rc-hint mb-2.5"
              />
            </div>
            <div className="font-mono text-[11px] text-rc-hint leading-[1.5]">We&apos;ll analyze your repos, languages, and activity relevant to the job.</div>
          </div>

          {/* LinkedIn */}
          <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-[10px] p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-[6px] bg-[#0A66C2] flex items-center justify-center shrink-0">
                <img src="/icons/linkedin.svg" alt="LinkedIn" width={15} height={15} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div>
                <div className="text-[13px] font-medium">LinkedIn</div>
                <div className="font-mono text-[11px] text-rc-hint">export your profile as PDF</div>
              </div>
            </div>
            {!liFile ? (
              <div onClick={() => liRef.current?.click()} className="border-[0.5px] border-dashed border-[#0a66c2]/35 rounded-[8px] p-3.5 text-center cursor-pointer transition-all bg-[#0a66c2]/[0.06] hover:border-[#0a66c2]/60">
                <p className="text-[12px] text-[#0a66c2] mb-0.5">Drop your LinkedIn PDF export</p>
                <span className="font-mono text-[10px] text-rc-hint font-medium">Settings → Data Privacy → Get a copy</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-[9px] px-[12px] bg-rc-bg border-[0.5px] border-rc-green-border rounded-[8px]">
                <div className="w-[22px] h-[22px] rounded-[6px] bg-rc-green-bg border-[0.5px] border-rc-green-border flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <rect x="2" y="1" width="9" height="12" rx="1.5" stroke="#639922" strokeWidth="1.2"/>
                    <path d="M4 5h6M4 7.5h6M4 10h4" stroke="#639922" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-[12px] text-rc-text flex-1 truncate">{liFile.name}</span>
                <span className="font-mono text-[10px] text-rc-muted">{(liFile.size / 1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => { if (liRef.current) liRef.current.value = ""; setLiFile(null); }} className="bg-transparent border-none text-rc-muted cursor-pointer text-[16px] leading-none px-1 hover:text-rc-red transition-colors">&times;</button>
              </div>
            )}
            <input type="file" ref={liRef} accept=".pdf" className="hidden" onChange={(e) => setLiFile(e.target.files?.[0] || null)} />
            <div className="font-mono text-[11px] text-rc-hint leading-[1.5] mt-2.5">We&apos;ll cross-reference your experience, skills, and recommendations.</div>
          </div>
        </div>

        <div className="font-mono text-[11px] text-rc-hint mt-3 leading-[1.5] py-2.5 px-3 border-l-2 border-rc-green/30 bg-rc-green-bg rounded-r-[6px]">
          <strong className="text-rc-green font-medium">Tip:</strong> Adding GitHub + LinkedIn reduces false positives by ~40% — the diagnosis becomes job-specific, not just CV-based.
        </div>
      </div>

      <div className="h-[0.5px] bg-rc-border my-6" />

      <div className="flex items-center justify-end">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="font-sans text-[20px] tracking-[0.05em] text-white bg-rc-red px-8 py-[13px] rounded-[6px] border-none cursor-pointer transition-all hover:bg-[#a82e2d] hover:-translate-y-px hover:shadow-[0_0_20px_rgba(201,58,57,0.3)] flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? "ANALYZING..." : "ANALYZE"}
          {!loading && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7.5 3l4 4-4 4" stroke="#0a0a08" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
      {error && <div className="text-rc-red text-[13px] font-sans mt-3 text-right">{error}</div>}
    </div>
  );
}
