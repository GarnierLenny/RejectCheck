"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import type { components } from "./types/api";

type AnalysisResult = components["schemas"]["AnalyzeResponseDto_Output"];
type Issue = AnalysisResult["audit"]["cv"]["issues"][number];
type Fix = AnalysisResult["seniority_analysis"]["fix"];

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [liFile, setLiFile] = useState<File | null>(null);
  const liRef = useRef<HTMLInputElement>(null);
  const [githubUsername, setGithubUsername] = useState("");
  const [activeTab, setActiveTab] = useState<'ats' | 'profile' | 'audit' | 'flags'>('ats');

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("http://localhost:8888/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Analysis failed");
      return data as AnalysisResult;
    },
  });

  const result = mutation.data;
  const loading = mutation.isPending;
  const error = mutation.error?.message ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvFile) return;
    if (!jobDescription.trim()) return;

    const formData = new FormData();
    formData.append("cv", cvFile);
    if (liFile) formData.append("linkedin", liFile);
    if (githubUsername) formData.append("githubUsername", githubUsername);
    formData.append("jobDescription", jobDescription);

    mutation.mutate(formData);
  }

  const scoreTextClass = result
    ? result.score >= 70
      ? "text-rc-red"
      : result.score >= 40
      ? "text-rc-amber"
      : "text-rc-green"
    : "text-rc-red";

  const scoreBgClass = result
    ? result.score >= 70
      ? "bg-rc-red"
      : result.score >= 40
      ? "bg-rc-amber"
      : "bg-rc-green"
    : "bg-rc-red";

  // UI Helper for severity colors
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical": return "text-rc-red bg-rc-red/10 border-rc-red/20";
      case "major": return "text-rc-amber bg-rc-amber/10 border-rc-amber/20";
      case "minor": return "text-rc-muted bg-rc-muted/10 border-rc-muted/20";
      default: return "text-rc-muted bg-rc-muted/5 border-rc-border";
    }
  };

  // Helper for Fix rendering
  const FixBlock = ({ fix }: { fix: Fix }) => (
    <div className="mt-4 p-4 bg-black/20 rounded-lg border-[0.5px] border-rc-border/40">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-rc-green/20 flex items-center justify-center text-[10px] text-rc-green">✓</div>
        <p className="text-[13px] font-medium text-rc-text">{fix.summary}</p>
      </div>
      
      <div className="space-y-2.5 ml-7 mb-4">
        {fix.steps.map((step, i) => (
          <div key={i} className="text-[12px] text-rc-muted flex gap-2">
            <span className="text-rc-hint font-mono">{i + 1}.</span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      {fix.example && (
        <div className="ml-7 border-l-2 border-rc-red/20 pl-4 py-1 space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-rc-hint font-mono">Current:</span>
            <p className="text-[12px] text-rc-muted italic">"{fix.example.before}"</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-rc-green/70 font-mono italic">Reframed:</span>
            <p className="text-[12px] text-rc-text font-medium">{fix.example.after}</p>
          </div>
        </div>
      )}

      {fix.project_idea && (
        <div className="ml-7 bg-rc-bg/50 p-3.5 rounded-md border-[0.5px] border-rc-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rc-text uppercase tracking-widest">{fix.project_idea.name}</span>
            <span className="text-[10px] text-rc-green font-mono bg-rc-green/10 px-2 py-0.5 rounded">NEW PROJECT</span>
          </div>
          <p className="text-[12px] text-rc-muted mb-3 leading-relaxed">{fix.project_idea.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {fix.project_idea.endpoints.map((e, i) => (
              <span key={i} className="text-[10px] font-mono text-rc-hint bg-rc-surface px-1.5 py-0.5 rounded border-[0.5px] border-rc-border/50">{e}</span>
            ))}
          </div>
          <div className="text-[11px] text-rc-text leading-tight">
            <span className="text-rc-hint">Demonstrates:</span> {fix.project_idea.proves}
          </div>
        </div>
      )}

      <div className="mt-4 ml-7 inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-[10px] text-rc-hint font-mono uppercase tracking-tighter">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M7 3.5v3.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        Time: {fix.time_required}
      </div>
    </div>
  );

  // Helper for Issue rendering
  const IssueItem = ({ issue }: { issue: Issue }) => (
    <div className="p-5 border-b-[0.5px] border-rc-border last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start justify-between gap-4 mb-2.5">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[14px] font-medium text-rc-text leading-snug">{issue.what}</h4>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-[4px] border-[0.5px] ${getSeverityStyles(issue.severity)}`}>
              {issue.severity}
            </span>
            <span className="text-[10px] text-rc-hint uppercase tracking-widest font-mono italic">{issue.category}</span>
          </div>
        </div>
      </div>
      <p className="text-[13px] text-rc-muted leading-relaxed mb-4">{issue.why}</p>
      <FixBlock fix={issue.fix} />
    </div>
  );

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen overflow-x-hidden">
      {/* NAV */}
      <nav className="flex items-center justify-between px-5 py-4 md:px-[32px] border-b-[0.5px] border-rc-border">
        <div className="font-display text-[22px] tracking-wide text-rc-red flex items-center gap-2.5">
          <Image src="/RejectCheck.png" alt="RejectCheck Logo" width={44} height={44} className="rounded-[4px]" />
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto pt-9 px-5 md:px-[32px] pb-[80px]">
        {!result ? (
          <div className="max-w-[780px] mx-auto">
            <div className="mb-8">
              <h1 className="font-display text-[32px] tracking-[0.03em] text-rc-text mb-1.5 uppercase">
                Analyze your application
              </h1>
              <p className="text-[13px] text-rc-muted font-mono">
                More inputs = more accurate diagnosis
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-rc-muted flex items-center gap-2">
                  Your CV <span className="text-[10px] px-2 py-[2px] rounded-[10px] bg-rc-red-bg text-rc-red border-[0.5px] border-rc-red-border lowercase tracking-normal">required</span>
                </div>
              </div>
              
              {!cvFile ? (
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="border-[0.5px] border-dashed border-rc-red/35 rounded-[10px] p-6 text-center cursor-pointer transition-all bg-rc-red-bg hover:border-rc-red hover:bg-[#e24b4a1f] group relative"
                >
                  <div className="opacity-55 flex items-center justify-center mb-2.5">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="2" width="16" height="20" rx="2" stroke="rgba(226,75,74,0.6)" strokeWidth="1.5"/>
                      <path d="M8 9h8M8 13h8M8 17h5" stroke="rgba(226,75,74,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="21" cy="21" r="5" fill="#0a0a08" stroke="rgba(226,75,74,0.6)" strokeWidth="1.5"/>
                      <path d="M21 18.5v5M18.5 21h5" stroke="rgba(226,75,74,0.6)" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-[13px] text-rc-muted mb-[3px] group-hover:text-rc-text transition-colors">Drop your CV or click to browse</p>
                  <span className="font-mono text-[11px] text-rc-hint">PDF — max 5MB</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-[11px] px-[14px] bg-rc-surface border-[0.5px] border-rc-green-border rounded-[8px]">
                  <div className="w-7 h-7 rounded-[6px] bg-rc-green-bg border-[0.5px] border-rc-green-border flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="9" height="12" rx="1.5" stroke="#639922" strokeWidth="1.2"/><path d="M4 5h6M4 7.5h6M4 10h4" stroke="#639922" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </div>
                  <span className="text-[13px] text-rc-text flex-1 truncate">{cvFile.name}</span>
                  <span className="font-mono text-[11px] text-rc-muted">{(cvFile.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => { if(fileRef.current) fileRef.current.value = ""; setCvFile(null); }} className="bg-transparent border-none text-rc-muted cursor-pointer text-[18px] leading-none px-1 hover:text-rc-red transition-colors">&times;</button>
                </div>
              )}
              <input type="file" ref={fileRef} accept=".pdf" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-rc-muted flex items-center gap-2">
                  Job description <span className="text-[10px] px-2 py-[2px] rounded-[10px] bg-rc-red-bg text-rc-red border-[0.5px] border-rc-red-border lowercase tracking-normal">required</span>
                </div>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description — title, requirements, tech stack, responsibilities..."
                className="w-full bg-rc-surface border-[0.5px] border-rc-border rounded-[10px] px-4 py-[14px] text-rc-text font-sans text-[13px] min-h-[110px] resize-y outline-none transition-colors focus:border-rc-red/40 placeholder:text-rc-hint leading-[1.6]"
              />
            </div>

            <div className="h-[0.5px] bg-rc-border my-6"></div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-rc-muted flex items-center gap-2">
                  Your profiles <span className="text-[10px] px-2 py-[2px] rounded-[10px] bg-rc-green-bg text-rc-green border-[0.5px] border-rc-green-border lowercase tracking-normal">boosts accuracy</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-[10px] p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-[6px] bg-rc-text/5 text-rc-muted flex items-center justify-center font-mono text-[11px] font-medium shrink-0">GH</div>
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
                  <div className="font-mono text-[11px] text-rc-hint leading-[1.5]">
                    We'll analyze your repos, languages, and activity relevant to the job.
                  </div>
                </div>

                <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-[10px] p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-[6px] bg-[#0a66c2]/10 text-[#5ba3d9] flex items-center justify-center font-mono text-[11px] font-medium shrink-0">in</div>
                    <div>
                      <div className="text-[13px] font-medium">LinkedIn</div>
                      <div className="font-mono text-[11px] text-rc-hint">export your profile as PDF</div>
                    </div>
                  </div>
                  {!liFile ? (
                    <div onClick={() => liRef.current?.click()} className="border-[0.5px] border-dashed border-[#0a66c2]/25 rounded-[8px] p-3.5 text-center cursor-pointer transition-all bg-[#0a66c2]/[0.04] hover:border-[#0a66c2]/50">
                      <p className="text-[12px] text-[#5ba3d9]/70 mb-0.5">Drop your LinkedIn PDF export</p>
                      <span className="font-mono text-[10px] text-rc-hint">Settings → Data Privacy → Get a copy</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-[9px] px-[12px] bg-rc-bg border-[0.5px] border-rc-green-border rounded-[8px]">
                      <div className="w-[22px] h-[22px] rounded-[6px] bg-rc-green-bg border-[0.5px] border-rc-green-border flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="9" height="12" rx="1.5" stroke="#639922" strokeWidth="1.2"/><path d="M4 5h6M4 7.5h6M4 10h4" stroke="#639922" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      </div>
                      <span className="text-[12px] text-rc-text flex-1 truncate">{liFile.name}</span>
                      <span className="font-mono text-[10px] text-rc-muted">{(liFile.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => { if(liRef.current) liRef.current.value = ""; setLiFile(null); }} className="bg-transparent border-none text-rc-muted cursor-pointer text-[16px] leading-none px-1 hover:text-rc-red transition-colors">&times;</button>
                    </div>
                  )}
                  <input type="file" ref={liRef} accept=".pdf" className="hidden" onChange={(e) => setLiFile(e.target.files?.[0] || null)} />
                  <div className="font-mono text-[11px] text-rc-hint leading-[1.5] mt-2.5">
                    We'll cross-reference your experience, skills, and recommendations.
                  </div>
                </div>
              </div>
              
              <div className="font-mono text-[11px] text-rc-hint mt-3 leading-[1.5] py-2.5 px-3 border-l-2 border-rc-green/30 bg-rc-green-bg rounded-r-[6px]">
                <strong className="text-rc-green font-medium">Tip:</strong> Adding GitHub + LinkedIn reduces false positives by ~40% — the diagnosis becomes job-specific, not just CV-based.
              </div>
            </div>

            <div className="h-[0.5px] bg-rc-border my-6"></div>

            <div className="flex items-center justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="font-display text-[20px] tracking-[0.05em] text-[#0a0a08] bg-rc-red px-8 py-[13px] rounded-[6px] border-none cursor-pointer transition-all hover:bg-[#f05c5c] hover:-translate-y-px hover:shadow-[0_0_20px_rgba(226,75,74,0.4)] flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? "ANALYZING..." : "ANALYZE"}
                {!loading && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7.5 3l4 4-4 4" stroke="#0a0a08" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            </div>
            {error && (
              <div className="text-rc-red text-[13px] font-sans mt-3 text-right">{error}</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDEBAR: Scores & Confidence */}
            <div className="lg:col-span-4 sticky top-[40px] space-y-6">
              <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-muted">Overall Risk</span>
                  <span className={`font-display text-[14px] px-3 py-1 rounded bg-rc-bg border-[0.5px] ${scoreTextClass} border-current opacity-80 uppercase tracking-widest`}>
                    {result.verdict}
                  </span>
                </div>
                
                <div className={`font-mono text-[64px] font-medium leading-none mb-2 ${scoreTextClass}`}>
                  {result.score}<span className="text-[24px] opacity-40">%</span>
                </div>
                
                <div className="h-[2px] bg-white/5 w-full rounded-full overflow-hidden mb-8">
                  <div className={`h-full ${scoreBgClass} transition-all duration-1000`} style={{ width: `${result.score}%` }}></div>
                </div>

                <div className="space-y-4">
                  {Object.entries(result.breakdown).map(([key, val]) => val !== null && (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-rc-muted uppercase tracking-tight">
                        <span>{key.replace('_', ' ')}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${val >= 70 ? 'bg-rc-red' : val >= 40 ? 'bg-rc-amber' : 'bg-rc-green'} opacity-60`} style={{ width: `${val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-rc-surface/50 border-[0.5px] border-rc-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-rc-hint">Model Confidence</span>
                  <span className="text-[12px] font-mono font-bold text-rc-text">{result.confidence.score}%</span>
                </div>
                <p className="text-[12px] text-rc-muted leading-relaxed font-sans">{result.confidence.reason}</p>
                {result.confidence.score < 80 && (
                  <div className="mt-4 p-3 bg-rc-amber/5 border-[0.5px] border-rc-amber/20 rounded-lg text-[11px] text-rc-amber/80 leading-snug">
                    Tip: Provide more data (GitHub/LinkedIn) to reach 95%+ confidence.
                  </div>
                )}
              </div>

              <button 
                type="button"
                onClick={() => { mutation.reset(); setJobDescription(""); setActiveTab('ats'); }}
                className="w-full flex items-center justify-center gap-2 font-mono text-[11px] text-rc-muted hover:text-rc-text transition-colors py-4 border-[0.5px] border-rc-border rounded-xl uppercase tracking-widest"
              >
                &larr; Analyze New Profile
              </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-8">

              {/* TAB NAV */}
              <div className="flex border-b-[0.5px] border-rc-border mb-7 overflow-x-auto">
                {([
                  { id: 'ats', label: 'ATS Filter', badge: result.ats_simulation.would_pass ? '✓' : '✗', badgeClass: result.ats_simulation.would_pass ? 'text-rc-green' : 'text-rc-red' },
                  { id: 'profile', label: 'Profile Analysis', badge: null, badgeClass: '' },
                  { id: 'audit', label: 'Audit', badge: String(result.audit.cv.issues.length + result.audit.github.issues.length + result.audit.linkedin.issues.length), badgeClass: 'text-rc-amber' },
                  { id: 'flags', label: 'Red Flags', badge: String(result.hidden_red_flags.length), badgeClass: 'text-rc-red' },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest px-5 py-3 border-b-[2px] transition-colors ${
                      activeTab === tab.id
                        ? 'border-rc-red text-rc-text'
                        : 'border-transparent text-rc-hint hover:text-rc-muted'
                    }`}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span className={`font-bold ${tab.badgeClass}`}>{tab.badge}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* TAB: ATS */}
              {activeTab === 'ats' && (
                <div className={`p-8 rounded-2xl border-[1px] ${result.ats_simulation.would_pass ? 'border-rc-green/30 bg-rc-green/5' : 'border-rc-red/30 bg-rc-red/5'} relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.63 3 12"/><polyline points="21 12 16.5 14.63 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-mono text-[11px] uppercase tracking-widest text-rc-hint bg-rc-bg px-2 py-1 rounded">Module 01: Bot Filter Simulation</span>
                    </div>
                    <h2 className={`font-display text-[32px] tracking-tight uppercase mb-2 ${result.ats_simulation.would_pass ? 'text-rc-green' : 'text-rc-red'}`}>
                      {result.ats_simulation.would_pass ? 'ATS PASS ESTIMATED' : 'ATS REJECTION LIKELY'}
                    </h2>
                    <p className="text-[14px] text-rc-text leading-relaxed mb-6 max-w-[500px]">{result.ats_simulation.reason}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-rc-hint mb-3 block">Critical Missing Keywords</span>
                        <div className="flex flex-wrap gap-2">
                          {result.ats_simulation.critical_missing_keywords.map((kw, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-2 py-1 bg-rc-bg border-[0.5px] border-rc-border rounded text-[11px]">
                              <span className="text-rc-text">{kw.keyword}</span>
                              <span className="text-rc-red font-mono text-[9px]">({kw.jd_frequency}x)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-rc-hint mb-3 block">Simulated Score</span>
                        <div className="text-[28px] font-mono text-rc-text">{result.ats_simulation.score}<span className="text-[14px] opacity-40">/100</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PROFILE ANALYSIS */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-xl p-6 flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint mb-6">Seniority Gap Analysis</span>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 text-center p-3 bg-rc-bg rounded border border-rc-border">
                        <span className="text-[10px] uppercase text-rc-hint block mb-1">Expected</span>
                        <span className="text-[14px] font-medium text-rc-text">{result.seniority_analysis.expected}</span>
                      </div>
                      <div className="text-rc-hint">→</div>
                      <div className="flex-1 text-center p-3 bg-rc-bg rounded border border-rc-red/20 shadow-[0_0_15px_rgba(226,75,74,0.05)]">
                        <span className="text-[10px] uppercase text-rc-hint block mb-1 font-bold text-rc-red">Detected</span>
                        <span className="text-[14px] font-medium text-rc-text">{result.seniority_analysis.detected}</span>
                      </div>
                    </div>
                    <p className="text-[13px] text-rc-muted leading-relaxed mb-6 italic">{result.seniority_analysis.gap}</p>
                    <FixBlock fix={result.seniority_analysis.fix} />
                  </div>

                  <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-xl p-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint mb-6 flex justify-between items-center">
                      Tone Audit
                      <span className={`px-2 py-0.5 rounded text-[9px] ${result.cv_tone.detected === 'active' ? 'text-rc-green bg-rc-green/10' : 'text-rc-amber bg-rc-amber/10'}`}>
                        {result.cv_tone.detected.toUpperCase()}
                      </span>
                    </span>
                    <div className="space-y-4 mb-6">
                      {result.cv_tone.examples.map((ex, i) => (
                        <div key={i} className="p-3 bg-rc-bg rounded border-l-2 border-rc-amber-border text-[12px] text-rc-muted leading-relaxed italic">
                          "{ex}"
                        </div>
                      ))}
                    </div>
                    <FixBlock fix={result.cv_tone.fix} />
                  </div>
                </div>
              )}

              {/* TAB: AUDIT */}
              {activeTab === 'audit' && (
                <div className="space-y-8">
                  {/* CV */}
                  <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-rc-border bg-rc-surface/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-rc-red/10 border border-rc-red/20 flex items-center justify-center text-rc-red">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </div>
                        <div>
                          <h3 className="font-display text-[22px] uppercase">CV Forensic Audit</h3>
                          <p className="text-[11px] font-mono text-rc-hint uppercase tracking-tight">Status: {result.audit.cv.issues.length} technical vulnerabilities identified</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono text-[11px] text-rc-hint uppercase">Health Score</span>
                        <span className="text-[24px] font-mono text-rc-text">{result.audit.cv.score}%</span>
                      </div>
                    </div>
                    <div className="divide-y divide-rc-border">
                      {result.audit.cv.issues.map((issue, idx) => (
                        <IssueItem key={idx} issue={issue} />
                      ))}
                    </div>
                  </div>

                  {/* GITHUB & LINKEDIN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-2xl overflow-hidden">
                      <div className="p-5 border-b border-rc-border flex items-center justify-between bg-rc-bg/20">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-rc-text flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-black flex items-center justify-center text-[10px] text-white">GH</span> GitHub Signal
                        </span>
                        <span className="font-mono text-[12px] text-rc-text">{result.audit.github.score ?? 'N/A'}%</span>
                      </div>
                      <div className="p-5 space-y-4">
                        {result.audit.github.strengths.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {result.audit.github.strengths.map((s, i) => (
                              <span key={i} className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-rc-green/10 text-rc-green border border-rc-green/20">Strength: {s}</span>
                            ))}
                          </div>
                        )}
                        {result.audit.github.issues.length > 0 ? (
                          <div className="space-y-4">
                            {result.audit.github.issues.map((issue, idx) => (
                              <div key={idx} className="p-4 bg-rc-bg rounded border border-rc-border">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded border ${getSeverityStyles(issue.severity)}`}>{issue.severity}</span>
                                  <span className="text-[11px] font-medium text-rc-text truncate">{issue.what}</span>
                                </div>
                                <p className="text-[11px] text-rc-muted leading-normal line-clamp-2">{issue.why}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-rc-hint italic text-center py-6 border border-dashed border-rc-border rounded">No data provided for deep technical verification.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-2xl overflow-hidden">
                      <div className="p-5 border-b border-rc-border flex items-center justify-between bg-rc-bg/20">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-rc-text flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-[#0a66c2] flex items-center justify-center text-[10px] text-white">in</span> LinkedIn Signal
                        </span>
                        <span className="font-mono text-[12px] text-rc-text">{result.audit.linkedin.score ?? 'N/A'}%</span>
                      </div>
                      <div className="p-5 space-y-4">
                        {result.audit.linkedin.strengths.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {result.audit.linkedin.strengths.map((s, i) => (
                              <span key={i} className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-rc-green/10 text-rc-green border border-rc-green/20">Strength: {s}</span>
                            ))}
                          </div>
                        )}
                        {result.audit.linkedin.issues.length > 0 ? (
                          <div className="space-y-4">
                            {result.audit.linkedin.issues.map((issue, idx) => (
                              <div key={idx} className="p-4 bg-rc-bg rounded border border-rc-border">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded border ${getSeverityStyles(issue.severity)}`}>{issue.severity}</span>
                                  <span className="text-[11px] font-medium text-rc-text truncate">{issue.what}</span>
                                </div>
                                <p className="text-[11px] text-rc-muted leading-normal line-clamp-2">{issue.why}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-rc-hint italic text-center py-6 border border-dashed border-rc-border rounded">LinkedIn profile missing from source data.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: RED FLAGS */}
              {activeTab === 'flags' && (
                <div className="space-y-8">
                  {/* HIDDEN RED FLAGS */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-rc-hint px-2">Experienced Recruiter Intuition</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {result.hidden_red_flags.map((flag, idx) => (
                        <div key={idx} className="group bg-rc-bg border-[0.5px] border-rc-border rounded-xl p-6 transition-all hover:bg-white/[0.01]">
                          <div className="flex items-start gap-5">
                            <div className="w-1.5 h-1.5 bg-rc-red rounded-full mt-2 shrink-0"></div>
                            <div className="space-y-4 w-full">
                              <div>
                                <h4 className="text-[15px] font-bold text-rc-text mb-1 uppercase tracking-tight">{flag.flag}</h4>
                                <div className="text-[13px] text-rc-muted leading-relaxed">
                                  <span className="text-rc-amber/70 font-mono text-[10px] uppercase font-bold mr-2">Recruiter perception:</span>
                                  {flag.perception}
                                </div>
                              </div>
                              <FixBlock fix={flag.fix} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* JD MATCH / SKILLS GRID */}
                  <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-xl p-8">
                    <h3 className="font-display text-[22px] uppercase mb-8">Technical Requirement Matrix</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-8">
                      {result.audit.jd_match.required_skills.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-rc-border/40">
                          <span className="text-[13px] text-rc-text">{s.skill}</span>
                          <div className="flex items-center gap-3">
                            {s.evidence && <span className="text-[9px] font-mono text-rc-hint truncate max-w-[100px]">{s.evidence}</span>}
                            {s.found ? (
                              <span className="w-4 h-4 rounded-full bg-rc-green/20 text-rc-green flex items-center justify-center text-[10px]">✓</span>
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-rc-red/20 text-rc-red flex items-center justify-center text-[12px] leading-none">×</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {result.audit.jd_match.experience_gap && (
                      <div className="mt-8 p-4 bg-rc-red/5 border-l-4 border-rc-red rounded-r-lg">
                        <span className="text-[11px] font-mono uppercase text-rc-red block mb-1">Crucial Experience Gap</span>
                        <p className="text-[13px] text-rc-text italic leading-relaxed">{result.audit.jd_match.experience_gap}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4 max-w-[100vw]">
        <div className="font-mono text-[13px] text-rc-muted">RejectCheck © 2025</div>
        <div className="flex gap-6">
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">Privacy</a>
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">Terms</a>
        </div>
      </footer>

    </div>
  );
}
