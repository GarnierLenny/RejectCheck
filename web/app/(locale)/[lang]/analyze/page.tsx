"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { consumePendingCv } from "../../../../lib/pending-cv";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import type {
  AnalysisResult,
  DeepAnalysisPayload,
} from "../../../components/types";
import { mergeDeepIntoResult } from "../../../components/types";

import { UploadForm } from "../../../components/UploadForm";
import { Navbar } from "../../../components/Navbar";
import { LoadingScreen } from "../../../components/LoadingScreen";
import { PaywallScreen, type PaywallMode } from "../../../components/PaywallScreen";
import { ScoreSidebar } from "../../../components/ScoreSidebar";
import { AtsTab } from "../../../components/tabs/AtsTab";
import { CvAnalysisTab } from "../../../components/tabs/CvAnalysisTab";
import { CvReviewTab } from "../../../components/tabs/CvReviewTab";
import { SignalsTab } from "../../../components/tabs/SignalsTab";
import { FlagsTab } from "../../../components/tabs/FlagsTab";
import { RoadmapTab } from "../../../components/tabs/RoadmapTab";
import { ConsistencyTab } from "../../../components/tabs/ConsistencyTab";
import { TECH_ROLES } from "../../../../lib/onboarding-data";
import { ImproveTab } from "../../../components/tabs/ImproveTab";
import { InterviewTab } from "../../../components/tabs/InterviewTab";
import { AI_INTERVIEW_ENABLED } from "../../../../lib/features";
import { CoverLetterTab } from "../../../components/tabs/CoverLetterTab";
import { NegotiationTab } from "../../../components/tabs/NegotiationTab";
import { TechnicalRadarChart } from "../../../components/TechnicalRadarChart";
import dynamic from "next/dynamic";
const CvPdfViewer = dynamic(
  () => import("../../../components/CvPdfViewer").then((m) => m.CvPdfViewer),
  { ssr: false },
);
import { generateMarkdown, generatePdf, triggerDownload, getExportFilenames } from "../../../utils/export";
import { useAuth } from "../../../../context/auth";
import { useSubscription, useAnalysis, useProfile, useSavedCvs, useQuota } from "../../../../lib/queries";
import { useRegenerateDeep } from "../../../../lib/mutations";
import { consumeSSE } from "../../../../lib/sse";
import { useLanguage } from "../../../../context/language";
import { toast } from "sonner";
import { Check, X, Share2, Download } from "lucide-react";
import { ShareModal } from "../../../components/ShareModal";
import { DiagnosticResult } from "../../../components/DiagnosticResult";
import { CvAuditResult } from "../../../components/CvAuditResult";
import posthog from "posthog-js";

type Tab = "cv-review" | "overview" | "ats" | "cv-analysis" | "signals" | "flags" | "consistency" | "negotiation" | "roadmap" | "project" | "improve" | "interview" | "cover-letter";

type StoredSubscription = { plan: string; email: string; expiry: number };

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  const { t, localePath, locale } = useLanguage();
  const [jobDescription, setJobDescription] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvBlobUrl, setCvBlobUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [liFile, setLiFile] = useState<File | null>(null);
  const [mlFile, setMlFile] = useState<File | null>(null);
  const [mlText, setMlText] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [email, setEmail] = useState("");
  // Drives the result rendering. Auto-derived at submit time from JD presence,
  // and overridden when loading a saved analysis whose result shape implies
  // cv-review (see effect below).
  const [analyzeMode, setAnalyzeMode] = useState<'vs-job' | 'cv-review'>('vs-job');
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    const validTabs: Tab[] = ["cv-review","overview","ats","cv-analysis","signals","flags","consistency","negotiation","roadmap","project","improve",...(AI_INTERVIEW_ENABLED ? ["interview" as Tab] : []),"cover-letter"];
    return validTabs.includes(t as Tab) ? (t as Tab) : "overview";
  });
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Paywall state — `null` when the form/result is visible, otherwise the
  // mode (drives PaywallScreen variant) + optional cap rendered into the copy.
  const [paywallState, setPaywallState] = useState<
    { mode: PaywallMode; monthlyCap?: number } | null
  >(null);
  const [activeSubscription, setActiveSubscription] = useState<StoredSubscription | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [visualLoadingDone, setVisualLoadingDone] = useState(false);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [reconstructedCv, setReconstructedCv] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const shareToastShownRef = useRef<number | null>(null);
  // Deep-pass status: 'pending' while we're still streaming the first run,
  // 'failed' if the SSE flow ended without a deep_done event, 'ready' once
  // we've merged a deep payload into the result. Drives skeletons + the
  // inline "Regenerate" buttons.
  const [deepStatus, setDeepStatus] = useState<'pending' | 'failed' | 'ready'>(
    'ready',
  );

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';

  const [liBlobUrl, setLiBlobUrl] = useState<string | null>(null);
  const [mlBlobUrl, setMlBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!cvFile) return;
    const url = URL.createObjectURL(cvFile);
    setCvBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [cvFile]);

  useEffect(() => {
    if (!liFile) { setLiBlobUrl(null); return; }
    const url = URL.createObjectURL(liFile);
    setLiBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [liFile]);

  useEffect(() => {
    if (!mlFile) { setMlBlobUrl(null); return; }
    const url = URL.createObjectURL(mlFile);
    setMlBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mlFile]);

  // True between `handleSubmit` and the SSE `done` event. While streaming, we
  // ignore inbound state from useAnalysis (URL just got primed at
  // analysis_done, so the query has data but it's stale wrt deep/nego that
  // are still streaming). Lets the SSE handler stay the source of truth.
  const streamingRef = useRef(false);

  const urlId = searchParams.get('id') ? parseInt(searchParams.get('id')!) : null;

  const { data: subscriptionData } = useSubscription();
  const { data: quota } = useQuota();
  const { data: profile } = useProfile();
  const { data: savedCvs } = useSavedCvs();

  // Poll the analysis endpoint while we're waiting for background jobs
  // (deep/negotiation passes that the backend offloaded to BullMQ or
  // setImmediate). Stop polling once the expected fields have landed.
  const isHiredTier = subscriptionData?.plan === 'hired';
  const needsDeep = deepStatus === 'pending';
  const needsNegotiation =
    isHiredTier && !!result && !result.negotiation_analysis;
  const shouldPoll = needsDeep || needsNegotiation;

  const { data: savedAnalysis, isLoading: loadingById, isError: isAnalysisError, error: analysisError } = useAnalysis(
    urlId,
    { pollIntervalMs: shouldPoll ? 5000 : undefined },
  );
  const regenerateDeep = useRegenerateDeep();

  function handleRegenerateDeep() {
    if (!analysisId) return;
    posthog.capture("deep_analysis_regenerated", { analysis_id: analysisId });
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

    const pending = consumePendingCv();
    if (pending) {
      setCvFile(pending.file);
      if (pending.jd) setJobDescription(pending.jd);
    }

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
      setPaywallState(null);
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
    // Loaded analyses come pre-merged from the backend. Three cases:
    //  - deep present OR cv-review (no deep pass) → 'ready'
    //  - deep absent + we're actively polling for a background job ('pending')
    //    → stay 'pending' until the timeout or the next poll resolves it
    //  - deep absent + not polling (stale row opened via URL nav) → 'failed'
    const isCvReviewResult = !!savedAnalysis.result?.cv_quality;
    if (isCvReviewResult) setAnalyzeMode('cv-review');
    const hasDeep = isCvReviewResult || !!savedAnalysis.result?.project_recommendation;
    setDeepStatus((prev) => {
      if (hasDeep) return 'ready';
      if (prev === 'pending') return 'pending';
      return 'failed';
    });
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

  useEffect(() => {
    if (!result || !visualLoadingDone || !analysisId || !user) return;
    if (result.score >= 25) return;
    if (shareToastShownRef.current === analysisId) return;
    shareToastShownRef.current = analysisId;
    const timer = setTimeout(() => {
      toast("Tu as un excellent profil pour ce poste !", {
        description: "Partage tes résultats — ça ne prend que 2 secondes.",
        action: { label: "Partager", onClick: shareAnalysis },
        duration: 8000,
      });
    }, 3500);
    return () => clearTimeout(timer);
  }, [result, visualLoadingDone, analysisId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety net: if the background deep pass never lands (worker crash, Redis
  // outage), flip 'pending' → 'failed' after 5 minutes so the user sees the
  // inline regenerate UI instead of an indefinite skeleton.
  useEffect(() => {
    if (deepStatus !== 'pending') return;
    const timer = setTimeout(() => setDeepStatus('failed'), 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [deepStatus]);

  async function handleCvReviewSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!cvFile) return;

    const formData = new FormData();
    formData.append("cv", cvFile);
    if (liFile) formData.append("linkedin", liFile);
    if (githubUsername) formData.append("githubUsername", githubUsername);
    const emailToSend = activeSubscription?.email || user?.email || email;
    if (emailToSend) formData.append("email", emailToSend);
    formData.append("isRegistered", String(!!user));
    formData.append("locale", locale);

    posthog.capture("cv_review_submitted", {
      has_github: !!githubUsername,
      has_linkedin: !!liFile,
      is_registered: !!user,
      locale,
    });

    setLoading(true);
    setError(null);
    setCurrentStep(null);
    setStreamText("");
    // cv-review has no deep pass — skip 'pending' entirely
    setDeepStatus('ready');
    streamingRef.current = true;

    try {
      const res = await fetch(`${apiUrl}/api/analyze/cv-review`, { method: "POST", body: formData });

      if (res.status === 402) {
        posthog.capture("paywall_shown", { reason: "global_limit" });
        setPaywallState({ mode: user ? 'free_cap' : 'guest_limit' });
        setLoading(false);
        return;
      }

      type CvReviewPayload = {
        step: string;
        delta?: string;
        result?: AnalysisResult;
        analysisId?: number | null;
        message?: string;
        code?: string;
        details?: { plan?: 'free' | 'shortlisted' | 'hired'; monthlyCap?: number };
      };

      let latestResult: AnalysisResult | null = null;
      let latestAnalysisId: number | null = null;

      const primeQueryCache = () => {
        if (latestAnalysisId && latestResult && user?.id) {
          queryClient.setQueryData(
            ['analysis', latestAnalysisId, user.id],
            { result: latestResult, jobDescription: '' },
          );
        }
      };

      await consumeSSE<CvReviewPayload>(res, (payload) => {
        if (payload.step === "analysis_delta") {
          setStreamText((prev) => prev + (payload.delta ?? ""));
        } else if (payload.step === "analysis_done") {
          if (payload.result) {
            latestResult = payload.result;
            setResult(payload.result);
            queryClient.invalidateQueries({ queryKey: ['quota'] });
            posthog.capture("cv_review_completed", {
              score: payload.result.score,
              analysis_id: payload.analysisId ?? null,
            });
          }
          if (payload.analysisId) {
            latestAnalysisId = payload.analysisId;
            setAnalysisId(payload.analysisId);
            primeQueryCache();
            router.replace(
              `${localePath('/analyze')}?id=${payload.analysisId}`,
              { scroll: false },
            );
          }
          setVisualLoadingDone(true);
          setActiveTab('cv-review');
        } else if (payload.step === "done") {
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
          if (payload.result && latestAnalysisId && user?.id) {
            queryClient.setQueryData(
              ['analysis', latestAnalysisId, user.id],
              { result: payload.result, jobDescription: '' },
            );
          }
          setLoading(false);
        } else if (payload.step === "error") {
          if (payload.code === "QUOTA_EXCEEDED") {
            const mode: PaywallMode = !user
              ? "guest_limit"
              : payload.details?.plan === "free"
                ? "free_cap"
                : "subscriber_cap";
            posthog.capture("paywall_shown", { reason: mode });
            setPaywallState({ mode, monthlyCap: payload.details?.monthlyCap });
            setLoading(false);
            streamingRef.current = false;
            return;
          }
          throw new Error(payload.message || "CV review failed");
        } else {
          setCurrentStep(payload.step);
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "CV review failed";
      setError(message);
      setLoading(false);
      setCurrentStep(null);
      posthog.capture("cv_review_failed", { error: message });
      posthog.captureException(err);
    } finally {
      streamingRef.current = false;
    }
  }

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

    posthog.capture("cv_analysis_submitted", {
      has_github: !!githubUsername,
      has_linkedin: !!liFile,
      has_motivation_letter: !!mlFile || !!mlText,
      is_registered: !!user,
      locale,
    });

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
        // Legacy path — quota errors now flow through the SSE error event
        // below (see step === 'error' with code === 'QUOTA_EXCEEDED'). Kept
        // here in case some upstream proxy still surfaces a 402.
        posthog.capture("paywall_shown", { reason: "global_limit" });
        setPaywallState({ mode: user ? 'free_cap' : 'guest_limit' });
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
        code?: string;
        details?: { plan?: 'free' | 'shortlisted' | 'hired'; monthlyCap?: number };
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
            // Quota was just consumed server-side — refetch so the indicator
            // and the dashboard card reflect the new monthlyUsed / balance.
            queryClient.invalidateQueries({ queryKey: ['quota'] });
            posthog.capture("cv_analysis_completed", {
              score: payload.result.score,
              verdict: payload.result.verdict,
              ats_pass: payload.result.ats_simulation?.would_pass,
              cv_issues: payload.result.audit?.cv?.issues?.length,
              red_flags: payload.result.hidden_red_flags?.length,
              analysis_id: payload.analysisId ?? null,
            });
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
          // Registered users get deep + negotiation off-thread (BullMQ or
          // setImmediate). Keep deepStatus 'pending' so the polling effect
          // picks up the result; a useEffect timeout below flips to 'failed'
          // if nothing has landed after 5 minutes.
          //
          // Anonymous users still get deep inline over this SSE — if no
          // deep_done arrived, the pass actually failed (legacy behavior).
          if (!deepArrived) {
            const isRegistered = !!user && !!latestAnalysisId;
            setDeepStatus(isRegistered ? 'pending' : 'failed');
          }
        } else if (payload.step === "error") {
          // Quota errors render the right paywall variant instead of bubbling
          // up as a generic "Analysis failed" toast. We pick the mode based
          // on the auth state — anonymous users get the signup-flavored
          // guest_limit paywall, free users see upgrade + buy-credits, and
          // subscribers (free_cap shouldn't fire for them, so anything else
          // = subscriber) get the credits-focused variant.
          if (payload.code === "QUOTA_EXCEEDED") {
            const mode: PaywallMode = !user
              ? "guest_limit"
              : payload.details?.plan === "free"
                ? "free_cap"
                : "subscriber_cap";
            posthog.capture("paywall_shown", { reason: mode });
            setPaywallState({
              mode,
              monthlyCap: payload.details?.monthlyCap,
            });
            setLoading(false);
            streamingRef.current = false;
            return;
          }
          throw new Error(payload.message || "Analysis failed");
        } else {
          setCurrentStep(payload.step);
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setLoading(false);
      setCurrentStep(null);
      if (!deepArrived) setDeepStatus('failed');
      posthog.capture("cv_analysis_failed", { error: message, analysis_id: analysisId });
      posthog.captureException(err);
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

  async function shareAnalysis() {
    if (!analysisId || !session?.access_token) return;
    setIsSharing(true);
    try {
      const { token } = await fetch(`${apiUrl}/api/analyze/${analysisId}/share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((r) => r.json());
      const base = `${window.location.origin}${localePath(`/share/${token}`)}`;
      const url = `${base}?utm_source=rejectcheck&utm_medium=share_card&utm_campaign=user_share`;
      setShareToken(token);
      setShareUrl(url);
      posthog.capture("analysis_shared", { analysis_id: analysisId });
    } catch {
      toast.error("Impossible de générer le lien de partage.");
    } finally {
      setIsSharing(false);
    }
  }

  async function handleRewrite() {
    const emailVal = activeSubscription?.email || user?.email;
    if (!analysisId || !emailVal || !session?.access_token) return;

    posthog.capture("cv_rewrite_requested", { analysis_id: analysisId });
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
    posthog.capture("analysis_exported", { format: "markdown", analysis_id: analysisId });
    toast.success("Markdown report downloaded");
  };

  const exportToPdf = async () => {
    if (!result) return;
    setIsExportingPdf(true);
    const names = getExportFilenames(result);
    try {
      await generatePdf(result, names.pdf);
      posthog.capture("analysis_exported", { format: "pdf", analysis_id: analysisId });
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

  const isCvReview = !!result?.cv_quality;

  const consistencyTab = result?.cross_profile_inconsistencies && result.cross_profile_inconsistencies.length > 0
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
    : [];

  const vsJobTabs = result ? ([
    { id: "overview",     label: t.tabs.skillGap },
    { id: "ats",          label: t.tabs.atsFilter,   badge: result.ats_simulation?.would_pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />, badgeClass: result.ats_simulation?.would_pass ? "text-rc-green" : "text-rc-red" },
    { id: "cv-analysis",  label: t.tabs.cvAnalysis,  badge: String(result.audit.cv.issues.length), badgeClass: "text-rc-amber" },
    { id: "signals",      label: t.tabs.signals,     badge: String((isTechRole ? result.audit.github.issues.length : 0) + result.audit.linkedin.issues.length), badgeClass: "text-rc-amber" },
    { id: "flags",        label: t.tabs.redFlags,    badge: String(result.hidden_red_flags.length), badgeClass: "text-rc-red" },
    ...consistencyTab,
    { id: "negotiation",  label: t.tabs.negotiation, badge: "✦", badgeClass: "text-rc-red" },
    { id: "roadmap",      label: t.tabs.roadmap,     badge: null, badgeClass: "" },
    { id: "project",      label: t.tabs.project,     badge: null, badgeClass: "" },
    { id: "improve",      label: t.tabs.improveCv,   badge: "✦", badgeClass: "text-rc-red" },
    ...(AI_INTERVIEW_ENABLED ? [{ id: "interview" as const, label: t.tabs.aiInterview, badge: "✦", badgeClass: "text-rc-red" }] : []),
    { id: "cover-letter", label: t.tabs.coverLetter, badge: "✦", badgeClass: "text-rc-red" },
  ] as const) : [];

  const tabs = vsJobTabs;

  const isFormView = !paywallState && !result && !loading;
  const showDiagnostic = !!(result && visualLoadingDone && !isCvReview);
  const showCvAudit = !!(result && visualLoadingDone && isCvReview);

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen flex flex-col overflow-x-hidden">
      {!showDiagnostic && !showCvAudit && <Navbar activePage="analyze" />}

      {showCvAudit ? (
        <CvAuditResult
          result={result!}
          analysisId={analysisId}
          cvBlobUrl={cvBlobUrl}
          onReset={handleReset}
          onExportMd={exportToMd}
          onShare={analysisId && user ? shareAnalysis : undefined}
          isSharing={isSharing}
          userPlan={(activeSubscription?.plan as "free" | "shortlisted" | "hired") ?? "free"}
          reconstructedCv={reconstructedCv}
          isRewriting={isRewriting}
          onRewrite={handleRewrite}
          email={activeSubscription?.email || user?.email || null}
          accessToken={session?.access_token ?? null}
        />
      ) : showDiagnostic ? (
        <DiagnosticResult
          result={result!}
          analysisId={analysisId}
          cvBlobUrl={cvBlobUrl}
          liBlobUrl={liBlobUrl}
          mlBlobUrl={mlBlobUrl}
          deepStatus={deepStatus}
          isPremium={!!activeSubscription}
          userPlan={(activeSubscription?.plan as "free" | "shortlisted" | "hired") ?? "free"}
          onReset={handleReset}
          onExportMd={exportToMd}
          onExportPdf={exportToPdf}
          isExportingPdf={isExportingPdf}
          onShare={analysisId && user ? shareAnalysis : undefined}
          isSharing={isSharing}
          reconstructedCv={reconstructedCv}
          isRewriting={isRewriting}
          onRewrite={handleRewrite}
          email={activeSubscription?.email || user?.email || null}
          accessToken={session?.access_token ?? null}
          completedSteps={savedAnalysis?.completedSteps}
        />
      ) : (
        <div className={`mx-auto transition-[max-width,width] duration-500 ${result && visualLoadingDone ? "max-w-[1600px] w-[92%] pt-9 pb-[80px] px-5 md:px-[32px]" : "w-full flex-1 flex flex-col"}`}>
          {paywallState ? (
            <PaywallScreen mode={paywallState.mode} monthlyCap={paywallState.monthlyCap} />
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
              <div className="flex-1 flex flex-col min-h-0">
                <UploadForm
                  cvFile={cvFile} setCvFile={setCvFile}
                  liFile={liFile} setLiFile={setLiFile}
                  mlFile={mlFile} setMlFile={setMlFile}
                  mlText={mlText} setMlText={setMlText}
                  jobDescription={jobDescription} setJobDescription={setJobDescription}
                  githubUsername={githubUsername} setGithubUsername={setGithubUsername}
                  portfolioUrl={portfolioUrl} setPortfolioUrl={setPortfolioUrl}
                  onSubmit={(e) => {
                    const useReviewMode = jobDescription.trim().length === 0;
                    setAnalyzeMode(useReviewMode ? 'cv-review' : 'vs-job');
                    return useReviewMode ? handleCvReviewSubmit(e) : handleSubmit(e);
                  }}
                  loading={false} error={error}
                  savedCvFiles={savedCvs}
                  savedLinkedinUrl={profile?.linkedinUrl ?? undefined}
                  savedPortfolioUrl={profile?.portfolioUrl ?? undefined}
                  roleType={profile?.roleType ?? null}
                  roleLabel={profile?.roleType ? t.onboarding.roles[profile.roleType] : null}
                />
              </div>
            )
          ) : (
            /* Only cv-review results reach this branch (vs-job is handled by DiagnosticResult above) */
            <div>
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

              <CvReviewTab
                result={result}
                actions={<>
                  <button
                    onClick={exportToMd}
                    className="flex items-center gap-1.5 font-mono text-[11px] text-rc-hint hover:text-rc-text transition-colors px-3 py-1.5 border border-rc-border bg-rc-surface uppercase tracking-wider"
                  >
                    <Download size={12} />
                    .md
                  </button>
                  {analysisId && user && (
                    <button
                      onClick={shareAnalysis}
                      disabled={isSharing}
                      className="flex items-center gap-1.5 font-mono text-[11px] text-rc-hint hover:text-rc-text transition-colors px-3 py-1.5 border border-rc-border bg-rc-surface uppercase tracking-wider disabled:opacity-50"
                    >
                      <Share2 size={12} />
                      {isSharing ? "…" : "Share"}
                    </button>
                  )}
                </>}
              />

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
      )}

      {shareToken && shareUrl && result && (
        <ShareModal
          token={shareToken}
          shareUrl={shareUrl}
          displayName={profile?.displayName ?? user?.email?.split("@")[0] ?? "You"}
          isCvReview={!!result.cv_quality}
          score={result.cv_quality ? result.cv_quality.overall : result.score}
          jobLabel={null}
          company={null}
          onClose={() => { setShareToken(null); setShareUrl(null); }}
        />
      )}
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
