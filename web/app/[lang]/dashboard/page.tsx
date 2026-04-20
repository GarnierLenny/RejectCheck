"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/auth";
import { useSubscription, useAnalysisHistory, useProfile, useInterviewHistory, useApplications } from "../../../lib/queries";
import { useDeleteAnalysis, useCreateApplication, useUpdateApplication, useDeleteApplication } from "../../../lib/mutations";
import { ApplicationsTab } from "../../components/tabs/ApplicationsTab";
import { useLanguage } from "../../../context/language";
import {
  FileText,
  Clock,
  ChevronRight,
  LayoutGrid,
  Trash2,
  ArrowRight,
  Zap,
  MoreVertical,
  Download,
  Mic,
} from "lucide-react";
import { ExportModal } from "../../components/ExportModal";
import { SuccessModal } from "../../components/SuccessModal";
import { Github, Linkedin } from "react-bootstrap-icons";
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

type HistoryItem = {
  id: number;
  jobDescription: string;
  jobLabel?: string;
  company?: string;
  createdAt: string;
  result: any;
};

type DashboardTab = "overview" | "analyses" | "interviews" | "applications";

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: "overview",      label: "Overview" },
  { id: "analyses",      label: "Analyses" },
  { id: "interviews",    label: "Interviews" },
  { id: "applications",  label: "Applications" },
];

const VALID_DASHBOARD_TABS: DashboardTab[] = ["overview", "analyses", "interviews", "applications"];

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

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, localePath } = useLanguage();

  const { user, session, loading: authLoading } = useAuth();

  const [analysisPage, setAnalysisPage] = useState(1);
  const [interviewPage, setInterviewPage] = useState(1);
  const [analysisSearch, setAnalysisSearch] = useState("");
  const [interviewSearch, setInterviewSearch] = useState("");
  const [evolutionPeriod, setEvolutionPeriod] = useState<"7d" | "30d" | "all">("30d");

  const { data: subscription } = useSubscription();
  const { data: analysisData, isLoading: loadingHistory } = useAnalysisHistory(analysisPage);
  const { data: interviewData } = useInterviewHistory(interviewPage);
  const { data: summaryData } = useAnalysisHistory(1);
  const { data: applicationsData, isLoading: applicationsLoading } = useApplications();

  const history = analysisData?.data ?? [];
  const interviewHistory = interviewData?.data ?? [];
  const applications = applicationsData ?? [];

  const deleteAnalysis = useDeleteAnalysis();
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [exportItem, setExportItem] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const tab = searchParams.get("tab");
    return VALID_DASHBOARD_TABS.includes(tab as DashboardTab) ? (tab as DashboardTab) : "overview";
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

  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => { setAnalysisPage(1); }, [analysisSearch]);
  useEffect(() => { setInterviewPage(1); }, [interviewSearch]);

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
      setActiveMenuId(null);
    }
  }

  function handleOpenExport(e: React.MouseEvent, item: HistoryItem) {
    e.preventDefault();
    e.stopPropagation();
    setExportItem(item);
    setActiveMenuId(null);
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
  const totalInterviews = interviewData?.total ?? 0;
  const totalInterviewPages = Math.ceil(totalInterviews / 10);

  const summaryPage1 = summaryData?.data ?? [];
  const overviewAvgRisk = summaryPage1.length > 0
    ? Math.round(summaryPage1.reduce((acc, curr) => acc + (curr.result?.score || 0), 0) / summaryPage1.length)
    : null;

  const getScoreColor = (score: number) => {
    if (score < 40) return "border-rc-green/30 text-rc-green bg-rc-green/5";
    if (score < 70) return "border-rc-amber/40 text-rc-amber bg-rc-amber/5";
    return "border-rc-red/30 text-rc-red bg-rc-red/5";
  };

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
                {(t.account.tabs as Record<string, string>)[tab.id]}
              </button>
            ))}
          </div>
        </div>

        <div className="text-rc-hint font-mono text-sm">
          {activeTab === "overview" && (() => {
            const splitSkillName = (name: string): string[] =>
              name.split(/\s*[\/&+]\s*|\s+and\s+/i)
                .map(s => s.trim().toLowerCase())
                .filter(s => s.length > 1);

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

            const ghVals = summaryPage1
              .map(i => i.result?.breakdown?.github_signal)
              .filter((v): v is number => v !== null && v !== undefined);
            const liVals = summaryPage1
              .map(i => i.result?.breakdown?.linkedin_signal)
              .filter((v): v is number => v !== null && v !== undefined);

            const ghScore = ghVals.length > 0
              ? Math.round(ghVals.reduce((a,b) => a+b,0) / ghVals.length)
              : null;
            const liScore = liVals.length > 0
              ? Math.round(liVals.reduce((a,b) => a+b,0) / liVals.length)
              : null;

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
                      .map(i => i.result?.breakdown?.[key])
                      .filter((v): v is number => v !== null && v !== undefined);
                    const avg = vals.length > 0 ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
                    return { subject: label, strength: avg !== null ? Math.round(100-avg) : 0 };
                  });
                })();

            const radarAnalysisCount = summaryPage1.filter(i => i.result?.technical_analysis?.skills?.length > 0).length;

            const riskColor = overviewAvgRisk === null
              ? "text-rc-hint"
              : overviewAvgRisk > 60 ? "text-rc-red"
              : overviewAvgRisk >= 40 ? "text-rc-amber"
              : "text-rc-green";

            const planLabel = (subscription?.plan || "Rejected").toUpperCase();
            const periodEnd = subscription?.currentPeriodEnd
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : null;

            return (
              <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Left column (40%) */}
                <div className="w-full md:w-[40%] shrink-0 flex flex-col gap-4">

                  {/* Plan card */}
                  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">{t.account.overview.currentPlan}</p>
                        {isActive && periodEnd
                          ? <p className="font-mono text-[11px] text-rc-muted">{t.account.overview.renews} <span className="text-rc-text font-semibold">{periodEnd}</span></p>
                          : <p className="font-mono text-[11px] text-rc-hint">{t.account.overview.noActiveSub}</p>
                        }
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rc-red/5 border border-rc-red/10 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-rc-red animate-pulse" : "bg-rc-hint"}`} />
                        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-red font-bold">{planLabel}</span>
                      </div>
                    </div>
                    <Link
                      href={localePath("/pricing")}
                      className="font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-red transition-colors no-underline"
                    >
                      {t.account.overview.manageSubscription}
                    </Link>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: <FileText className="w-3.5 h-3.5 text-rc-hint" />, value: totalAnalyses, label: t.account.tabs.analyses, color: "text-rc-text" },
                      { icon: <Mic className="w-3.5 h-3.5 text-rc-hint" />,      value: totalInterviews, label: t.account.tabs.interviews, color: "text-rc-text" },
                      { icon: <Zap className="w-3.5 h-3.5 text-rc-hint" />,      value: overviewAvgRisk ?? "—", label: t.account.overview.avgRisk, color: riskColor },
                    ].map(({ icon, value, label, color }) => (
                      <div key={label} className="bg-[#faf9f7] border border-[rgba(0,0,0,0.06)] rounded-xl p-3 flex flex-col gap-1.5">
                        {icon}
                        <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
                        <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent analyses */}
                  {summaryPage1.length > 0 && (
                    <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.06)]">
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">{t.account.overview.recent}</p>
                        <button
                          onClick={() => handleTabChange("analyses")}
                          className="font-mono text-[9px] tracking-widest uppercase text-rc-hint hover:text-rc-red transition-colors"
                        >
                          {t.account.overview.viewFullHistory}
                        </button>
                      </div>
                      {summaryPage1.slice(0, 3).map((item, i) => {
                        const label = item.jobLabel || item.result?.job_details?.title || "Developer";
                        const company = item.company ?? item.result?.job_details?.company ?? null;
                        const score = item.result?.score ?? 0;
                        const scoreClass = score < 40
                          ? "text-rc-green border-rc-green/30 bg-rc-green/5"
                          : score < 70
                          ? "text-rc-amber border-rc-amber/40 bg-rc-amber/5"
                          : "text-rc-red border-rc-red/30 bg-rc-red/5";
                        return (
                          <Link
                            key={item.id}
                            href={localePath(`/analyze?id=${item.id}`)}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors no-underline group ${i < 2 ? "border-b border-[rgba(0,0,0,0.04)]" : ""}`}
                          >
                            <div className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center font-black text-[11px] ${scoreClass}`}>
                              {score}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[12px] text-rc-text leading-tight truncate group-hover:text-rc-red transition-colors">{label}</p>
                              {company && <p className="font-mono text-[9px] text-rc-hint truncate">{company}</p>}
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-rc-hint/30 group-hover:text-rc-red shrink-0 ml-auto transition-colors" />
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={localePath("/analyze")}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90 transition-opacity"
                  >
                    {t.account.overview.newAnalysis} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Right column (60%) */}
                <div className="w-full md:flex-1 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">{t.account.overview.skillStrengthProfile}</p>
                    <p className="font-mono text-[10px] text-rc-hint">
                      {t.account.overview.basedOn} {radarAnalysisCount} {radarAnalysisCount === 1 ? t.account.overview.analysis : t.account.overview.analyses}
                    </p>
                  </div>

                  {radarAnalysisCount === 0 ? (
                    <div className="h-[420px] flex flex-col items-center justify-center gap-5">
                      <p className="font-mono text-[11px] text-rc-hint text-center">{t.account.overview.firstAnalysisCta}</p>
                      <Link
                        href={localePath("/analyze")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90 transition-opacity"
                      >
                        {t.account.overview.newAnalysis} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="h-[420px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radarPlotData}>
                          <PolarGrid stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "#6b6860", fontSize: 11, fontFamily: "monospace", fontWeight: 500 }}
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

                  {(ghScore !== null || liScore !== null) && (() => {
                    const signals = [
                      { label: "GitHub",   score: ghScore,   icon: <Github className="w-4 h-4" /> },
                      { label: "LinkedIn", score: liScore,   icon: <Linkedin className="w-4 h-4" /> },
                    ].filter(s => s.score !== null) as { label: string; score: number; icon: React.ReactNode }[];

                    const barColor = (s: number) =>
                      s >= 70 ? "bg-rc-green" : s >= 50 ? "bg-rc-amber" : "bg-rc-red";
                    const textColor = (s: number) =>
                      s >= 70 ? "text-rc-green" : s >= 50 ? "text-rc-amber" : "text-rc-red";

                    return (
                      <div className="border-t border-[rgba(0,0,0,0.06)] pt-5 space-y-4">
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">{t.account.overview.signalsStrength}</p>
                        <div className="space-y-4">
                          {signals.map(({ label, score, icon }) => (
                            <div key={label} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-rc-muted">
                                  {icon}
                                  <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
                                </div>
                                <span className={`font-mono text-[12px] font-bold ${textColor(score)}`}>
                                  {score}<span className="text-rc-hint font-normal"> / 100</span>
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-[#f0ede9] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${barColor(score)}`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
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
                    filteredHistory.map(item => {
                      const label = item.jobLabel || item.result?.job_details?.title || "Developer";
                      const company = item.company ?? item.result?.job_details?.company ?? null;
                      const score = item.result?.score ?? 0;

                      return (
                        <div key={item.id} className="relative group">
                          <Link
                            href={localePath(`/analyze?id=${item.id}`)}
                            className={`flex items-center justify-between p-6 bg-white border border-rc-border rounded-[24px] hover:border-rc-red/20 group/card transition-all no-underline shadow-sm ${isDeleting === item.id ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black shadow-sm transition-transform group-hover/card:scale-105 ${getScoreColor(score)}`}>
                                {score}
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-bold text-rc-text tracking-tight flex items-center gap-2 group-hover/card:text-rc-red transition-colors">
                                  {label}{company && <><span className="text-rc-hint/50 font-normal group-hover/card:text-rc-red/30">•</span> {company}</>}
                                </h3>
                                <p className="font-mono text-[11px] uppercase tracking-widest text-rc-hint flex items-center gap-2">
                                  <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pr-12">
                              <span className="font-mono text-[10px] tracking-widest uppercase text-rc-hint opacity-10 font-bold group-hover/card:opacity-100 group-hover/card:text-rc-red transition-all">{t.account.details}</span>
                              <ChevronRight className="w-5 h-5 text-rc-hint/30 group-hover/card:text-rc-red transition-all" />
                            </div>
                          </Link>

                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                            className={`absolute right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-xl hover:bg-rc-bg transition-all z-20 border border-transparent hover:border-rc-border ${activeMenuId === item.id ? "bg-rc-bg border-rc-border text-rc-red" : "text-rc-hint"}`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {activeMenuId === item.id && (
                            <div className="absolute right-12 top-[calc(50%+20px)] w-48 bg-white border border-rc-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
                              <button onClick={e => handleOpenExport(e, item)} className="w-full flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-rc-bg text-rc-text transition-colors border-b border-rc-border group/item">
                                <Download className="w-4 h-4 text-rc-red group-hover/item:scale-110 transition-transform" />
                                <span className="font-semibold">{t.account.exportReport}</span>
                              </button>
                              <button onClick={e => handleDelete(e, item.id)} className="w-full flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-rc-red/5 text-rc-red transition-colors group/del">
                                <Trash2 className="w-4 h-4 group-hover/del:rotate-12 transition-transform" />
                                <span className="font-semibold">{t.account.deleteAnalysis}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
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

          {activeTab === "interviews" && (() => {
            const analysisLookup = new Map<number, { title: string; company: string }>();
            for (const item of [...summaryPage1, ...history]) {
              analysisLookup.set(item.id, {
                title:   item.result?.job_details?.title   || "",
                company: item.result?.job_details?.company || "",
              });
            }

            const filteredInterviews = interviewSearch.trim()
              ? interviewHistory.filter(attempt => {
                  const q = interviewSearch.toLowerCase();
                  const meta = analysisLookup.get(attempt.analysisId);
                  const title   = (attempt.analysis?.result?.job_details?.title   || meta?.title   || "").toLowerCase();
                  const company = (attempt.analysis?.result?.job_details?.company || meta?.company || "").toLowerCase();
                  const date    = new Date(attempt.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toLowerCase();
                  return title.includes(q) || company.includes(q) || date.includes(q);
                })
              : interviewHistory;

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold tracking-tight text-rc-text flex items-center gap-3">
                    <Mic className="w-5 h-5 text-rc-red" /> {t.account.aiInterviews}
                  </h2>
                  <div className="h-px flex-1 bg-rc-border" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
                    {totalInterviews} {totalInterviews > 1 ? t.interviewTab.attempts : t.interviewTab.attempt}
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={interviewSearch}
                    onChange={e => setInterviewSearch(e.target.value)}
                    placeholder={t.account.search.interviewsPlaceholder}
                    className="w-full bg-white border border-rc-border rounded-xl px-4 py-2.5 pl-9 font-mono text-[12px] text-rc-text placeholder:text-rc-hint outline-none focus:border-rc-red/40 transition-colors"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rc-hint" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  {interviewSearch && (
                    <button onClick={() => setInterviewSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-rc-hint hover:text-rc-text transition-colors font-mono text-[10px]">✕</button>
                  )}
                </div>

                {totalInterviews === 0 ? (
                  <div className="p-16 text-center bg-white border border-rc-border rounded-[24px] border-dashed space-y-4">
                    <Mic className="w-12 h-12 text-rc-hint/20 mx-auto" />
                    <p className="text-rc-muted font-medium">{t.account.noInterviewsYet}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {filteredInterviews.map((attempt, i) => {
                        const score = attempt.globalScore;
                        const scoreColor = score === null
                          ? "border-rc-border text-rc-hint bg-rc-surface"
                          : score >= 7 ? "border-green-500/30 text-green-400 bg-green-500/5"
                          : score >= 4 ? "border-amber-500/30 text-amber-400 bg-amber-500/5"
                          : "border-rc-red/30 text-rc-red bg-rc-red/5";
                        const globalIndex = totalInterviews - ((interviewPage - 1) * 10) - i;
                        const meta = analysisLookup.get(attempt.analysisId);
                        const jobTitle   = attempt.analysis?.result?.job_details?.title   || meta?.title   || null;
                        const jobCompany = attempt.analysis?.result?.job_details?.company || meta?.company || null;

                        return (
                          <Link
                            key={attempt.id}
                            href={localePath(`/analyze?id=${attempt.analysisId}&tab=interview&interviewId=${attempt.id}`)}
                            className="flex items-center justify-between p-5 bg-white border border-rc-border rounded-[20px] hover:border-rc-red/20 transition-all no-underline shadow-sm group/card"
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black ${scoreColor}`}>
                                {score !== null ? score : "—"}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-rc-text tracking-tight group-hover/card:text-rc-red transition-colors">
                                  {jobTitle
                                    ? <>{jobTitle}{jobCompany && <span className="text-rc-hint/60 font-normal"> · {jobCompany}</span>} <span className="text-rc-hint font-normal text-[11px]">#{globalIndex}</span></>
                                    : <>{t.account.interviewLabel} #{globalIndex}</>
                                  }
                                </p>
                                <p className="font-mono text-[11px] uppercase tracking-widest text-rc-hint flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {new Date(attempt.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                  {" · "}
                                  {new Date(attempt.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[10px] tracking-widest uppercase text-rc-red opacity-0 group-hover/card:opacity-100 transition-all">{t.account.view}</span>
                              <ChevronRight className="w-4 h-4 text-rc-hint/30 group-hover/card:text-rc-red transition-all" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
                        Page {interviewPage} / {Math.max(1, totalInterviewPages)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={interviewPage === 1}
                          onClick={() => setInterviewPage(p => p - 1)}
                          className="px-4 py-2 rounded-xl border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ← Prev
                        </button>
                        <button
                          disabled={interviewPage >= Math.max(1, totalInterviewPages)}
                          onClick={() => setInterviewPage(p => p + 1)}
                          className="px-4 py-2 rounded-xl border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
