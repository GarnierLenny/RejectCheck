"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { AnalysisResult } from "../components/types";

import { UploadForm } from "../components/UploadForm";
import { AuthNavLink } from "../components/AuthNavLink";
import { LoadingScreen } from "../components/LoadingScreen";
import { PaywallScreen } from "../components/PaywallScreen";
import { ScoreSidebar } from "../components/ScoreSidebar";
import { AtsTab } from "../components/tabs/AtsTab";
import { ProfileTab } from "../components/tabs/ProfileTab";
import { AuditTab } from "../components/tabs/AuditTab";
import { SignalsTab } from "../components/tabs/SignalsTab";
import { FlagsTab } from "../components/tabs/FlagsTab";
import { ActionsTab } from "../components/tabs/ActionsTab";
import { BridgeTab } from "../components/tabs/BridgeTab";
import { TechnicalRadarChart } from "../components/TechnicalRadarChart";
import { generateMarkdown, generatePdf, triggerDownload, getExportFilenames } from "../utils/export";
import { useAuth } from "../../context/auth";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type Tab = "overview" | "ats" | "profile" | "audit" | "signals" | "flags" | "actions" | "bridge";

type StoredSubscription = { plan: string; email: string; expiry: number };

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [liFile, setLiFile] = useState<File | null>(null);
  const [mlFile, setMlFile] = useState<File | null>(null);
  const [mlText, setMlText] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywallReason, setPaywallReason] = useState<'local' | 'global' | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<StoredSubscription | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [visualLoadingDone, setVisualLoadingDone] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';

  useEffect(() => {
    // Check for stored subscription
    try {
      const stored = localStorage.getItem('rc_subscription');
      if (stored) {
        const parsed: StoredSubscription = JSON.parse(stored);
        if (parsed.expiry > Date.now()) {
          setActiveSubscription(parsed);
          if (parsed.email) setEmail(parsed.email);
        } else {
          localStorage.removeItem('rc_subscription');
        }
      }
    } catch {
      // ignore parse errors
    }

    // Sync subscription status from server if user is logged in
    if (user?.email) {
      fetch(`${apiUrl}/api/stripe/subscription?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data?.status === 'active') {
            const sub: StoredSubscription = {
              plan: data.plan,
              email: user.email!,
              expiry: new Date(data.currentPeriodEnd).getTime(),
            };
            localStorage.setItem('rc_subscription', JSON.stringify(sub));
            setActiveSubscription(sub);
            setPaywallReason(null);
          }
        })
        .catch(err => console.error("[Analyze] Error syncing sub:", err));
    }
    // If there is an ID in the URL, fetch that analysis
    const id = searchParams.get('id');
    if (id && user?.email) {
      setLoading(true);
      fetch(`${apiUrl}/api/analyze/${id}?email=${user.email}`)
        .then(res => {
          if (!res.ok) throw new Error("Analysis not found");
          return res.json();
        })
        .then(data => {
          setResult(data.result);
          setJobDescription(data.jobDescription || "");
          setVisualLoadingDone(true);
          setLoading(false);
        })
        .catch(err => {
          console.error("[Analyze] Error loading by ID:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [searchParams, user, apiUrl]);

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!cvFile || !jobDescription.trim()) return;

    const formData = new FormData();
    formData.append("cv", cvFile);
    if (liFile) formData.append("linkedin", liFile);
    if (mlFile) formData.append("motivationLetter", mlFile);
    if (mlText) formData.append("motivationLetterText", mlText);
    if (githubUsername) formData.append("githubUsername", githubUsername);
    formData.append("jobDescription", jobDescription);
    const emailToSend = activeSubscription?.email || user?.email || email;
    if (emailToSend) formData.append("email", emailToSend);
    formData.append("isRegistered", String(!!user));

    setLoading(true);
    setError(null);
    setCurrentStep(null);

    try {
      const res = await fetch(`${apiUrl}/api/analyze`, { method: "POST", body: formData });
      
      if (res.status === 402) {
        setPaywallReason('global');
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.step === "done") {
            setResult(payload.result);
            setLoading(false);
          } else if (payload.step === "error") {
            throw new Error(payload.message);
          } else {
            setCurrentStep(payload.step);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setLoading(false);
      setCurrentStep(null);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setCurrentStep(null);
    setJobDescription("");
    setActiveTab("overview");
    setCheckedKeywords(new Set());
    setVisualLoadingDone(false);
  }

  function toggleKeyword(keyword: string) {
    setCheckedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword); else next.add(keyword);
      return next;
    });
  }

  const exportToMd = () => {
    if (!result) return;
    const md = generateMarkdown(result);
    const names = getExportFilenames(result);
    triggerDownload(md, names.md, "text/markdown");
    toast.success("Markdown report downloaded");
  };

  const exportToPdf = async () => {
    if (!result) return;
    setIsExportingPdf(true);
    const names = getExportFilenames(result);
    try {
      await generatePdf(result, names.pdf);
      toast.success("PDF report generated");
    } catch (err) {
      console.error("PDF Export failed:", err);
      toast.error("Failed to generate PDF");
    }
    setIsExportingPdf(false);
  };

  // Derive flags from either current state or loaded result
  const hasGithubVal = githubUsername.trim().length > 0 || result?.audit.github.score !== null;
  const hasLinkedinVal = liFile !== null || result?.audit.linkedin.score !== null;
  const hasMLVal = mlFile !== null || mlText.trim().length > 0 || (result as any)?.motivationLetter !== undefined;

  const tabs = result ? ([
    { id: "overview", label: "Skill Gap",   badge: null, badgeClass: "" },
    { 
      id: "ats",     
      label: "ATS Filter", 
      badge: result.ats_simulation.would_pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />, 
      badgeClass: result.ats_simulation.would_pass ? "text-rc-green" : "text-rc-red" 
    },
    { id: "profile", label: "Profile",    badge: null, badgeClass: "" },
    { id: "audit",   label: "CV Audit",   badge: String(result.audit.cv.issues.length), badgeClass: "text-rc-amber" },
    { id: "signals", label: "Signals",    badge: String(result.audit.github.issues.length + result.audit.linkedin.issues.length), badgeClass: "text-rc-amber" },
    { id: "flags",   label: "Red Flags",  badge: String(result.hidden_red_flags.length), badgeClass: "text-rc-red" },
    { id: "actions", label: "Actions to take", badge: null, badgeClass: "" },
    { id: "bridge",  label: "Bridge the gap",   badge: null, badgeClass: "" },
  ] as const) : [];

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen overflow-x-hidden">
      <nav className="flex items-center justify-between px-5 py-4 md:px-[32px] border-b-[0.5px] border-rc-border">
        <Link href="/" className="font-sans text-[22px] tracking-wide text-rc-red flex items-center gap-2.5 hover:opacity-80 transition-opacity no-underline">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck Logo" width={44} height={44} />
        </Link>
        <div className="flex items-center gap-6">
          <AuthNavLink />
          <Link
            href="/pricing"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red hover:text-rc-red/80 transition-colors no-underline"
          >
            Pricing →
          </Link>
        </div>
      </nav>

      <div className={`${result && visualLoadingDone ? "max-w-[1600px] w-[92%]" : "max-w-[1000px] w-full"} mx-auto pt-9 px-5 md:px-[32px] pb-[80px] transition-[max-width,width] duration-500`}>
        {paywallReason ? (
          <PaywallScreen />
        ) : (!result || !visualLoadingDone) ? (
          (loading || (result && !visualLoadingDone)) ? (
            <LoadingScreen 
              currentStep={result ? "done" : currentStep} 
              hasGithub={githubUsername.trim().length > 0} 
              hasLinkedin={liFile !== null}
              hasML={mlFile !== null || mlText.trim().length > 0}
              onFinished={() => setVisualLoadingDone(true)}
            />
          ) : (
            <>
              <UploadForm
                cvFile={cvFile} setCvFile={setCvFile}
                liFile={liFile} setLiFile={setLiFile}
                mlFile={mlFile} setMlFile={setMlFile}
                mlText={mlText} setMlText={setMlText}
                jobDescription={jobDescription} setJobDescription={setJobDescription}
                githubUsername={githubUsername} setGithubUsername={setGithubUsername}
                onSubmit={handleSubmit} loading={false} error={error}
              />
            </>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <ScoreSidebar 
              result={result} 
              onReset={handleReset} 
              onExportMd={exportToMd}
              onExportPdf={exportToPdf}
              isExportingPdf={isExportingPdf}
            />

            <div className="lg:col-span-8">
              {/* Tab nav */}
              <div className="relative mb-7">
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-rc-red rounded-full pointer-events-none" />
                <div className="tabs-scrollbar flex border-b-0 overflow-x-auto pb-[2px]">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest px-5 py-3 border-b-[2px] transition-colors ${
                        activeTab === tab.id ? "border-rc-red text-rc-red font-semibold" : "border-transparent text-rc-hint hover:text-rc-muted"
                      }`}
                    >
                      {tab.label}
                      {tab.badge && <span className={`font-bold ${tab.badgeClass}`}>{tab.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              {activeTab === "overview" && <TechnicalRadarChart data={result.technical_analysis} />}
              {activeTab === "ats"     && <AtsTab ats={result.ats_simulation} checkedKeywords={checkedKeywords} onToggle={toggleKeyword} onReset={() => setCheckedKeywords(new Set())} />}
              {activeTab === "profile" && <ProfileTab result={result} />}
              {activeTab === "audit"   && <AuditTab cv={result.audit.cv} />}
              {activeTab === "signals" && <SignalsTab github={result.audit.github} linkedin={result.audit.linkedin} hasGithub={hasGithubVal} hasLinkedin={hasLinkedinVal} />}
              {activeTab === "flags"   && <FlagsTab flags={result.hidden_red_flags} jdMatch={result.audit.jd_match} />}
              {activeTab === "actions" && <ActionsTab result={result} />}
              {activeTab === "bridge"  && <BridgeTab result={result} />}

              {/* Anonymous CTA */}
              {!user && (
                <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-rc-surface to-rc-bg border border-rc-red/20 text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rc-red/50 to-transparent" />
                  <h3 className="text-xl font-bold mb-3">Don't lose your analysis</h3>
                  <p className="text-rc-muted text-sm max-w-[400px] mx-auto mb-6">
                    Sign up now to save this result and track your progress. Unregistered analyses are not saved and will be lost.
                  </p>
                  <Link 
                    href="/login" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/20"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4 max-w-[100vw]">
        <div className="font-mono text-[13px] text-rc-muted">RejectCheck © 2026</div>
        <div className="flex gap-6">
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">Privacy</a>
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">Terms</a>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
