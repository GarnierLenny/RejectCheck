"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import type {
  AnalysisResult,
  DeepAnalysisPayload,
} from "../../components/types";
import { mergeDeepIntoResult } from "../../components/types";

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
import { BridgeTab } from "../../components/tabs/BridgeTab";
import { ConsistencyTab } from "../../components/tabs/ConsistencyTab";
import { TECH_ROLES } from "../../../lib/onboarding-data";
import { ImproveTab } from "../../components/tabs/ImproveTab";
import { InterviewTab } from "../../components/tabs/InterviewTab";
import { CoverLetterTab } from "../../components/tabs/CoverLetterTab";
import { NegotiationTab } from "../../components/tabs/NegotiationTab";
import { TechnicalRadarChart } from "../../components/TechnicalRadarChart";
import { generateMarkdown, generatePdf, triggerDownload, getExportFilenames } from "../../utils/export";
import { useAuth } from "../../../context/auth";
import { useSubscription, useAnalysis, useProfile, useSavedCvs } from "../../../lib/queries";
import { useRegenerateDeep } from "../../../lib/mutations";
import { consumeSSE } from "../../../lib/sse";
import { useLanguage } from "../../../context/language";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type Tab = "overview" | "ats" | "cv-analysis" | "signals" | "flags" | "consistency" | "negotiation" | "roadmap" | "project" | "improve" | "interview" | "cover-letter";

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
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    const validTabs: Tab[] = ["overview","ats","cv-analysis","signals","flags","consistency","negotiation","roadmap","project","improve","interview","cover-letter"];
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
  // Deep-pass status: 'pending' while we're still streaming the first run,
  // 'failed' if the SSE flow ended without a deep_done event, 'ready' once
  // we've merged a deep payload into the result. Drives skeletons + the
  // inline "Regenerate" buttons.
  const [deepStatus, setDeepStatus] = useState<'pending' | 'failed' | 'ready'>(
    'ready',
  );

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';

  // True between `handleSubmit` and the SSE `done` event. While streaming, we
  // ignore inbound state from useAnalysis (URL just got primed at
  // analysis_done, so the query has data but it's stale wrt deep/nego that
  // are still streaming). Lets the SSE handler stay the source of truth.
  const streamingRef = useRef(false);

  const urlId = searchParams.get('id') ? parseInt(searchParams.get('id')!) : null;

  const { data: subscriptionData } = useSubscription();
  const { data: profile } = useProfile();
  const { data: savedCvs } = useSavedCvs();
  const { data: savedAnalysis, isLoading: loadingById, isError: isAnalysisError, error: analysisError } = useAnalysis(urlId);
  const regenerateDeep = useRegenerateDeep();

  function handleRegenerateDeep() {
    if (!analysisId) return;
    regenerateDeep.mutate(analysisId, {
      onSuccess: ({ deep }) => {
        setResult((prev) => (prev ? mergeDeepIntoResult(prev, deep) : prev));
        setDeepStatus('ready');
      },
      onError: () => {
        toast.error('Could not regenerate the deep analysis. Try again.');
      },
    });
  }

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
    // We're in the middle of an in-progress submission (URL just got primed
    // with the new id at analysis_done). Skip — the SSE stream is the source
    // of truth, and overwriting state with a fetched snapshot here would
    // race against incoming deep_done / negotiation_done events.
    if (streamingRef.current) return;
    setResult(savedAnalysis.result);
    setJobDescription(savedAnalysis.jobDescription || '');
    if (urlId) setAnalysisId(urlId);
    if (savedAnalysis.rewrite) {
      setReconstructedCv(savedAnalysis.rewrite.reconstructed_cv ?? null);
    }
    // Loaded analyses come pre-merged from the backend. If the deep fields
    // are still missing, the original deep pass must have failed — surface
    // the regenerate UI.
    setDeepStatus(
      savedAnalysis.result?.project_recommendation ? 'ready' : 'failed',
    );
    setVisualLoadingDone(true);
    setLoading(false);
  }, [savedAnalysis]);

  useEffect(() => {
    if (!profile?.githubUsername || githubUsername) return;
    setGithubUsername(profile.githubUsername);
  }, [profile]);

  useEffect(() => {
    if (!urlId) return;
    // Don't override the SSE-driven loading state while a fresh submission
    // is still streaming — the URL was just primed at analysis_done, so the
    // cache has data and `loadingById` is already false. Trusting it here
    // would prematurely flip the loading flag and let the savedAnalysis
    // effect overwrite our streamed result.
    if (streamingRef.current) return;
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
    setDeepStatus('pending');
    streamingRef.current = true;

    let deepArrived = false;

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
        deep?: DeepAnalysisPayload;
        negotiation?: AnalysisResult["negotiation_analysis"];
        message?: string;
      };

      // Tracks the latest known result during the stream so we can keep the
      // queryClient cache in sync with each SSE event. Closure-captured
      // because React state updates are async and we need the freshest copy.
      let latestResult: AnalysisResult | null = null;
      let latestAnalysisId: number | null = null;

      const primeQueryCache = () => {
        if (latestAnalysisId && latestResult && user?.id) {
          queryClient.setQueryData(
            ['analysis', latestAnalysisId, user.id],
            { result: latestResult, jobDescription },
          );
        }
      };

      await consumeSSE<AnalyzePayload>(res, (payload) => {
        if (payload.step === "analysis_delta") {
          setStreamText((prev) => prev + (payload.delta ?? ""));
        } else if (payload.step === "analysis_done") {
          if (payload.result) {
            latestResult = payload.result;
            setResult(payload.result);
          }
          if (payload.analysisId) {
            latestAnalysisId = payload.analysisId;
            setAnalysisId(payload.analysisId);
            primeQueryCache();
            // Reflect the new id in the URL immediately so a reload during
            // deep/nego streaming doesn't drop the user back to the form.
            router.replace(
              `${localePath('/analyze')}?id=${payload.analysisId}`,
              { scroll: false },
            );
          }
          // Transition out of the loading screen as soon as the hot pass is
          // done — the user sees the score immediately while deep + nego
          // continue streaming into skeletons.
          setVisualLoadingDone(true);
        } else if (payload.step === "deep_delta") {
          setStreamText((prev) => prev + (payload.delta ?? ""));
        } else if (payload.step === "deep_done") {
          if (payload.deep) {
            deepArrived = true;
            const deep = payload.deep;
            setResult((prev) => {
              if (!prev) return prev;
              const merged = mergeDeepIntoResult(prev, deep);
              latestResult = merged;
              primeQueryCache();
              return merged;
            });
            setDeepStatus('ready');
          }
        } else if (payload.step === "negotiation_delta") {
          setStreamText((prev) => prev + (payload.delta ?? ""));
        } else if (payload.step === "negotiation_done") {
          setResult((prev) => {
            if (!prev) return prev;
            const merged = { ...prev, negotiation_analysis: payload.negotiation };
            latestResult = merged;
            primeQueryCache();
            return merged;
          });
        } else if (payload.step === "done") {
          // Fallback: ensure we have a result even if analysis_done was missed.
          if (payload.result && !latestResult) {
            latestResult = payload.result;
            setResult(payload.result);
          }
          if (payload.analysisId && !latestAnalysisId) {
            latestAnalysisId = payload.analysisId;
            setAnalysisId(payload.analysisId);
            router.replace(
              `${localePath('/analyze')}?id=${payload.analysisId}`,
              { scroll: false },
            );
          }
          // Final cache prime with whatever the backend considers complete.
          if (payload.result && latestAnalysisId && user?.id) {
            queryClient.setQueryData(
              ['analysis', latestAnalysisId, user.id],
              { result: payload.result, jobDescription },
            );
          }
          setLoading(false);
          // The backend swallows deep-pass errors silently — if we never saw
          // a deep_done event, mark deep as failed so the UI surfaces the
          // inline regenerate buttons.
          if (!deepArrived) setDeepStatus('failed');
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
      if (!deepArrived) setDeepStatus('failed');
    } finally {
      streamingRef.current = false;
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

  // For non-tech roles (PM, design, marketing, ops, sales, other) we silently
  // hide the GitHub-related sections — the user didn't even submit a GitHub
  // username and the JD doesn't expect one. Anonymous users (no profile) and
  // legacy onboardingSkipped accounts (roleType === null) keep the inclusive
  // behaviour.
  const isTechRole =
    !profile?.roleType || TECH_ROLES.includes(profile.roleType);
  const hasGithubVal =
    isTechRole &&
    (githubUsername.trim().length > 0 || result?.audit.github.score !== null);
  const hasLinkedinVal = liFile !== null || result?.audit.linkedin.score !== null;
  const hasMLVal = mlFile !== null || mlText.trim().length > 0 || (result as any)?.motivationLetter !== undefined;

  const tabs = result ? ([
    { id: "overview",     label: t.tabs.skillGap },
    { id: "ats",          label: t.tabs.atsFilter,   badge: result.ats_simulation.would_pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />, badgeClass: result.ats_simulation.would_pass ? "text-rc-green" : "text-rc-red" },
    { id: "cv-analysis",  label: t.tabs.cvAnalysis,  badge: String(result.audit.cv.issues.length), badgeClass: "text-rc-amber" },
    { id: "signals",      label: t.tabs.signals,     badge: String((isTechRole ? result.audit.github.issues.length : 0) + result.audit.linkedin.issues.length), badgeClass: "text-rc-amber" },
    { id: "flags",        label: t.tabs.redFlags,    badge: String(result.hidden_red_flags.length), badgeClass: "text-rc-red" },
    ...(result.cross_profile_inconsistencies && result.cross_profile_inconsistencies.length > 0
      ? [{
          id: "consistency" as const,
          label: t.tabs.consistency,
          badge: String(result.cross_profile_inconsistencies.length),
          badgeClass: result.cross_profile_inconsistencies.some((i) => i.severity === "critical")
            ? "text-rc-red"
            : result.cross_profile_inconsistencies.some((i) => i.severity === "major")
              ? "text-rc-amber"
              : "text-rc-muted",
        }]
      : []),
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
                portfolioUrl={portfolioUrl} setPortfolioUrl={setPortfolioUrl}
                onSubmit={handleSubmit} loading={false} error={error}
                step={formStep} onStepChange={setFormStep}
                savedCvFiles={savedCvs}
                savedLinkedinUrl={profile?.linkedinUrl ?? undefined}
                savedPortfolioUrl={profile?.portfolioUrl ?? undefined}
                roleType={profile?.roleType ?? null}
                roleLabel={profile?.roleType ? t.onboarding.roles[profile.roleType] : null}
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

            {deepStatus === 'failed' && (
              <div className="mb-6 p-4 bg-rc-amber/10 border border-rc-amber/30 flex items-center justify-between gap-4">
                <div className="text-[13px] text-rc-text leading-snug">
                  <span className="font-semibold uppercase tracking-wider text-rc-amber font-mono text-[11px] block mb-1">
                    Some content didn&apos;t load
                  </span>
                  Fixes, the Bridge-the-Gap project, and technical analysis
                  couldn&apos;t be generated. Regenerate to fill them in.
                </div>
                <button
                  onClick={handleRegenerateDeep}
                  disabled={regenerateDeep.isPending}
                  className="shrink-0 font-mono text-[12px] uppercase tracking-[0.12em] px-4 py-2 border border-rc-amber/50 text-rc-amber hover:bg-rc-amber/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {regenerateDeep.isPending ? 'Regenerating…' : 'Regenerate'}
                </button>
              </div>
            )}

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
            {activeTab === "consistency"  && <ConsistencyTab inconsistencies={result.cross_profile_inconsistencies ?? []} timelineEntries={result.timeline_entries ?? []} />}
            {activeTab === "negotiation"  && <NegotiationTab result={result} analysisId={analysisId} isPremium={activeSubscription?.plan === 'hired'} />}
            {activeTab === "roadmap"      && <RoadmapTab result={result} />}
            {activeTab === "project"      && <BridgeTab result={result} />}
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
