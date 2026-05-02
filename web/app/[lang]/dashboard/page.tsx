"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/auth";
import { useSubscription, useAnalysisHistory, useInterviewHistory, useApplications, useInterviewsByAnalysis } from "../../../lib/queries";
import { useDeleteAnalysis, useCreateApplication, useUpdateApplication, useDeleteApplication } from "../../../lib/mutations";
import { ApplicationsTab } from "../../components/tabs/ApplicationsTab";
import { useLanguage } from "../../../context/language";
import {
  FileText,
  ChevronRight,
  LayoutGrid,
  Trash2,
  ArrowRight,
  Download,
  Mic,
  Plus,
} from "lucide-react";
import { ExportModal } from "../../components/ExportModal";
import { SuccessModal } from "../../components/SuccessModal";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Navbar } from "../../components/Navbar";
import { XpPanel } from "./components/XpPanel";
import { RewardsList } from "./components/RewardsList";

type HistoryItem = {
  id: number;
  jobDescription: string;
  jobLabel?: string;
  company?: string;
  createdAt: string;
  result: any;
};

type DashboardTab = "home" | "analyses" | "applications";

const VALID_DASHBOARD_TABS: DashboardTab[] = ["home", "analyses", "applications"];

const EVO_PALETTE = ["#D94040", "#4a7c1f", "#b86800", "#185FA5", "#888780"] as const;

function EvolutionTooltip({
  active, payload,
  evoGroups, evoLabels,
}: {
  active?: boolean;
  payload?: any[];
  evoGroups: Map<string, Array<{ date: Date; score: number }>>;
  evoLabels: Map<string, { title: string; company: string }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[rgba(0,0,0,0.12)] rounded-xl p-3 shadow-lg space-y-2.5 min-w-[200px]">
      {payload.map((entry: any, i: number) => {
        const key = entry.dataKey as string;
        const meta = evoLabels.get(key);
        const pts = evoGroups.get(key) ?? [];
        const thisDate = new Date(entry.payload.dateRaw as number);
        const idx = pts.findIndex(p => p.date.toDateString() === thisDate.toDateString());
        const prev = idx > 0 ? pts[idx - 1] : null;
        const delta = prev !== null ? (entry.value as number) - prev.score : null;
        return (
          <div key={i} className="space-y-0.5">
            <p className="font-bold text-[11px] text-rc-text leading-tight">
              {meta?.title}
              {meta?.company && <span className="font-normal text-rc-hint"> · {meta.company}</span>}
            </p>
            <p className="font-mono text-[10px] text-rc-hint">{entry.payload.dateLabel}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] text-rc-text">
                Rejection risk: <span style={{ color: entry.color }} className="font-bold">{entry.value}%</span>
              </span>
              {delta !== null && (
                <span className={`font-mono text-[10px] font-bold ${delta < 0 ? "text-rc-green" : "text-rc-red"}`}>
                  {delta < 0 ? `↓ from ${prev!.score}%` : `↑ from ${prev!.score}%`}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnalysisRowWithInterviews({
  item,
  isExpanded,
  onToggle,
  onDelete,
  onExport,
  isDeleting,
  getScoreColor,
  localePath,
  t,
}: {
  item: HistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  onExport: (e: React.MouseEvent, item: HistoryItem) => void;
  isDeleting: number | null;
  getScoreColor: (score: number) => string;
  localePath: (p: string) => string;
  t: any;
}) {
  const { data: interviewsData } = useInterviewsByAnalysis(item.id);
  const interviews = interviewsData?.data ?? [];

  const label = item.jobLabel || item.result?.job_details?.title || "Developer";
  const company = item.company ?? item.result?.job_details?.company ?? null;
  const score = item.result?.score ?? 0;
  const scoreClass = getScoreColor(score);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-colors ${isExpanded ? "border-rc-red/20" : "border-[rgba(0,0,0,0.08)]"}`}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#faf9f7] transition-colors"
        onClick={onToggle}
      >
        <div className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center font-black text-[11px] ${scoreClass}`}>
          {score}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[12px] text-rc-text truncate">{label}</p>
          {company && <p className="font-mono text-[9px] text-rc-hint truncate">{company}</p>}
        </div>

        {/* Interview chip */}
        {interviewsData !== undefined && interviewsData.total > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 font-mono text-[10px] text-violet-600 shrink-0">
            <Mic className="w-2.5 h-2.5" />
            {interviewsData.total}
          </span>
        ) : (
          <Link
            href={localePath(`/analyze?id=${item.id}&tab=interview`)}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rc-red/5 border border-rc-red/20 font-mono text-[10px] text-rc-red no-underline hover:bg-rc-red/10 transition-colors shrink-0"
          >
            <Plus className="w-2.5 h-2.5" /> Interview
          </Link>
        )}

        <p className="font-mono text-[9px] text-rc-hint shrink-0">
          {new Date(item.createdAt).toLocaleDateString()}
        </p>

        {/* Expand toggle */}
        <ChevronRight
          className={`w-3.5 h-3.5 text-rc-hint shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        />

        {/* Actions menu */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => onExport(e, item)}
            className="p-1 rounded hover:bg-[#f0ede9] transition-colors"
          >
            <Download className="w-3 h-3 text-rc-hint" />
          </button>
          <button
            onClick={(e) => onDelete(e, item.id)}
            disabled={isDeleting === item.id}
            className="p-1 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-rc-hint hover:text-rc-red" />
          </button>
        </div>
      </div>

      {/* Expanded interviews panel */}
      {isExpanded && (
        <div className="border-t border-[rgba(0,0,0,0.06)] bg-[#faf9f7] px-4 py-3">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold mb-3">
            {t.account.interviews.nestedLabel}
          </p>

          {interviews.length === 0 ? (
            <p className="font-mono text-[11px] text-rc-hint py-2">{t.account.interviews.noInterviews}</p>
          ) : (
            <div className="flex flex-col gap-1 mb-3">
              {interviews.map((iv: any, idx: number) => {
                const scoreColor = iv.globalScore === null ? "text-rc-hint"
                  : iv.globalScore >= 7 ? "text-rc-green"
                  : iv.globalScore >= 4 ? "text-rc-amber"
                  : "text-rc-red";
                return (
                  <div key={iv.id} className="flex items-center gap-3 py-1.5 border-b border-[rgba(0,0,0,0.04)] last:border-0">
                    <span className={`font-black text-[13px] leading-none w-10 shrink-0 ${scoreColor}`}>
                      {iv.globalScore !== null ? `${iv.globalScore}/10` : "-"}
                    </span>
                    <span className="font-mono text-[11px] text-rc-muted flex-1">
                      {t.account.interviews.interviewN.replace("{n}", String(interviews.length - idx))}
                    </span>
                    <span className="font-mono text-[10px] text-rc-hint">
                      {new Date(iv.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={localePath(`/analyze?id=${item.id}&interviewId=${iv.id}`)}
                      className="font-mono text-[10px] text-rc-red no-underline hover:underline"
                    >
                      {t.account.interviews.viewDetails}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link
              href={localePath(`/analyze?id=${item.id}&tab=interview`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rc-red text-white rounded-lg font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90 transition-opacity"
            >
              <Mic className="w-3 h-3" /> {t.account.interviews.newInterview}
            </Link>
            <p className="font-mono text-[10px] text-rc-hint">{t.account.interviews.newInterviewHint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, localePath } = useLanguage();

  const { user, session, loading: authLoading } = useAuth();

  const [analysisPage, setAnalysisPage] = useState(1);
  const [analysisSearch, setAnalysisSearch] = useState("");
  const [evolutionPeriod, setEvolutionPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<number | null>(null);

  const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
    { id: "home",         label: t.account.tabs.home },
    { id: "analyses",     label: t.account.tabs.analyses },
    { id: "applications", label: t.account.tabs.applications },
  ];

  const { data: subscription } = useSubscription();
  const { data: analysisData, isLoading: loadingHistory } = useAnalysisHistory(analysisPage);
  const { data: interviewSummary } = useInterviewHistory(1);
  const { data: summaryData } = useAnalysisHistory(1);
  const { data: applicationsData, isLoading: applicationsLoading } = useApplications();

  const history = analysisData?.data ?? [];
  const totalInterviews = interviewSummary?.total ?? 0;
  const applications = applicationsData ?? [];

  const deleteAnalysis = useDeleteAnalysis();
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  const [exportItem, setExportItem] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const tab = searchParams.get("tab");
    // Backward compat: old URLs with overview/interviews redirect to home/analyses
    if (tab === "overview") return "home";
    if (tab === "interviews") return "analyses";
    return VALID_DASHBOARD_TABS.includes(tab as DashboardTab)
      ? (tab as DashboardTab)
      : "home";
  });

  function handleTabChange(tab: DashboardTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(localePath("/login"));
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!subscription || !user?.email) return;
    if (subscription.status === "active") {
      localStorage.setItem("rc_subscription", JSON.stringify({
        plan: subscription.plan,
        email: user.email,
        expiry: new Date(subscription.currentPeriodEnd).getTime(),
      }));
    }
  }, [subscription, user]);

  useEffect(() => { setAnalysisPage(1); }, [analysisSearch]);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t.account.deleteConfirm)) return;

    setIsDeleting(id);
    try {
      await deleteAnalysis.mutateAsync(id);
      setAnalysisPage(1);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(null);
    }
  }

  function handleOpenExport(e: React.MouseEvent, item: HistoryItem) {
    e.preventDefault();
    e.stopPropagation();
    setExportItem(item);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">{t.common.loading}</span>
      </div>
    );
  }

  if (!user) return null;

  const isActive = subscription?.status === "active";

  const totalAnalyses = analysisData?.total ?? 0;
  const totalAnalysisPages = Math.ceil(totalAnalyses / 10);

  const summaryPage1 = summaryData?.data ?? [];
  const overviewAvgRisk = summaryPage1.length > 0
    ? Math.round(summaryPage1.reduce((acc, curr) => acc + (curr.result?.score || 0), 0) / summaryPage1.length)
    : null;

  const getScoreColor = (score: number) => {
    if (score < 40) return "border-rc-green/30 text-rc-green bg-rc-green/5";
    if (score < 70) return "border-rc-amber/40 text-rc-amber bg-rc-amber/5";
    return "border-rc-red/30 text-rc-red bg-rc-red/5";
  };

  // Home tab - stats
  const activeApplications = applications.filter(
    (a) => a.status === "applied" || a.status === "interviewing"
  );

  // Compute avg interview score from page 1 of interview history
  const interviewPage1 = interviewSummary?.data ?? [];
  const scoredItems = interviewPage1.filter((i) => i.globalScore !== null);
  const avgInterviewScore = scoredItems.length > 0
    ? Math.round(scoredItems.reduce((acc, i) => acc + (i.globalScore ?? 0), 0) / scoredItems.length)
    : null;

  // "À traiter" items
  const now = Date.now();
  const STALE_DAYS = 14;
  const staleApplications = applications.filter((a) => {
    if (a.status !== "applied") return false;
    const appliedMs = new Date(a.appliedAt).getTime();
    return now - appliedMs > STALE_DAYS * 86400000;
  });
  const interviewingApps = applications.filter((a) => a.status === "interviewing");
  const newUnviewedAnalyses = summaryPage1.filter((item) => {
    const createdMs = new Date(item.createdAt).getTime();
    return now - createdMs < 24 * 3600000;
  });

  // Recent analyses (up to 4 most recent from page 1)
  const recentAnalyses = summaryPage1.slice(0, 4);

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans flex flex-col items-center">
      <Navbar activePage="dashboard" />

      <div className="max-w-[1200px] w-full px-5 pt-0 pb-12">

        {/* Tab navigation bar */}
        <div className="border-b border-rc-border mb-8">
          <div className="flex overflow-x-auto tabs-scrollbar">
            {DASHBOARD_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`shrink-0 font-mono text-[12px] uppercase tracking-[0.12em] px-6 py-4 transition-colors relative -mb-px border-b-2 ${
                  activeTab === tab.id
                    ? "border-rc-red text-rc-red font-bold"
                    : "border-transparent text-rc-muted hover:text-rc-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-rc-hint font-mono text-sm">
          {activeTab === "home" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <XpPanel />
              <RewardsList />
            </div>
          )}
          {activeTab === "home" && (() => {
            // ── Radar data ──────────────────────────────────────────────────────
            const splitSkillName = (name: string): string[] =>
              name.split(/\s*[\/&+]\s*|\s+and\s+/i)
                .map((s) => s.trim().toLowerCase())
                .filter((s) => s.length > 1);

            const skillMap = new Map<string, { totalCurrent: number; count: number }>();
            for (const item of summaryPage1) {
              const skills: { name: string; current: number; expected: number }[] =
                item.result?.technical_analysis?.skills ?? [];
              for (const s of skills) {
                if (!s.name) continue;
                for (const key of splitSkillName(s.name)) {
                  const existing = skillMap.get(key);
                  if (existing) {
                    existing.totalCurrent += s.current;
                    existing.count += 1;
                  } else {
                    skillMap.set(key, { totalCurrent: s.current, count: 1 });
                  }
                }
              }
            }
            const topSkills = Array.from(skillMap.entries())
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 6)
              .map(([key, { totalCurrent, count }]) => ({
                subject: key.charAt(0).toUpperCase() + key.slice(1),
                strength: Math.round((totalCurrent / count / 10) * 100),
              }));
            const radarPlotData = topSkills.length >= 3
              ? topSkills
              : (() => {
                  const FALLBACK = [
                    { key: "keyword_match",    label: "Keywords" },
                    { key: "tech_stack_fit",   label: "Tech Stack" },
                    { key: "experience_level", label: "Experience" },
                  ] as const;
                  return FALLBACK.map(({ key, label }) => {
                    const vals = summaryPage1
                      .map((i) => i.result?.breakdown?.[key])
                      .filter((v): v is number => v !== null && v !== undefined);
                    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                    return { subject: label, strength: avg !== null ? Math.round(100 - avg) : 0 };
                  });
                })();
            const radarAnalysisCount = summaryPage1.filter(
              (i) => i.result?.technical_analysis?.skills?.length > 0
            ).length;

            const planLabel = (subscription?.plan || "Rejected").toUpperCase();
            const periodEnd = subscription?.currentPeriodEnd
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : null;

            return (
              <div className="flex flex-col gap-6">

                {/* ── 4 stat cards ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Score moyen */}
                  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
                      {t.account.home.avgScore}
                    </p>
                    <p className={`text-3xl font-black leading-none ${overviewAvgRisk !== null ? getScoreColor(overviewAvgRisk).split(" ")[0] : "text-rc-hint"}`}>
                      {overviewAvgRisk !== null ? `${overviewAvgRisk}%` : "-"}
                    </p>
                  </div>

                  {/* Candidatures actives */}
                  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
                      {t.account.home.activeApplications}
                    </p>
                    <p className="text-3xl font-black leading-none text-rc-text">
                      {activeApplications.length}
                    </p>
                    {interviewingApps.length > 0 && (
                      <p className="font-mono text-[10px] text-rc-amber">
                        {interviewingApps.length} en entretien
                      </p>
                    )}
                  </div>

                  {/* Interviews IA */}
                  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
                      {t.account.home.aiInterviews}
                    </p>
                    <p className="text-3xl font-black leading-none text-rc-text">{totalInterviews}</p>
                    {avgInterviewScore !== null && (
                      <p className="font-mono text-[10px] text-rc-green">↑ {avgInterviewScore}/10 avg</p>
                    )}
                  </div>

                  {/* Plan actif */}
                  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
                      {t.account.home.activePlan}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-rc-green animate-pulse" : "bg-rc-hint"}`} />
                      <p className="text-lg font-black leading-none text-rc-text">{planLabel}</p>
                    </div>
                    {periodEnd && (
                      <p className="font-mono text-[10px] text-rc-hint">
                        {t.account.home.renewsOn} {periodEnd} ·{" "}
                        <Link href={localePath("/settings")} className="text-rc-red no-underline hover:underline">
                          {t.account.home.managePlan}
                        </Link>
                      </p>
                    )}
                  </div>
                </div>

                {/* ── 3-col bottom grid ─────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Col 1: Radar */}
                  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold mb-4">
                      {t.account.home.skillProfile}
                    </p>
                    {radarAnalysisCount === 0 ? (
                      <div className="h-48 flex items-center justify-center">
                        <p className="font-mono text-[11px] text-rc-hint text-center">
                          {t.account.overview.firstAnalysisCta}
                        </p>
                      </div>
                    ) : (
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radarPlotData}>
                            <PolarGrid stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3" />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fill: "#6b6860", fontSize: 10, fontFamily: "monospace" }}
                            />
                            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              dataKey="strength"
                              stroke="#D94040"
                              strokeWidth={2}
                              fill="rgba(217,64,64,0.15)"
                              animationDuration={1200}
                              animationEasing="ease-out"
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Col 2: Dernières analyses */}
                  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold mb-4">
                      {t.account.home.recentAnalyses}
                    </p>
                    {recentAnalyses.length === 0 ? (
                      <div className="h-48 flex items-center justify-center">
                        <p className="font-mono text-[11px] text-rc-hint text-center">
                          {t.account.overview.firstAnalysisCta}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-[rgba(0,0,0,0.05)]">
                        {recentAnalyses.map((item) => {
                          const label = item.jobLabel || item.result?.job_details?.title || "Developer";
                          const company = item.company ?? item.result?.job_details?.company ?? null;
                          const score = item.result?.score ?? 0;
                          return (
                            <Link
                              key={item.id}
                              href={localePath(`/analyze?id=${item.id}`)}
                              className="flex items-center gap-3 py-2.5 no-underline group"
                            >
                              <div className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center font-black text-[11px] ${getScoreColor(score)}`}>
                                {score}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[12px] text-rc-text truncate group-hover:text-rc-red transition-colors">{label}</p>
                                {company && <p className="font-mono text-[9px] text-rc-hint truncate">{company}</p>}
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-rc-hint/30 group-hover:text-rc-red shrink-0 transition-colors" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Col 3: À traiter + Quick actions */}
                  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5 flex flex-col gap-4">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">
                      {t.account.home.actionNeeded}
                    </p>

                    <div className="flex flex-col gap-2 flex-1">
                      {staleApplications.slice(0, 2).map((app) => {
                        const days = Math.floor((now - new Date(app.appliedAt).getTime()) / 86400000);
                        return (
                          <button
                            key={app.id}
                            onClick={() => setActiveTab("applications")}
                            className="text-left border-l-2 border-rc-amber bg-rc-amber/5 rounded-r-lg px-3 py-2"
                          >
                            <p className="font-semibold text-[12px] text-rc-text truncate">
                              {app.company} - {app.jobTitle}
                            </p>
                            <p className="font-mono text-[10px] text-rc-amber">
                              {t.account.home.staleApplication.replace("{days}", String(days))}
                            </p>
                          </button>
                        );
                      })}

                      {interviewingApps.slice(0, 2).map((app) => (
                        <button
                          key={app.id}
                          onClick={() => setActiveTab("applications")}
                          className="text-left border-l-2 border-rc-red bg-rc-red/5 rounded-r-lg px-3 py-2"
                        >
                          <p className="font-semibold text-[12px] text-rc-text truncate">
                            {app.company} - {app.jobTitle}
                          </p>
                          <p className="font-mono text-[10px] text-rc-red">{t.account.home.activeInterview}</p>
                        </button>
                      ))}

                      {newUnviewedAnalyses.slice(0, 2).map((item) => {
                        const score = item.result?.score ?? 0;
                        const label = item.jobLabel || item.result?.job_details?.title || "Analysis";
                        return (
                          <Link
                            key={item.id}
                            href={localePath(`/analyze?id=${item.id}`)}
                            className="border-l-2 border-blue-400 bg-blue-50 rounded-r-lg px-3 py-2 no-underline"
                          >
                            <p className="font-semibold text-[12px] text-rc-text truncate">{label}</p>
                            <p className="font-mono text-[10px] text-blue-500">
                              {t.account.home.newUnviewedAnalysis.replace("{score}", String(score))}
                            </p>
                          </Link>
                        );
                      })}

                      {staleApplications.length === 0 &&
                        interviewingApps.length === 0 &&
                        newUnviewedAnalyses.length === 0 && (
                          <p className="font-mono text-[11px] text-rc-hint text-center py-4">
                            {t.account.home.noActionItems}
                          </p>
                        )}
                    </div>

                    <div className="border-t border-[rgba(0,0,0,0.06)] pt-3 flex flex-col gap-2">
                      <Link
                        href={localePath("/analyze")}
                        className="flex items-center justify-center gap-2 py-2.5 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90 transition-opacity"
                      >
                        {t.account.home.newAnalysis} <ArrowRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => setActiveTab("applications")}
                        className="flex items-center justify-center gap-2 py-2.5 border border-[rgba(0,0,0,0.08)] rounded-xl font-mono text-[10px] tracking-widest uppercase text-rc-muted hover:text-rc-text transition-colors"
                      >
                        <Plus className="w-3 h-3" /> {t.account.home.addApplication}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === "analyses" && (() => {
            const filteredHistory = analysisSearch.trim()
              ? history.filter(item => {
                  const q = analysisSearch.toLowerCase();
                  const title = (item.result?.job_details?.title || "").toLowerCase();
                  const company = (item.result?.job_details?.company || "").toLowerCase();
                  return title.includes(q) || company.includes(q);
                })
              : history;

            const evoCutoff = evolutionPeriod === "all"
              ? new Date(0)
              : new Date(Date.now() - (evolutionPeriod === "7d" ? 7 : 30) * 86400000);
            const evoHistory = evolutionPeriod === "all"
              ? history
              : history.filter(i => new Date(i.createdAt) >= evoCutoff);

            const evoGroups = new Map<string, Array<{ date: Date; score: number }>>();
            const evoLabels = new Map<string, { title: string; company: string }>();
            for (const item of evoHistory) {
              const title = item.result?.job_details?.title || "Unknown";
              const company = item.company || item.result?.job_details?.company || "";
              const key = item.jobLabel
                ? item.jobLabel.toLowerCase().trim()
                : `${title}||${company}`;
              const displayLabel = item.jobLabel || title;
              const displayCompany = item.company || (item.jobLabel ? "" : company);
              if (!evoGroups.has(key)) { evoGroups.set(key, []); evoLabels.set(key, { title: displayLabel, company: displayCompany }); }
              evoGroups.get(key)!.push({ date: new Date(item.createdAt), score: item.result?.score ?? 0 });
            }
            for (const pts of evoGroups.values()) pts.sort((a, b) => a.date.getTime() - b.date.getTime());
            const evoKeys = Array.from(evoGroups.keys());
            const evoDateStrings = Array.from(
              new Set(Array.from(evoGroups.values()).flat().map(p => p.date.toDateString()))
            ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            const evoChartData = evoDateStrings.map(ds => {
              const row: Record<string, any> = {
                dateLabel: new Date(ds).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                dateRaw: new Date(ds).getTime(),
              };
              for (const key of evoKeys) {
                const pt = evoGroups.get(key)!.find(p => p.date.toDateString() === ds);
                if (pt) row[key] = pt.score;
              }
              return row;
            });
            const evoHasData = evoHistory.length >= 2;
            const evoHasLines = evoKeys.some(k => (evoGroups.get(k)?.length ?? 0) > 1);

            return (
              <div className="space-y-6">
                <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">Score Evolution</p>
                      <p className="font-mono text-[10px] text-rc-hint mt-0.5">Track your rejection risk over time</p>
                    </div>
                    <select
                      value={evolutionPeriod}
                      onChange={e => setEvolutionPeriod(e.target.value as "7d" | "30d" | "all")}
                      className="font-mono text-[10px] text-rc-hint border border-rc-border rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-rc-red/40 cursor-pointer"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="all">All time</option>
                    </select>
                  </div>

                  {!evoHasData ? (
                    <div className="h-[220px] flex flex-col items-center justify-center gap-3">
                      <p className="font-mono text-[11px] text-rc-hint">No evolution to show yet.</p>
                      <p className="font-mono text-[10px] text-rc-hint/60 text-center max-w-[260px]">Run at least two analyses to track your progress.</p>
                      <Link href={localePath("/analyze")} className="inline-flex items-center gap-2 px-4 py-2 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90 transition-opacity">
                        {t.account.overview.newAnalysis} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={evoChartData} margin={{ top: 8, right: 16, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis
                              dataKey="dateLabel"
                              tick={{ fill: "#9a9790", fontSize: 10, fontFamily: "monospace" }}
                              axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              reversed
                              tick={{ fill: "#9a9790", fontSize: 10, fontFamily: "monospace" }}
                              axisLine={false}
                              tickLine={false}
                              width={36}
                              label={{ value: "Risk %", angle: -90, position: "insideLeft", fill: "#9a9790", fontSize: 9, fontFamily: "monospace", dy: 25 }}
                            />
                            <Tooltip content={(props: any) => (
                              <EvolutionTooltip {...props} evoGroups={evoGroups} evoLabels={evoLabels} />
                            )} />
                            {evoKeys.map((key, i) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={EVO_PALETTE[i % EVO_PALETTE.length]}
                                strokeWidth={2}
                                dot={{ r: 4, fill: EVO_PALETTE[i % EVO_PALETTE.length], strokeWidth: 0 }}
                                activeDot={{ r: 5 }}
                                connectNulls={false}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {!evoHasLines && (
                        <p className="font-mono text-[10px] text-rc-hint/60 text-center mt-3">Add more analyses for the same job to track your progress.</p>
                      )}
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
                        {evoKeys.map((key, i) => {
                          const meta = evoLabels.get(key)!;
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <div className="shrink-0 rounded-full" style={{ width: 16, height: 2, backgroundColor: EVO_PALETTE[i % EVO_PALETTE.length] }} />
                              <span className="font-mono text-[10px] text-rc-muted">{meta.title}{meta.company && ` · ${meta.company}`}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold tracking-tight text-rc-text flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5 text-rc-red" /> {t.account.analysisHistory}
                  </h2>
                  <div className="h-px flex-1 bg-rc-border" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">{totalAnalyses} {t.account.results}</p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={analysisSearch}
                    onChange={e => setAnalysisSearch(e.target.value)}
                    placeholder={t.account.search.analysesPlaceholder}
                    className="w-full bg-white border border-rc-border rounded-xl px-4 py-2.5 pl-9 font-mono text-[12px] text-rc-text placeholder:text-rc-hint outline-none focus:border-rc-red/40 transition-colors"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rc-hint" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  {analysisSearch && (
                    <button onClick={() => setAnalysisSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-rc-hint hover:text-rc-text transition-colors font-mono text-[10px]">✕</button>
                  )}
                </div>

                <div className="space-y-4">
                  {loadingHistory ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-rc-surface rounded-[24px] animate-pulse" />)}
                    </div>
                  ) : totalAnalyses === 0 ? (
                    <div className="p-16 text-center bg-white border border-rc-border rounded-[24px] border-dashed space-y-4">
                      <FileText className="w-12 h-12 text-rc-hint/20 mx-auto" />
                      <p className="text-rc-muted font-medium">{t.account.noResults}</p>
                      <Link href={localePath("/analyze")} className="inline-flex items-center gap-2 px-6 py-3 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90">{t.account.startNewAnalysis} <ArrowRight className="w-3 h-3" /></Link>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-rc-border rounded-[24px] border-dashed">
                      <p className="text-rc-muted font-mono text-[12px]">{t.account.search.noResults} "{analysisSearch}"</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredHistory.map((item) => (
                        <AnalysisRowWithInterviews
                          key={item.id}
                          item={item}
                          isExpanded={expandedAnalysisId === item.id}
                          onToggle={() =>
                            setExpandedAnalysisId(expandedAnalysisId === item.id ? null : item.id)
                          }
                          onDelete={handleDelete}
                          onExport={handleOpenExport}
                          isDeleting={isDeleting}
                          getScoreColor={getScoreColor}
                          localePath={localePath}
                          t={t}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
                      Page {analysisPage} / {Math.max(1, totalAnalysisPages)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={analysisPage === 1}
                        onClick={() => setAnalysisPage(p => p - 1)}
                        className="px-4 py-2 rounded-xl border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ← Prev
                      </button>
                      <button
                        disabled={analysisPage >= Math.max(1, totalAnalysisPages)}
                        onClick={() => setAnalysisPage(p => p + 1)}
                        className="px-4 py-2 rounded-xl border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === "applications" && (
            <ApplicationsTab
              applications={applications}
              applicationsLoading={applicationsLoading}
              history={history}
              onCreateApplication={d => createApplication.mutateAsync(d as any)}
              onUpdateApplication={d => updateApplication.mutateAsync(d as any)}
              onDeleteApplication={id => deleteApplication.mutateAsync(id)}
            />
          )}
        </div>

        <div className="pt-12 pb-24 text-center space-y-2 opacity-30">
          <p className="font-mono text-[9px] tracking-widest uppercase text-rc-hint">RejectCheck · SECURE SESSION</p>
          <p className="text-[10px] text-rc-muted">ID: {user.id} · UTC: {new Date().toISOString()}</p>
        </div>
      </div>

      {showSuccessModal && <SuccessModal onClose={() => setShowSuccessModal(false)} />}
      <ExportModal isOpen={!!exportItem} onClose={() => setExportItem(null)} result={exportItem?.result || null} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
