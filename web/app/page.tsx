"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import type { AnalysisResult } from "./components/types";

import { UploadForm } from "./components/UploadForm";
import { ScoreSidebar } from "./components/ScoreSidebar";
import { AtsTab } from "./components/tabs/AtsTab";
import { ProfileTab } from "./components/tabs/ProfileTab";
import { AuditTab } from "./components/tabs/AuditTab";
import { SignalsTab } from "./components/tabs/SignalsTab";
import { FlagsTab } from "./components/tabs/FlagsTab";

type Tab = "ats" | "profile" | "audit" | "signals" | "flags";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [liFile, setLiFile] = useState<File | null>(null);
  const [githubUsername, setGithubUsername] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("ats");
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("http://localhost:8888/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Analysis failed");
      return data as AnalysisResult;
    },
  });

  const result = mutation.data;
  const loading = mutation.isPending;
  const error = mutation.error?.message ?? null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvFile || !jobDescription.trim()) return;
    const formData = new FormData();
    formData.append("cv", cvFile);
    if (liFile) formData.append("linkedin", liFile);
    if (githubUsername) formData.append("githubUsername", githubUsername);
    formData.append("jobDescription", jobDescription);
    mutation.mutate(formData);
  }

  function handleReset() {
    mutation.reset();
    setJobDescription("");
    setActiveTab("ats");
    setCheckedKeywords(new Set());
  }

  function toggleKeyword(keyword: string) {
    setCheckedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword); else next.add(keyword);
      return next;
    });
  }

  const tabs = result ? ([
    { id: "ats",     label: "ATS Filter", badge: result.ats_simulation.would_pass ? "✓" : "✗", badgeClass: result.ats_simulation.would_pass ? "text-rc-green" : "text-rc-red" },
    { id: "profile", label: "Profile",    badge: null, badgeClass: "" },
    { id: "audit",   label: "CV Audit",   badge: String(result.audit.cv.issues.length), badgeClass: "text-rc-amber" },
    { id: "signals", label: "Signals",    badge: String(result.audit.github.issues.length + result.audit.linkedin.issues.length), badgeClass: "text-rc-amber" },
    { id: "flags",   label: "Red Flags",  badge: String(result.hidden_red_flags.length), badgeClass: "text-rc-red" },
  ] as const) : [];

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen overflow-x-hidden">
      <nav className="flex items-center justify-between px-5 py-4 md:px-[32px] border-b-[0.5px] border-rc-border">
        <div className="font-sans text-[22px] tracking-wide text-rc-red flex items-center gap-2.5">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck Logo" width={44} height={44} />
        </div>
      </nav>

      <div className={`${result ? "max-w-[1600px] w-[92%]" : "max-w-[1000px] w-full"} mx-auto pt-9 px-5 md:px-[32px] pb-[80px] transition-[max-width,width] duration-500`}>
        {!result ? (
          <UploadForm
            cvFile={cvFile} setCvFile={setCvFile}
            liFile={liFile} setLiFile={setLiFile}
            jobDescription={jobDescription} setJobDescription={setJobDescription}
            githubUsername={githubUsername} setGithubUsername={setGithubUsername}
            onSubmit={handleSubmit} loading={loading} error={error}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <ScoreSidebar result={result} onReset={handleReset} />

            <div className="lg:col-span-8">
              {/* Tab nav */}
              <div className="flex border-b-[0.5px] border-rc-border mb-7 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest px-5 py-3 border-b-[2px] transition-colors ${
                      activeTab === tab.id ? "border-rc-red text-rc-text" : "border-transparent text-rc-hint hover:text-rc-muted"
                    }`}
                  >
                    {tab.label}
                    {tab.badge && <span className={`font-bold ${tab.badgeClass}`}>{tab.badge}</span>}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === "ats"     && <AtsTab ats={result.ats_simulation} checkedKeywords={checkedKeywords} onToggle={toggleKeyword} onReset={() => setCheckedKeywords(new Set())} />}
              {activeTab === "profile" && <ProfileTab result={result} />}
              {activeTab === "audit"   && <AuditTab cv={result.audit.cv} />}
              {activeTab === "signals" && <SignalsTab github={result.audit.github} linkedin={result.audit.linkedin} hasGithub={githubUsername.trim().length > 0} hasLinkedin={liFile !== null} />}
              {activeTab === "flags"   && <FlagsTab flags={result.hidden_red_flags} jdMatch={result.audit.jd_match} />}
            </div>
          </div>
        )}
      </div>

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
