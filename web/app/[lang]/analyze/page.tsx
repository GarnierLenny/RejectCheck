"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import type { AnalysisResult } from "../../components/types";

import { UploadForm } from "../../components/UploadForm";
import { Navbar } from "../../components/Navbar";
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
import { CoverLetterTab } from "../../components/tabs/CoverLetterTab";
import { NegotiationTab } from "../../components/tabs/NegotiationTab";
import { TechnicalRadarChart } from "../../components/TechnicalRadarChart";
import { generateMarkdown, generatePdf, triggerDownload, getExportFilenames } from "../../utils/export";
import { useAuth } from "../../../context/auth";
import { useSubscription, useAnalysis, useProfile, useSavedCvs } from "../../../lib/queries";
import { consumeSSE } from "../../../lib/sse";
import { useLanguage } from "../../../context/language";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type Tab = "overview" | "ats" | "cv-analysis" | "signals" | "flags" | "negotiation" | "roadmap" | "project" | "improve" | "interview" | "cover-letter";

type StoredSubscription = { plan: string; email: string; expiry: number };

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
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
    const validTabs: Tab[] = ["overview","ats","cv-analysis","signals","flags","negotiation","roadmap","project","improve","interview","cover-letter"];
    return validTabs.includes(t as Tab) ? (t as Tab) : "overview";
  });
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
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
    setStreamText("");

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

      type AnalyzePayload = {
        step: string;
        delta?: string;
        result?: AnalysisResult;
        analysisId?: number | null;
        negotiation?: AnalysisResult["negotiation_analysis"];
        message?: string;
      };

      await consumeSSE<AnalyzePayload>(res, (payload) => {
        if (payload.step === "analysis_delta") {
          setStreamText((prev) => prev + (payload.delta ?? ""));
        } else if (payload.step === "analysis_done") {
          if (payload.result) setResult(payload.result);
          if (payload.analysisId) setAnalysisId(payload.analysisId);
        } else if (payload.step === "negotiation_delta") {
          setStreamText((prev) => prev + (payload.delta ?? ""));
        } else if (payload.step === "negotiation_done") {
          setResult((prev) =>
            prev ? { ...prev, negotiation_analysis: payload.negotiation } : prev,
          );
        } else if (payload.step === "done") {
          // Fallback: ensure we have a result even if analysis_done was missed.
          if (payload.result && !result) setResult(payload.result);
          if (payload.analysisId) {
            setAnalysisId(payload.analysisId);
            // Pre-populate the useAnalysis cache so the upcoming urlId change
            // doesn't trigger a refetch + a brief loading flicker.
            if (user?.id) {
              queryClient.setQueryData(
                ['analysis', payload.analysisId, user.id],
                { result: payload.result ?? result, jobDescription },
              );
            }
            router.replace(
              `${localePath('/analyze')}?id=${payload.analysisId}`,
              { scroll: false },
            );
          }
          setLoading(false);
        } else if (payload.step === "error") {
          throw new Error(payload.message || "Analysis failed");
        } else {
          setCurrentStep(payload.step);
        }
      });
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
    router.replace(localePath('/analyze'), { scroll: false });
  }

  // When the URL drops the analysis id (e.g. user clicked "Analyze" in the
  // navbar from a result view), the route stays mounted — manually reset the
  // form state so the user lands on the empty form.
  const prevUrlIdRef = useRef<number | null>(urlId);
  useEffect(() => {
    if (prevUrlIdRef.current !== null && urlId === null && result) {
      handleReset();
    }
    prevUrlIdRef.current = urlId;
  }, [urlId, result]); // eslint-disable-line react-hooks/exhaustive-deps

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

      type RewritePayload = {
        step: string;
        reconstructed_cv?: string;
        message?: string;
      };
      let reconstructedCvFromStream: string | null = null;
      let received = false;

      await consumeSSE<RewritePayload>(res, (payload) => {
        if (payload.step === "done") {
          received = true;
          reconstructedCvFromStream = payload.reconstructed_cv ?? null;
        } else if (payload.step === "error") {
          toast.error(payload.message || "Rewrite failed.");
        }
      });

      if (received) {
        setReconstructedCv(reconstructedCvFromStream);
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
    { id: "negotiation",  label: t.tabs.negotiation, badge: "✦", badgeClass: "text-rc-red" },
    { id: "roadmap",      label: t.tabs.roadmap,     badge: null, badgeClass: "" },
    { id: "project",      label: t.tabs.project,     badge: null, badgeClass: "" },
    { id: "improve",      label: t.tabs.improveCv,   badge: "✦", badgeClass: "text-rc-red" },
    { id: "interview",    label: t.tabs.aiInterview, badge: "✦", badgeClass: "text-rc-red" },
    { id: "cover-letter", label: t.tabs.coverLetter, badge: "✦", badgeClass: "text-rc-red" },
  ] as const) : [];

  const isFormView = !paywallReason && !result && !loading;

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen flex flex-col overflow-x-hidden">
      <Navbar activePage="analyze" />

      <div className={`mx-auto transition-[max-width,width] duration-500 ${result && visualLoadingDone ? "max-w-[1600px] w-[92%] pt-9 pb-[80px] px-5 md:px-[32px]" : "w-full flex-1 flex flex-col"}`}>
        {paywallReason ? (
          <PaywallScreen />
        ) : (!result || !visualLoadingDone) ? (
          (loading || (result && !visualLoadingDone)) ? (
            <LoadingScreen
              currentStep={!loading && result ? "done" : currentStep}
              streamText={streamText}
              hasGithub={githubUsername.trim().length > 0}
              hasLinkedin={liFile !== null}
              hasML={mlFile !== null || mlText.trim().length > 0}
              isHired={activeSubscription?.plan === 'hired'}
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
            {activeTab === "negotiation"  && <NegotiationTab result={result} analysisId={analysisId} isPremium={activeSubscription?.plan === 'hired'} />}
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
            {activeTab === "cover-letter" && (
              <CoverLetterTab
                analysisId={analysisId}
                isPremium={activeSubscription?.plan === 'hired'}
                company={(result as any)?.job_details?.company ?? null}
                candidateName={profile?.coverLetterName ?? profile?.displayName ?? null}
                savedCoverLetter={savedAnalysis?.coverLetter ?? null}
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
          <Link href={localePath("/alternatives")} className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">{t.analyzeNav.footer.alternatives}</Link>
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
