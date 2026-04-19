"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { AnalysisResult } from "../../components/types";

import { UploadForm } from "../../components/UploadForm";
import { AuthNavLink } from "../../components/AuthNavLink";
import { LoadingScreen } from "../../components/LoadingScreen";
import { PaywallScreen } from "../../components/PaywallScreen";
import { ScoreSidebar } from "../../components/ScoreSidebar";
import { AtsTab } from "../../components/tabs/AtsTab";
import { CvAnalysisTab } from "../../components/tabs/CvAnalysisTab";
import { SignalsTab } from "../../components/tabs/SignalsTab";
import { FlagsTab } from "../../components/tabs/FlagsTab";
import { RoadmapTab } from "../../components/tabs/RoadmapTab";
import { ProjectTab } from "../../components/tabs/ProjectTab";
import { ImproveTab } from "../../components/tabs/ImproveTab";
import { InterviewTab } from "../../components/tabs/InterviewTab";
import { TechnicalRadarChart } from "../../components/TechnicalRadarChart";
import { generateMarkdown, generatePdf, triggerDownload, getExportFilenames } from "../../utils/export";
import { useAuth } from "../../../context/auth";
import { useSubscription, useAnalysis, useProfile, useSavedCvs } from "../../../lib/queries";
import { useLanguage } from "../../../context/language";
import { LangSwitcher } from "../../components/LangSwitcher";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type Tab = "overview" | "ats" | "cv-analysis" | "signals" | "flags" | "roadmap" | "project" | "improve" | "interview";

type StoredSubscription = { plan: string; email: string; expiry: number };

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const { t, localePath, locale } = useLanguage();
  const [jobDescription, setJobDescription] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [liFile, setLiFile] = useState<File | null>(null);
  const [mlFile, setMlFile] = useState<File | null>(null);
  const [mlText, setMlText] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    const validTabs: Tab[] = ["overview","ats","cv-analysis","signals","flags","roadmap","project","improve","interview"];
    return validTabs.includes(t as Tab) ? (t as Tab) : "overview";
  });
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywallReason, setPaywallReason] = useState<'local' | 'global' | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<StoredSubscription | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [visualLoadingDone, setVisualLoadingDone] = useState(false);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [reconstructedCv, setReconstructedCv] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';

  const urlId = searchParams.get('id') ? parseInt(searchParams.get('id')!) : null;

  const { data: subscriptionData } = useSubscription();
  const { data: profile } = useProfile();
  const { data: savedCvs } = useSavedCvs();
  const { data: savedAnalysis, isLoading: loadingById, isError: isAnalysisError, error: analysisError } = useAnalysis(urlId);

  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
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
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!subscriptionData || !user?.email) return;
    if (subscriptionData.status === 'active') {
      const sub: StoredSubscription = {
        plan: subscriptionData.plan,
        email: user.email,
        expiry: new Date(subscriptionData.currentPeriodEnd).getTime(),
      };
      localStorage.setItem('rc_subscription', JSON.stringify(sub));
      setActiveSubscription(sub);
      setPaywallReason(null);
    }
  }, [subscriptionData, user]);

  useEffect(() => {
    if (!savedAnalysis) return;
    setResult(savedAnalysis.result);
    setJobDescription(savedAnalysis.jobDescription || '');
    if (urlId) setAnalysisId(urlId);
    if (savedAnalysis.rewrite) {
      setReconstructedCv(savedAnalysis.rewrite.reconstructed_cv ?? null);
    }
    setVisualLoadingDone(true);
    setLoading(false);
  }, [savedAnalysis]);

  useEffect(() => {
    if (!profile?.githubUsername || githubUsername) return;
    setGithubUsername(profile.githubUsername);
  }, [profile]);

  useEffect(() => {
    if (!urlId) return;
    setLoading(loadingById);
  }, [loadingById, urlId]);

  useEffect(() => {
    if (!isAnalysisError) return;
    const msg = analysisError instanceof Error ? analysisError.message : 'Analysis not found';
    setError(msg);
    setLoading(false);
  }, [isAnalysisError, analysisError]);

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
    formData.append("locale", locale);

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

      if (res.status === 422) {
        const body = await res.json();
        setError(body.message ?? 'Invalid job description');
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
            if (payload.analysisId) setAnalysisId(payload.analysisId);
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
    setAnalysisId(null);
    setReconstructedCv(null);
    setFormStep(1);
  }

  async function handleRewrite() {
    const emailVal = activeSubscription?.email || user?.email;
    if (!analysisId || !emailVal || !session?.access_token) return;

    setIsRewriting(true);

    try {
      const res = await fetch(`${apiUrl}/api/analyze/rewrite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ analysisId, locale }),
      });

      if (!res.ok || !res.body) {
        toast.error("Rewrite failed. Please try again.");
        return;
      }

      setReconstructedCv(null);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let donePayload: { reconstructed_cv?: string } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.step === "done") donePayload = payload;
          else if (payload.step === "error") toast.error(payload.message || "Rewrite failed.");
        }
      }

      if (donePayload) {
        setReconstructedCv(donePayload.reconstructed_cv ?? null);
      } else {
        toast.error("Rewrite returned no result. Please try again.");
      }
    } catch (err) {
      console.error("[Rewrite] failed:", err);
      toast.error("Rewrite failed. Please try again.");
    } finally {
      setIsRewriting(false);
    }
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

  const hasGithubVal = githubUsername.trim().length > 0 || result?.audit.github.score !== null;
  const hasLinkedinVal = liFile !== null || result?.audit.linkedin.score !== null;
  const hasMLVal = mlFile !== null || mlText.trim().length > 0 || (result as any)?.motivationLetter !== undefined;

  const tabs = result ? ([
    { id: "overview",     label: t.tabs.skillGap },
    { id: "ats",          label: t.tabs.atsFilter,   badge: result.ats_simulation.would_pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />, badgeClass: result.ats_simulation.would_pass ? "text-rc-green" : "text-rc-red" },
    { id: "cv-analysis",  label: t.tabs.cvAnalysis,  badge: String(result.audit.cv.issues.length), badgeClass: "text-rc-amber" },
    { id: "signals",      label: t.tabs.signals,     badge: String(result.audit.github.issues.length + result.audit.linkedin.issues.length), badgeClass: "text-rc-amber" },
    { id: "flags",        label: t.tabs.redFlags,    badge: String(result.hidden_red_flags.length), badgeClass: "text-rc-red" },
    { id: "roadmap",      label: t.tabs.roadmap,     badge: null, badgeClass: "" },
    { id: "project",      label: t.tabs.project,     badge: null, badgeClass: "" },
    { id: "improve",      label: t.tabs.improveCv,   badge: "✦", badgeClass: "text-rc-red" },
    { id: "interview",    label: t.tabs.aiInterview, badge: "✦", badgeClass: "text-rc-red" },
  ] as const) : [];

  const isFormView = !paywallReason && !result && !loading;

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen flex flex-col overflow-x-hidden">
      <nav className="grid grid-cols-3 items-center px-5 py-4 md:px-[32px] border-b-[0.5px] border-rc-border">
        {/* Left: logo */}
        <Link href={localePath("/")} className="font-sans text-[22px] tracking-wide text-rc-red flex items-center gap-2.5 hover:opacity-80 transition-opacity no-underline">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck Logo" width={44} height={44} />
        </Link>

        {/* Center: step indicators (form only) */}
        <div className="flex items-center justify-center">
          {!result && !loading && !paywallReason && (
            <div className="flex items-center gap-1.5">
              {([
                { n: 1 as const, label: t.analyzeNav.steps.application },
                { n: 2 as const, label: t.analyzeNav.steps.signals },
                { n: 3 as const, label: t.analyzeNav.steps.launch },
              ]).map(({ n, label }, i) => {
                const state = formStep > n ? "done" : formStep === n ? "active" : "idle";
                return (
                  <div key={n} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <div className={`w-5 h-px ${formStep > n ? "bg-rc-green" : "bg-rc-border"}`} />
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center font-mono text-[8px] font-bold ${
                        state === "done" ? "bg-rc-green text-white"
                        : state === "active" ? "bg-rc-red text-white"
                        : "bg-white border border-rc-border text-rc-hint"
                      }`}>
                        {state === "done" ? "✓" : n}
                      </div>
                      <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${
                        state === "done" ? "text-rc-green"
                        : state === "active" ? "text-rc-red font-bold"
                        : "text-rc-hint"
                      }`}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: auth + pricing + lang */}
        <div className="flex items-center justify-end gap-4">
          <AuthNavLink />
          <Link
            href={localePath("/pricing")}
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red hover:text-rc-red/80 transition-colors no-underline"
          >
            {t.analyzeNav.pricing}
          </Link>
          <LangSwitcher />
        </div>
      </nav>

      <div className={`mx-auto transition-[max-width,width] duration-500 ${result && visualLoadingDone ? "max-w-[1600px] w-[92%] pt-9 pb-[80px] px-5 md:px-[32px]" : "w-full flex-1 flex flex-col"}`}>
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
            <div className="flex-1 flex flex-col">
              <UploadForm
                cvFile={cvFile} setCvFile={setCvFile}
                liFile={liFile} setLiFile={setLiFile}
                mlFile={mlFile} setMlFile={setMlFile}
                mlText={mlText} setMlText={setMlText}
                jobDescription={jobDescription} setJobDescription={setJobDescription}
                githubUsername={githubUsername} setGithubUsername={setGithubUsername}
                onSubmit={handleSubmit} loading={false} error={error}
                step={formStep} onStepChange={setFormStep}
                savedCvFiles={savedCvs}
                savedLinkedinUrl={profile?.linkedinUrl ?? undefined}
              />
            </div>
          )
        ) : (
          <div>
            <ScoreSidebar
              result={result}
              onReset={handleReset}
              onExportMd={exportToMd}
              onExportPdf={exportToPdf}
              isExportingPdf={isExportingPdf}
            />

            {/* Tab nav */}
            <div className="mb-8 border-b border-rc-border">
              <div className="tabs-scrollbar flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`shrink-0 flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] px-6 py-4 transition-colors relative -mb-px border-b-2 ${
                      activeTab === tab.id ? "border-rc-red text-rc-red font-bold" : "border-transparent text-rc-muted hover:text-rc-text"
                    }`}
                  >
                    {tab.label}
                    {'badge' in tab && tab.badge && <span className={`font-bold ${tab.badgeClass}`}>{tab.badge}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "overview"     && <TechnicalRadarChart data={result.technical_analysis} />}
            {activeTab === "ats"          && <AtsTab ats={result.ats_simulation} checkedKeywords={checkedKeywords} onToggle={toggleKeyword} onReset={() => setCheckedKeywords(new Set())} />}
            {activeTab === "cv-analysis"  && <CvAnalysisTab result={result} />}
            {activeTab === "signals"      && <SignalsTab github={result.audit.github} linkedin={result.audit.linkedin} hasGithub={hasGithubVal} hasLinkedin={hasLinkedinVal} />}
            {activeTab === "flags"        && <FlagsTab flags={result.hidden_red_flags} jdMatch={result.audit.jd_match} score={result.score} verdict={result.verdict} confidence={result.confidence} breakdown={result.breakdown} />}
            {activeTab === "roadmap"      && <RoadmapTab result={result} />}
            {activeTab === "project"      && <ProjectTab project={result.project_recommendation} />}
            {activeTab === "improve" && (
              <ImproveTab
                reconstructedCv={reconstructedCv}
                isLoading={isRewriting}
                isPremium={!!activeSubscription}
                hasAnalysisId={!!analysisId}
                onRewrite={handleRewrite}
              />
            )}
            {activeTab === "interview" && (
              <InterviewTab
                isPremium={!!activeSubscription}
                analysisId={analysisId}
                email={activeSubscription?.email || user?.email || null}
                accessToken={session?.access_token ?? null}
                defaultInterviewId={searchParams.get("interviewId") ? Number(searchParams.get("interviewId")) : null}
              />
            )}

            {/* Anonymous CTA */}
            {!user && (
              <div className="mt-12 p-8 bg-rc-surface border border-rc-border text-center">
                <h3 className="text-[18px] font-bold mb-3 font-mono uppercase tracking-tight">{t.analyzeNav.anonymousCta.title}</h3>
                <p className="text-rc-muted text-[15px] max-w-[420px] mx-auto mb-6 leading-relaxed">
                  {t.analyzeNav.anonymousCta.desc}
                </p>
                <Link
                  href={localePath("/login")}
                  className="inline-flex items-center justify-center px-6 py-3 bg-rc-red text-white font-mono text-[12px] tracking-widest uppercase transition-colors hover:bg-rc-red/90 active:scale-95"
                >
                  {t.analyzeNav.anonymousCta.button}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className={`border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4 max-w-[100vw] ${isFormView ? "hidden" : ""}`}>
        <div className="font-mono text-[13px] text-rc-muted">{t.analyzeNav.footer.copyright}</div>
        <div className="flex gap-6">
          <Link href={localePath("/privacy")} className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">{t.analyzeNav.footer.privacy}</Link>
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">{t.analyzeNav.footer.terms}</a>
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
