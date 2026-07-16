"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { consumePendingCv } from "../../../../lib/pending-cv";
import { setPendingClaim } from "../../../../lib/pending-claim";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import type { AnalysisResult } from "../../../components/types";

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
import { createClient } from "../../../../lib/supabase";
import { useSubscription, useAnalysis, useProfile, useSavedCvs, useQuota } from "../../../../lib/queries";
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

// Merge one streamed `section` event (backend tool-schema key + already
// plan-shaped value) into the partial result being built during streaming.
// Keys mirror the single-pass tool schema; `analysis_done` later overwrites
// the whole object with the fully-mapped, shaped result, so this only needs to
// be good enough to render progressively.
function mergeSection(
  prev: AnalysisResult | null,
  key: string,
  value: unknown,
): AnalysisResult {
  const r: Record<string, unknown> = { ...(prev ?? {}) } as Record<string, unknown>;
  const v = value as never;
  const audit = () =>
    ({ ...(r.audit as Record<string, unknown> | undefined) } as Record<string, unknown>);
  switch (key) {
    case "overall": {
      const o = value as { score: number; verdict: string; confidence: unknown };
      r.score = o.score;
      r.verdict = o.verdict;
      r.confidence = o.confidence;
      // The streamed score is the model's PROVISIONAL guess. The backend anchors
      // it into the composite in the final payload (analysis_done / done), which
      // replaces this whole object and drops the flag. Until then, the RiskMeter
      // shows a "computing" state instead of a number that would jump.
      r.__scorePending = true;
      break;
    }
    case "breakdown":
      r.breakdown = v;
      break;
    case "ats_simulation": {
      const existing = (r.ats_simulation ?? {}) as Record<string, unknown>;
      r.ats_simulation = { ...(value as object), critical_missing_keywords: existing.critical_missing_keywords };
      break;
    }
    case "ats_critical_missing_keywords": {
      const existing = (r.ats_simulation ?? {}) as Record<string, unknown>;
      r.ats_simulation = { ...existing, critical_missing_keywords: value };
      break;
    }
    case "audit_cv": { const a = audit(); a.cv = v; r.audit = a; break; }
    case "audit_github": { const a = audit(); a.github = v; r.audit = a; break; }
    case "audit_linkedin": { const a = audit(); a.linkedin = v; r.audit = a; break; }
    case "audit_jd_match": { const a = audit(); a.jd_match = v; r.audit = a; break; }
    default:
      // Direct 1:1 keys: job_details, seniority_analysis, technical_analysis,
      // cv_tone, hidden_red_flags, bullet_reviews, challenge_analysis,
      // highlight_terms, project_recommendation.
      r[key] = value;
  }
  return r as AnalysisResult;
}

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

  // Owner "audit mode": lean teaser audit for strangers (Reddit) that
  // auto-mints a public share link. `isOwner` (from a PUBLIC env list) only
  // gates the UI toggle — the backend re-checks OWNER_EMAILS from the JWT, so a
  // non-owner flipping this gets a normal analysis. Defaults on from ?audit=1.
  const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isOwner = !!user?.email && ownerEmails.includes(user.email.toLowerCase());
  const [auditMode, setAuditMode] = useState(false);
  useEffect(() => {
    if (isOwner && searchParams.get("audit") === "1") setAuditMode(true);
  }, [isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  // True from submit until the SSE `done` event: the single pass is still
  // streaming sections. Drives per-section skeletons in the report.
  const [streaming, setStreaming] = useState(false);
  // While streaming, the actionable content (fixes / project) may not have
  // arrived yet → show its skeleton ("pending"). Once the stream ends (or the
  // content is already present, e.g. a saved analysis) it reads "ready".
  const actionablePresent =
    !!result?.project_recommendation ||
    (result?.audit?.cv?.issues ?? []).some(
      (i: { fix?: unknown }) => !!i.fix,
    ) ||
    !!result?.premium_locked; // free result: gated, but generation is complete
  const deepStatus: "ready" | "pending" = streaming && !actionablePresent
    ? "pending"
    : "ready";
  const [error, setError] = useState<string | null>(null);
  // True only on a runtime analysis failure (stream/network) — drives the
  // LoadingScreen error card + retry. Validation errors stay in the upload form.
  const [analysisFailed, setAnalysisFailed] = useState(false);
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
  const [liText, setLiText] = useState<string | null>(null);
  const [coverLetterText, setCoverLetterText] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  // claimToken of the current logged-out analysis — lets anonymous users share
  // (and the result attach to their account if they sign up later).
  const [anonClaimToken, setAnonClaimToken] = useState<string | null>(null);
  const shareToastShownRef = useRef<number | null>(null);

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

  // If the cache was primed by an old primeQueryCache (only result+jobDescription),
  // it won't have text fields. Detect and purge so useAnalysis re-fetches fresh.
  useEffect(() => {
    if (!urlId || !user?.id || streamingRef.current) return;
    queryClient.removeQueries({ queryKey: ['analysis', urlId] });
  }, [urlId, user?.id]);

  const { data: subscriptionData } = useSubscription();
  const { data: quota } = useQuota();
  const { data: profile } = useProfile();
  const { data: savedCvs } = useSavedCvs();

  // Server is the source of truth for entitlement. The localStorage cache
  // (activeSubscription) only bridges the initial query-load flash, and only
  // for signed-in users — it is never trusted on its own.
  const liveActivePlan: 'free' | 'shortlisted' | 'hired' =
    subscriptionData !== undefined
      ? subscriptionData?.status === 'active'
        ? (subscriptionData.plan as 'free' | 'shortlisted' | 'hired')
        : 'free'
      : user
        ? ((activeSubscription?.plan as 'free' | 'shortlisted' | 'hired') ?? 'free')
        : 'free';
  const isPremium = liveActivePlan === 'shortlisted' || liveActivePlan === 'hired';
  const userPlan = liveActivePlan;
  const isHiredTier = liveActivePlan === 'hired';
  // Poll the saved analysis only for the hired-tier negotiation, which is
  // still generated asynchronously on demand.
  const shouldPoll =
    isHiredTier && !!result && !result.negotiation_analysis;

  const { data: savedAnalysis, isLoading: loadingById, isError: isAnalysisError, error: analysisError } = useAnalysis(
    // Poll by the analysisId STATE (set at analysis_done) with urlId as fallback:
    // on a FRESH analysis the URL `?id=` is added via router.replace but
    // useSearchParams doesn't re-read it reactively, so urlId stays null and the
    // deep poll would never run (infinite skeleton). analysisId is reliable.
    analysisId ?? urlId,
    { pollIntervalMs: shouldPoll ? 5000 : undefined },
  );
  // One-time "unlock this CV" purchase: the CV rewrite is available if the user
  // is subscribed OR this specific analysis was unlocked (€2.99 one-off).
  const premiumUnlocked = savedAnalysis?.premiumUnlocked ?? false;
  const canUseRewrite = isPremium || premiumUnlocked;

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
        } else {
          localStorage.removeItem('rc_subscription');
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // Keep the localStorage cache in sync with the server truth — and clear it
    // when the server says the user is not on an active plan.
    if (subscriptionData === undefined || !user?.email) return;
    if (subscriptionData?.status === 'active' && subscriptionData.currentPeriodEnd) {
      const sub: StoredSubscription = {
        plan: subscriptionData.plan,
        email: user.email,
        expiry: new Date(subscriptionData.currentPeriodEnd).getTime(),
      };
      localStorage.setItem('rc_subscription', JSON.stringify(sub));
      setActiveSubscription(sub);
      setPaywallState(null);
    } else {
      localStorage.removeItem('rc_subscription');
      setActiveSubscription(null);
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
    setReconstructedCv(
      savedAnalysis.rewrite?.reconstructed_cv
        ?? savedAnalysis.cvTextFormatted
        ?? savedAnalysis.cvText
        ?? null,
    );
    setLiText(savedAnalysis.linkedinTextFormatted ?? savedAnalysis.linkedinText ?? null);
    setCoverLetterText(savedAnalysis.motivationLetter ?? savedAnalysis.coverLetter ?? null);
    if (savedAnalysis.cvFileUrl) setCvBlobUrl(savedAnalysis.cvFileUrl);
    if (savedAnalysis.liFileUrl) setLiBlobUrl(savedAnalysis.liFileUrl);
    if (savedAnalysis.mlFileUrl) setMlBlobUrl(savedAnalysis.mlFileUrl);
    const isCvReviewResult = !!savedAnalysis.result?.cv_quality;
    if (isCvReviewResult) setAnalyzeMode('cv-review');
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
      toast(t.toasts.goodProfileTitle, {
        description: t.toasts.goodProfileDesc,
        action: { label: t.toasts.share, onClick: shareAnalysis },
        duration: 8000,
      });
    }, 3500);
    return () => clearTimeout(timer);
  }, [result, visualLoadingDone, analysisId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCvReviewSubmit(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    if (!cvFile) return;

    const formData = new FormData();
    formData.append("cv", cvFile);
    if (liFile) formData.append("linkedin", liFile);
    if (githubUsername) formData.append("githubUsername", githubUsername);
    formData.append("locale", locale);
    if (auditMode) formData.append("auditMode", "true");
    // Identity is derived server-side from the JWT — we send the token, not email/isRegistered.

    posthog.capture("cv_review_submitted", {
      has_github: !!githubUsername,
      has_linkedin: !!liFile,
      is_registered: !!user,
      locale,
    });

    setLoading(true);
    setError(null);
    setAnalysisFailed(false);
    setCurrentStep(null);
    setStreamText("");
    streamingRef.current = true;

    try {
      const res = await fetch(`${apiUrl}/api/analyze/cv-review`, {
        method: "POST",
        body: formData,
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (res.status === 402) {
        posthog.capture("paywall_shown", { reason: "global_limit" });
        setPaywallState({ mode: user ? 'free_cap' : 'guest_limit' });
        setLoading(false);
        return;
      }

      type CvReviewPayload = {
        step: string;
        delta?: string;
        section?: string;
        key?: string;
        value?: unknown;
        token?: string;
        result?: AnalysisResult;
        analysisId?: number | null;
        claimToken?: string | null;
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
            { _primed: true, result: latestResult, jobDescription: '' },
          );
        }
      };

      await consumeSSE<CvReviewPayload>(res, (payload) => {
        if (payload.step === "generating") {
          if (payload.section) setStreamText((prev) => prev + `"${payload.section}"`);
        } else if (payload.step === "section") {
          if (payload.key) setStreamText((prev) => prev + `"${payload.key}"`);
        } else if (payload.step === "share" && payload.token) {
          openAuditShare(payload.token);
        } else if (payload.step === "analysis_done") {
          // Anonymous run: stash the claimToken so it attaches to the account
          // if the user signs up from the result screen (see AuthProvider).
          if (payload.claimToken && !user) {
            setPendingClaim(payload.claimToken);
            setAnonClaimToken(payload.claimToken);
          }
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
      setAnalysisFailed(true);
      posthog.capture("cv_review_failed", { error: message });
      posthog.captureException(err);
    } finally {
      streamingRef.current = false;
    }
  }

  async function handleSubmit(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    if (!cvFile || !jobDescription.trim()) return;

    const formData = new FormData();
    formData.append("cv", cvFile);
    if (liFile) formData.append("linkedin", liFile);
    if (mlFile) formData.append("motivationLetter", mlFile);
    if (mlText) formData.append("motivationLetterText", mlText);
    if (githubUsername) formData.append("githubUsername", githubUsername);
    formData.append("jobDescription", jobDescription);
    formData.append("locale", locale);
    if (auditMode) formData.append("auditMode", "true");
    // Identity is derived server-side from the JWT — we send the token, not email/isRegistered.

    posthog.capture("cv_analysis_submitted", {
      has_github: !!githubUsername,
      has_linkedin: !!liFile,
      has_motivation_letter: !!mlFile || !!mlText,
      is_registered: !!user,
      locale,
    });

    setLoading(true);
    setError(null);
    setAnalysisFailed(false);
    setCurrentStep(null);
    setStreamText("");
    setResult(null);
    setVisualLoadingDone(false);
    setStreaming(true);
    streamingRef.current = true;

    try {
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: formData,
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

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
        /** Typed section streaming: `generating` carries `section`, the
         * completed value arrives as `section` with `key` + `value`. */
        section?: string;
        key?: string;
        value?: unknown;
        token?: string;
        result?: AnalysisResult;
        analysisId?: number | null;
        claimToken?: string | null;
        negotiation?: AnalysisResult["negotiation_analysis"];
        cvTextFormatted?: string | null;
        linkedinTextFormatted?: string | null;
        motivationLetterText?: string | null;
        message?: string;
        code?: string;
        details?: { plan?: 'free' | 'shortlisted' | 'hired'; monthlyCap?: number };
      };

      // Tracks the latest known result during the stream so we can keep the
      // queryClient cache in sync with each SSE event. Closure-captured
      // because React state updates are async and we need the freshest copy.
      let latestResult: AnalysisResult | null = null;
      let latestAnalysisId: number | null = null;

      let latestCvTextFormatted: string | null = null;
      let latestLinkedinTextFormatted: string | null = null;
      let latestMotivationLetterText: string | null = null;

      const primeQueryCache = () => {
        if (latestAnalysisId && latestResult && user?.id) {
          queryClient.setQueryData(
            ['analysis', latestAnalysisId, user.id],
            {
              result: latestResult,
              jobDescription,
              cvTextFormatted: latestCvTextFormatted,
              linkedinTextFormatted: latestLinkedinTextFormatted,
              motivationLetter: latestMotivationLetterText,
            },
          );
        }
      };

      await consumeSSE<AnalyzePayload>(res, (payload) => {
        if (payload.step === "generating") {
          // Keep the pre-score LoadingScreen sub-steps animating: it detects
          // progress by scanning streamText for `"<key>"` tokens.
          if (payload.section) setStreamText((prev) => prev + `"${payload.section}"`);
        } else if (payload.step === "section") {
          if (!payload.key) return;
          setStreamText((prev) => prev + `"${payload.key}"`);
          setResult((prev) => {
            const merged = mergeSection(prev, payload.key!, payload.value);
            latestResult = merged;
            return merged;
          });
          // Flip to the report as soon as the score lands — the rest of the
          // sections fill their skeletons progressively.
          if (payload.key === "overall") setVisualLoadingDone(true);
        } else if (payload.step === "analysis_done") {
          // Anonymous run: stash the claimToken so it attaches to the account
          // if the user signs up from the result screen (see AuthProvider).
          if (payload.claimToken && !user) {
            setPendingClaim(payload.claimToken);
            setAnonClaimToken(payload.claimToken);
          }
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
          if (payload.cvTextFormatted) { setReconstructedCv(payload.cvTextFormatted); latestCvTextFormatted = payload.cvTextFormatted; }
          if (payload.linkedinTextFormatted) { setLiText(payload.linkedinTextFormatted); latestLinkedinTextFormatted = payload.linkedinTextFormatted; }
          if (payload.motivationLetterText) { setCoverLetterText(payload.motivationLetterText); latestMotivationLetterText = payload.motivationLetterText; }
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
            // Persist uploaded files to Supabase Storage for authenticated users.
            if (user?.id && session?.access_token) {
              uploadAnalysisFiles(payload.analysisId, user.id, session.access_token).catch(() => {});
            }
          }
          setVisualLoadingDone(true);
        } else if (payload.step === "share" && payload.token) {
          openAuditShare(payload.token);
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
          // Stream finished → the report is complete (skeletons resolve).
          setStreaming(false);
          // The full shaped result is authoritative — overwrite the object
          // assembled from streamed sections.
          if (payload.result) {
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
            setStreaming(false);
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
      setStreaming(false);
      setCurrentStep(null);
      setAnalysisFailed(true);
      posthog.capture("cv_analysis_failed", { error: message, analysis_id: analysisId });
      posthog.captureException(err);
    } finally {
      streamingRef.current = false;
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setAnalysisFailed(false);
    setCurrentStep(null);
    setJobDescription("");
    setActiveTab("overview");
    setCheckedKeywords(new Set());
    setVisualLoadingDone(false);
    setAnalysisId(null);
    setAnonClaimToken(null);
    setShareToken(null);
    setShareUrl(null);
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

  // Owner audit mode: the backend streamed a `share` token — build the public
  // URL and open the ShareModal so the link can be copied for the Reddit DM.
  function openAuditShare(token: string) {
    const base = `${window.location.origin}${localePath(`/share/${token}`)}`;
    setShareToken(token);
    setShareUrl(`${base}?utm_source=rejectcheck&utm_medium=share_card&utm_campaign=audit`);
    toast.success(t.toasts?.shareLinkReady ?? "Public link ready — copy it below.");
  }

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
      toast.error(t.toasts.shareLinkFailed);
    } finally {
      setIsSharing(false);
    }
  }

  // Logged-out share: mint the public token from the analysis's claimToken
  // (no auth). This is the viral entry point — most first-time users are
  // anonymous when they see their shocking risk score.
  async function shareAnalysisAnonymous() {
    if (!anonClaimToken) return;
    setIsSharing(true);
    try {
      const res = await fetch(`${apiUrl}/api/analyze/share-anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimToken: anonClaimToken }),
      });
      if (!res.ok) throw new Error("share failed");
      const { token } = await res.json();
      const base = `${window.location.origin}${localePath(`/share/${token}`)}`;
      const url = `${base}?utm_source=rejectcheck&utm_medium=share_card&utm_campaign=anon_share`;
      setShareToken(token);
      setShareUrl(url);
      posthog.capture("analysis_shared", { anonymous: true });
    } catch {
      toast.error(t.toasts.shareLinkFailed);
    } finally {
      setIsSharing(false);
    }
  }

  // One-time unlock of the CV rewrite for THIS analysis (€2.99, no subscription).
  // Logged-out users are sent to signup first — their anonymous analysis attaches
  // to the new account (pending-claim, see AuthProvider), then they can unlock it.
  const [isUnlocking, setIsUnlocking] = useState(false);
  async function unlockRewrite() {
    if (!analysisId) return;
    posthog.capture("rewrite_unlock_clicked", { analysis_id: analysisId, logged_in: !!user });
    if (!user || !session?.access_token) {
      if (anonClaimToken) setPendingClaim(anonClaimToken);
      toast.message(t.toasts.rewriteSignupPrompt);
      router.push(localePath("/login"));
      return;
    }
    setIsUnlocking(true);
    try {
      const res = await fetch(`${apiUrl}/api/stripe/analysis-unlock/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ analysisId, locale }),
      });
      if (!res.ok) throw new Error("checkout failed");
      const { url } = await res.json();
      if (url) window.location.href = url;
      else throw new Error("no url");
    } catch {
      toast.error(t.toasts.paymentFailed);
      setIsUnlocking(false);
    }
  }

  // Return from a successful unlock checkout → the analysis reloads (by id) with
  // premiumUnlocked=true, so the rewrite tab is already open. Just confirm + tidy.
  const unlockToastShownRef = useRef(false);
  useEffect(() => {
    if (unlockToastShownRef.current) return;
    if (searchParams.get("unlock_success") === "true") {
      unlockToastShownRef.current = true;
      toast.success(t.toasts.rewriteUnlocked);
      posthog.capture("rewrite_unlock_succeeded");
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete("unlock_success");
      router.replace(`${localePath("/analyze")}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRewrite() {
    const emailVal = user?.email;
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
        toast.error(t.toasts.rewriteFailed);
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
          toast.error(payload.message || t.toasts.rewriteFailedShort);
        }
      });

      if (received) {
        setReconstructedCv(reconstructedCvFromStream);
      } else {
        toast.error(t.toasts.rewriteNoResult);
      }
    } catch (err) {
      console.error("[Rewrite] failed:", err);
      toast.error(t.toasts.rewriteFailed);
    } finally {
      setIsRewriting(false);
    }
  }

  async function uploadAnalysisFiles(id: number, userId: string, token: string) {
    const supabase = createClient();
    const uploads: { key: "cvFileUrl" | "liFileUrl" | "mlFileUrl"; file: File; path: string }[] = [];
    if (cvFile)  uploads.push({ key: "cvFileUrl",  file: cvFile,  path: `${userId}/analyses/${id}/cv.pdf` });
    if (liFile)  uploads.push({ key: "liFileUrl",  file: liFile,  path: `${userId}/analyses/${id}/linkedin.pdf` });
    if (mlFile)  uploads.push({ key: "mlFileUrl",  file: mlFile,  path: `${userId}/analyses/${id}/cover.pdf` });
    if (!uploads.length) return;

    const urls: Partial<Record<"cvFileUrl" | "liFileUrl" | "mlFileUrl", string>> = {};
    await Promise.all(uploads.map(async ({ key, file, path }) => {
      const { error } = await supabase.storage.from("user-profiles").upload(path, file, { upsert: true, cacheControl: "3600" });
      if (error) { console.error(`[upload] ${key}:`, error.message); return; }
      const { data: { publicUrl } } = supabase.storage.from("user-profiles").getPublicUrl(path);
      urls[key] = publicUrl;
    }));

    if (!Object.keys(urls).length) return;
    await fetch(`${apiUrl}/api/analyze/${id}/files`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(urls),
    });
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
    toast.success(t.toasts.markdownDownloaded);
  };

  const exportToPdf = async () => {
    if (!result) return;
    setIsExportingPdf(true);
    const names = getExportFilenames(result);
    try {
      await generatePdf(result, names.pdf);
      posthog.capture("analysis_exported", { format: "pdf", analysis_id: analysisId });
      toast.success(t.toasts.pdfGenerated);
    } catch (err) {
      console.error("PDF Export failed:", err);
      toast.error(t.toasts.pdfFailed);
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
          liBlobUrl={liBlobUrl}
          liText={liText}
          onReset={handleReset}
          onExportMd={exportToMd}
          onShare={user && analysisId ? shareAnalysis : !user && anonClaimToken ? shareAnalysisAnonymous : undefined}
          isSharing={isSharing}
          userPlan={userPlan}
          reconstructedCv={reconstructedCv}
          isRewriting={isRewriting}
          onRewrite={handleRewrite}
          email={user?.email || null}
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
          isAnonymous={!user}
          isPremium={isPremium}
          userPlan={userPlan}
          premiumUnlocked={premiumUnlocked}
          onUnlockRewrite={unlockRewrite}
          isUnlocking={isUnlocking}
          onReset={handleReset}
          onExportMd={exportToMd}
          onExportPdf={exportToPdf}
          isExportingPdf={isExportingPdf}
          onShare={user && analysisId ? shareAnalysis : !user && anonClaimToken ? shareAnalysisAnonymous : undefined}
          isSharing={isSharing}
          reconstructedCv={reconstructedCv}
          liText={liText}
          coverLetterText={coverLetterText}
          isRewriting={isRewriting}
          onRewrite={handleRewrite}
          email={user?.email || null}
          accessToken={session?.access_token ?? null}
          completedSteps={savedAnalysis?.completedSteps}
          cvTextFormatted={savedAnalysis?.cvTextFormatted ?? null}
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
                isHired={isHiredTier}
                onFinished={() => setVisualLoadingDone(true)}
              />
            ) : analysisFailed ? (
              <LoadingScreen
                currentStep={currentStep}
                streamText={streamText}
                hasGithub={githubUsername.trim().length > 0}
                hasLinkedin={liFile !== null}
                hasML={mlFile !== null || mlText.trim().length > 0}
                isHired={isHiredTier}
                errored
                onRetry={() => { (analyzeMode === 'cv-review' ? handleCvReviewSubmit : handleSubmit)(); }}
              />
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {isOwner && (
                  <label className="mx-auto mb-3 flex items-center gap-2 text-[12px] font-mono text-rc-muted cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={auditMode}
                      onChange={(e) => setAuditMode(e.target.checked)}
                      className="accent-rc-red"
                    />
                    Audit mode — lean teaser + public link (no quota, no portfolio)
                  </label>
                )}
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
                  {((user && analysisId) || (!user && anonClaimToken)) && (
                    <button
                      onClick={user ? shareAnalysis : shareAnalysisAnonymous}
                      disabled={isSharing}
                      className="flex items-center gap-1.5 font-mono text-[11px] text-rc-hint hover:text-rc-text transition-colors px-3 py-1.5 border border-rc-border bg-rc-surface uppercase tracking-wider disabled:opacity-50"
                    >
                      <Share2 size={12} />
                      {isSharing ? "…" : t.toasts.share}
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
