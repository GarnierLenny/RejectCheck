"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "../../../../context/auth";
import {
  useSubscription,
  useAnalysisHistory,
  useInterviewHistory,
  useApplications,
  useProfile,
  useQuota,
  useUserXp,
} from "../../../../lib/queries";
import { BuyCreditsModal } from "../../../components/BuyCreditsModal";
import { useDeleteAnalysis, useCreateApplication, useUpdateApplication, useDeleteApplication } from "../../../../lib/mutations";
import { ApplicationsTab } from "../../../components/tabs/ApplicationsTab";
import { useLanguage } from "../../../../context/language";
import { FileText, ArrowRight } from "lucide-react";
import { ExportModal } from "../../../components/ExportModal";
import { SuccessModal } from "../../../components/SuccessModal";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { DashboardShell } from "../../../components/dashboard/DashboardShell";

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
  active, payload, evoGroups, evoLabels,
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
                Risk: <span style={{ color: entry.color }} className="font-bold">{entry.value}%</span>
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

// ── Shared helpers ──────────────────────────────────────────────────────────

function scoreColors(score: number) {
  if (score < 40) return { color: "var(--rc-green)", bg: "var(--rc-green-bg)", cls: "border-rc-green/30 text-rc-green bg-rc-green/5" };
  if (score < 70) return { color: "var(--rc-amber)", bg: "var(--rc-amber-bg)", cls: "border-rc-amber/40 text-rc-amber bg-rc-amber/5" };
  return { color: "var(--rc-red)", bg: "var(--rc-red-bg)", cls: "border-rc-red/30 text-rc-red bg-rc-red/5" };
}

function ScoreCircle({ score }: { score: number }) {
  const c = scoreColors(score);
  return (
    <div className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center font-black text-[11px] ${c.cls}`}>
      {score}
    </div>
  );
}

function SegmentedBar({ x = 0, y = 0, width = 0, height = 0, fill }: {
  x?: number; y?: number; width?: number; height?: number; fill?: string;
}) {
  if (height <= 0 || width <= 0) return null;
  const sliceH = 5;
  const gap = 2;
  const step = sliceH + gap;
  const count = Math.max(1, Math.floor(height / step));
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} x={x} y={y + height - (i + 1) * step} width={width} height={sliceH} fill={fill} rx={1} />
      ))}
    </g>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { t, localePath } = useLanguage();

  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();

  const [analysisPage, setAnalysisPage] = useState(1);
  const [analysisSearch, setAnalysisSearch] = useState("");
  const [analysisTypeFilter, setAnalysisTypeFilter] = useState<"vs-job" | "cv-review">("vs-job");
  const [evolutionPeriod, setEvolutionPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [homePeriod, setHomePeriod] = useState<"7d" | "14d" | "30d">("30d");

  const { data: subscription } = useSubscription();
  const { data: quota } = useQuota();
  const { data: analysisData, isLoading: loadingHistory } = useAnalysisHistory(analysisPage);
  const { data: interviewSummary } = useInterviewHistory(1);
  const { data: summaryData } = useAnalysisHistory(1);
  const { data: applicationsData, isLoading: applicationsLoading } = useApplications();
  const { data: xpData } = useUserXp();

  const history = analysisData?.data ?? [];
  const totalInterviews = interviewSummary?.total ?? 0;
  const applications = applicationsData ?? [];
  const summaryPage1 = summaryData?.data ?? [];

  const deleteAnalysis = useDeleteAnalysis();
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  const [exportItem, setExportItem] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const tab = searchParams.get("tab");
    if (tab === "overview") return "home";
    if (tab === "interviews") return "analyses";
    return VALID_DASHBOARD_TABS.includes(tab as DashboardTab) ? (tab as DashboardTab) : "home";
  });

  function handleTabChange(tab: DashboardTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (!authLoading && !user) router.replace(localePath("/login"));
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || !profile) return;
    if (profile.onboardedAt == null && profile.onboardingSkipped !== true) {
      router.replace(localePath("/onboarding"));
    }
  }, [authLoading, user, profile, router, localePath]);

  useEffect(() => {
    if (searchParams.get("success") === "true") setShowSuccessModal(true);
    if (searchParams.get("credit_success") === "true") {
      queryClient.invalidateQueries({ queryKey: ["quota"] });
    }
  }, [searchParams, queryClient]);

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
  useEffect(() => { setAnalysisPage(1); }, [analysisTypeFilter]);

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

  // ── Computed values ───────────────────────────────────────────────────────

  const totalAnalyses = analysisData?.total ?? 0;
  const totalAnalysisPages = Math.ceil(totalAnalyses / 10);

  const overviewAvgRisk = summaryPage1.length > 0
    ? Math.round(summaryPage1.reduce((acc, curr) => acc + (curr.result?.score || 0), 0) / summaryPage1.length)
    : null;

  const activeApplications = applications.filter(a => a.status === "applied" || a.status === "interviewing");
  const interviewingApps = applications.filter(a => a.status === "interviewing");

  const now = Date.now();
  const STALE_DAYS = 14;
  const staleApplications = applications.filter(a => {
    if (a.status !== "applied") return false;
    return now - new Date(a.appliedAt).getTime() > STALE_DAYS * 86400000;
  });

  const recentAnalyses = summaryPage1.slice(0, 4);

  const repliedApps = applications.filter(a => a.status !== "applied" && a.status !== "interested");
  const responseRate = applications.length > 0
    ? Math.round((repliedApps.length / applications.length) * 100)
    : 0;

  // Skills
  const splitSkillName = (name: string) =>
    name.split(/\s*[\/&+]\s*|\s+and\s+/i).map(s => s.trim().toLowerCase()).filter(s => s.length > 1);
  const skillMap = new Map<string, { totalCurrent: number; count: number }>();
  for (const item of summaryPage1) {
    const skills: { name: string; current: number }[] = item.result?.technical_analysis?.skills ?? [];
    for (const s of skills) {
      if (!s.name) continue;
      for (const key of splitSkillName(s.name)) {
        const ex = skillMap.get(key);
        if (ex) { ex.totalCurrent += s.current; ex.count += 1; }
        else skillMap.set(key, { totalCurrent: s.current, count: 1 });
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
  const skillAnalysisCount = summaryPage1.filter(i => i.result?.technical_analysis?.skills?.length > 0).length;

  // Home chart
  // green #16a34a → amber #d97706 → red #C93A39
  const scoreBarColor = (score: number) => {
    const t = Math.max(0, Math.min(1, score / 100));
    let r: number, g: number, b: number;
    if (t < 0.5) {
      const u = t / 0.5;
      r = Math.round(0x16 + (0xd9 - 0x16) * u);
      g = Math.round(0xa3 + (0x77 - 0xa3) * u);
      b = Math.round(0x4a + (0x06 - 0x4a) * u);
    } else {
      const u = (t - 0.5) / 0.5;
      r = Math.round(0xd9 + (0xc9 - 0xd9) * u);
      g = Math.round(0x77 + (0x3a - 0x77) * u);
      b = Math.round(0x06 + (0x39 - 0x06) * u);
    }
    return `rgb(${r},${g},${b})`;
  };
  const homeCutoff = new Date(Date.now() - (homePeriod === "7d" ? 7 : homePeriod === "14d" ? 14 : 30) * 86400000);
  const homeChartData = [...summaryPage1]
    .filter(item => new Date(item.createdAt) >= homeCutoff)
    .reverse()
    .map(item => ({
      dateLabel: new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: item.result?.score ?? 0,
    }));

  // Evo chart (analyses tab)
  const evoCutoff = evolutionPeriod === "all"
    ? new Date(0)
    : new Date(Date.now() - (evolutionPeriod === "7d" ? 7 : 30) * 86400000);
  const evoHistory = (evolutionPeriod === "all" ? history : history.filter(i => new Date(i.createdAt) >= evoCutoff))
    .filter(i => !i.result?.cv_quality);
  const evoGroups = new Map<string, Array<{ date: Date; score: number }>>();
  const evoLabels = new Map<string, { title: string; company: string }>();
  for (const item of evoHistory) {
    const title = item.result?.job_details?.title || "Unknown";
    const company = item.company || item.result?.job_details?.company || "";
    const key = item.jobLabel ? item.jobLabel.toLowerCase().trim() : `${title}||${company}`;
    if (!evoGroups.has(key)) {
      evoLabels.set(key, { title: item.jobLabel || title, company: item.company || (item.jobLabel ? "" : company) });
      evoGroups.set(key, []);
    }
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

  // Best / worst
  const bestRun = summaryPage1.length > 0
    ? summaryPage1.reduce((b, i) => (i.result?.score ?? 100) < (b.result?.score ?? 100) ? i : b)
    : null;
  const worstRun = summaryPage1.length > 0
    ? summaryPage1.reduce((w, i) => (i.result?.score ?? 0) > (w.result?.score ?? 0) ? i : w)
    : null;

  // Pilot insights
  const topRiskItem = summaryPage1.length > 0
    ? summaryPage1.reduce((w, i) => (i.result?.score ?? 0) > (w.result?.score ?? 0) ? i : w)
    : null;
  const pilotLines: { tone: "warn" | "nudge" | "info"; body: string }[] = [
    topRiskItem && (topRiskItem.result?.score ?? 0) > 60
      ? { tone: "warn", body: `Tailor your CV for ${topRiskItem.company || topRiskItem.result?.job_details?.company || "your top-risk role"} — biggest gain available.` }
      : { tone: "info", body: "Your average risk score is under control. Keep diversifying your applications." },
    staleApplications[0]
      ? { tone: "nudge", body: `Follow up with ${staleApplications[0].company} — ${Math.floor((now - new Date(staleApplications[0].appliedAt).getTime()) / 86400000)} days with no reply.` }
      : { tone: "info", body: "No stale applications. Good momentum." },
    topSkills.length > 0
      ? { tone: "info", body: `${topSkills[topSkills.length - 1]?.subject || "A key skill"} appears thin across your recent analyses.` }
      : { tone: "info", body: "Run more analyses to unlock personalized tips." },
  ];

  // Filtered history
  const typeHistory = history.filter(item =>
    analysisTypeFilter === "cv-review" ? !!item.result?.cv_quality : !item.result?.cv_quality
  );
  const filteredHistory = analysisSearch.trim()
    ? typeHistory.filter(item => {
        const q = analysisSearch.toLowerCase();
        return (item.result?.job_details?.title || "").toLowerCase().includes(q) ||
               (item.result?.job_details?.company || "").toLowerCase().includes(q) ||
               (item.jobLabel || "").toLowerCase().includes(q);
      })
    : typeHistory;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <DashboardShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        totalAnalyses={totalAnalyses}
        totalApps={activeApplications.length}
        onBuyCredits={() => setIsCreditsModalOpen(true)}
        firstName={profile?.displayName?.split(" ")[0]}
      >
        {/* ── HOME ─────────────────────────────────────────────────────── */}
        {activeTab === "home" && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 320px" }}>

            {/* LEFT */}
            <div className="flex flex-col gap-4">

              {/* KPI strip */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: t.account.home.avgScore,
                    value: overviewAvgRisk !== null ? `${overviewAvgRisk}%` : "—",
                    sub: overviewAvgRisk !== null
                      ? overviewAvgRisk < 40 ? "Low risk" : overviewAvgRisk < 70 ? "Moderate" : "High risk"
                      : "No data yet",
                    subColor: overviewAvgRisk !== null && overviewAvgRisk < 40 ? "text-rc-green" : overviewAvgRisk !== null && overviewAvgRisk >= 70 ? "text-rc-red" : "text-rc-hint",
                  },
                  {
                    label: t.account.home.activeApplications,
                    value: String(activeApplications.length),
                    sub: interviewingApps.length > 0 ? `${interviewingApps.length} interviewing` : undefined,
                    subColor: "text-rc-amber",
                  },
                  {
                    label: "Response rate",
                    value: `${responseRate}%`,
                    sub: `${repliedApps.length} of ${applications.length} replied`,
                    subColor: "text-rc-hint",
                  },
                  {
                    label: t.account.home.aiInterviews,
                    value: String(totalInterviews),
                    sub: totalInterviews === 0 ? "None yet" : undefined,
                    subColor: "text-rc-hint",
                  },
                ].map(({ label, value, sub, subColor }) => (
                  <div key={label} className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">{label}</p>
                    <p className="text-3xl font-black leading-none text-rc-text">{value}</p>
                    {sub && <p className={`font-mono text-[10px] ${subColor}`}>{sub}</p>}
                  </div>
                ))}
              </div>

              {/* Score chart */}
              <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">
                    {t.account.home.recentAnalyses} · score trend
                  </p>
                  <div className="flex gap-1.5">
                    {(["7d", "14d", "30d"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setHomePeriod(p)}
                        className={`font-mono text-[10px] font-bold tracking-[0.1em] px-2.5 py-1 rounded-lg border transition-colors ${
                          homePeriod === p
                            ? "border-rc-red text-rc-red bg-rc-red/5"
                            : "border-rc-border text-rc-hint hover:text-rc-text"
                        }`}
                      >
                        {p === "7d" ? "7D" : p === "14d" ? "14D" : "30D"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[180px] px-2 pb-2">
                  {homeChartData.length < 2 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="font-mono text-[11px] text-rc-hint text-center">
                        Run 2+ analyses to see your score trend.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={homeChartData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fill: "#9a9790", fontSize: 9, fontFamily: "monospace" }}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "#9a9790", fontSize: 9, fontFamily: "monospace" }}
                          axisLine={false} tickLine={false} width={28}
                        />
                        <Tooltip
                          cursor={false}
                          contentStyle={{
                            fontFamily: "monospace", fontSize: 11,
                            border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12,
                          }}
                        />
                        <Bar dataKey="score" shape={<SegmentedBar />}>
                          {homeChartData.map((entry, i) => (
                            <Cell key={i} fill={scoreBarColor(entry.score)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Recent analyses */}
              <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">
                    {t.account.home.recentAnalyses}
                  </p>
                  <button
                    onClick={() => handleTabChange("analyses")}
                    className="font-mono text-[10px] text-rc-red tracking-[0.1em] hover:opacity-70 transition-opacity"
                  >
                    {totalAnalyses} total · See all →
                  </button>
                </div>
                {recentAnalyses.length === 0 ? (
                  <div className="px-5 pb-5">
                    <p className="font-mono text-[11px] text-rc-hint text-center py-6">
                      {t.account.overview.firstAnalysisCta}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                    {recentAnalyses.map(item => {
                      const label = item.jobLabel || item.result?.job_details?.title || "Developer";
                      const company = item.company ?? item.result?.job_details?.company ?? null;
                      const score = item.result?.score ?? 0;
                      const appStatus = applications.find(a =>
                        a.company?.toLowerCase() === company?.toLowerCase()
                      )?.status;
                      return (
                        <Link
                          key={item.id}
                          href={localePath(`/analyze?id=${item.id}`)}
                          className="flex items-center gap-3 px-5 py-3 no-underline hover:bg-[#faf9f7] transition-colors group"
                        >
                          <ScoreCircle score={score} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[13px] text-rc-text truncate group-hover:text-rc-red transition-colors">{label}</p>
                            {company && <p className="font-mono text-[9px] text-rc-hint truncate">{company}</p>}
                          </div>
                          {appStatus && (
                            <span className={`font-mono text-[9px] font-bold tracking-[0.1em] ${appStatus === "interviewing" ? "text-rc-amber" : "text-rc-hint"}`}>
                              {appStatus.toUpperCase()}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-rc-hint shrink-0">
                            {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-4">

              {/* Pilot insights */}
              <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">Today's insights</p>
                  <span className="flex items-center gap-1 font-mono text-[9px] text-rc-green font-bold tracking-[0.1em]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rc-green animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="p-5 space-y-1.5">
                  {overviewAvgRisk !== null ? (
                    <p className="font-sans text-[14px] leading-snug text-rc-text mb-4">
                      Average risk at{" "}
                      <span
                        className="font-serif italic font-medium"
                        style={{ color: overviewAvgRisk < 40 ? "var(--rc-green)" : overviewAvgRisk < 70 ? "var(--rc-amber)" : "var(--rc-red)" }}
                      >
                        {overviewAvgRisk}%
                      </span>
                      {topRiskItem && (
                        <>. Watch <span className="font-serif italic text-rc-red font-medium">{topRiskItem.company || topRiskItem.result?.job_details?.company} ({topRiskItem.result?.score})</span>.</>
                      )}
                    </p>
                  ) : (
                    <p className="font-sans text-[14px] text-rc-hint mb-4">Run your first analysis to get personalized insights.</p>
                  )}
                  <div className="space-y-3">
                    {pilotLines.map((line, i) => {
                      const dotColor = line.tone === "warn" ? "bg-rc-red" : line.tone === "nudge" ? "bg-rc-amber" : "bg-rc-green";
                      return (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5 shrink-0`} />
                          <p className="text-[12px] text-rc-muted leading-snug">{line.body}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rank */}
              <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">Your rank</p>
                  <span className="font-black text-[18px] text-rc-red leading-none">
                    {xpData?.totalXp.toLocaleString() ?? 0}
                    <span className="font-mono text-[10px] text-rc-hint ml-1">XP</span>
                  </span>
                </div>
                {xpData ? (
                  <>
                    <p className="font-sans font-semibold text-[18px] leading-none mb-2" style={{ letterSpacing: -0.2 }}>
                      {xpData.tierLabel.split(" ").slice(0, -1).join(" ")}{" "}
                      <span className="font-serif italic text-rc-red" style={{ fontWeight: 500 }}>
                        {xpData.tierLabel.split(" ").slice(-1)[0]}
                      </span>
                    </p>
                    <p className="font-mono text-[10px] text-rc-hint mb-2">
                      → {xpData.next?.tierLabel ?? "Max level"} · {xpData.xpInLevel}/{xpData.xpForNextLevel} XP
                    </p>
                    <div className="h-1.5 bg-rc-surface-hero rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rc-red transition-all"
                        style={{ width: `${xpData.percentToNextLevel}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="font-mono text-[11px] text-rc-hint">—</p>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5">
                <div className="flex items-baseline justify-between mb-4">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">{t.account.home.skillProfile}</p>
                  {skillAnalysisCount > 0 && (
                    <span className="font-mono text-[10px] text-rc-hint">{skillAnalysisCount} runs</span>
                  )}
                </div>
                {topSkills.length === 0 ? (
                  <p className="font-mono text-[11px] text-rc-hint text-center py-4">
                    Run analyses to build your skill profile.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topSkills.map(skill => (
                      <div key={skill.subject} className="grid items-center gap-2" style={{ gridTemplateColumns: "80px 1fr 28px" }}>
                        <span className="text-[12px] text-rc-text truncate">{skill.subject}</span>
                        <div className="h-1.5 bg-rc-surface-hero rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${skill.strength}%`,
                              background: skill.strength > 60 ? "var(--rc-green)" : skill.strength > 30 ? "var(--rc-amber)" : "var(--rc-red)",
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-rc-hint text-right">{skill.strength}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYSES ─────────────────────────────────────────────────── */}
        {activeTab === "analyses" && (
          <div className="space-y-4">

            {/* Top row */}
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 240px", height: 260 }}>

              {/* Evo chart */}
              <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">Score evolution</p>
                    <p className="font-mono text-[10px] text-rc-hint mt-0.5">Rejection risk · % · ↓ better</p>
                  </div>
                  <div className="flex gap-1.5">
                    {(["7d", "30d", "all"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setEvolutionPeriod(p)}
                        className={`font-mono text-[10px] font-bold tracking-[0.1em] px-2.5 py-1 rounded-lg border transition-colors ${
                          evolutionPeriod === p
                            ? "border-rc-red text-rc-red bg-rc-red/5"
                            : "border-rc-border text-rc-hint hover:text-rc-text"
                        }`}
                      >
                        {p === "7d" ? "7D" : p === "30d" ? "30D" : "All"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 px-2 pb-2">
                  {!evoHasData ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <p className="font-mono text-[11px] text-rc-hint">No evolution to show yet.</p>
                      <p className="font-mono text-[10px] text-rc-hint/60 text-center max-w-[220px]">Run at least 2 analyses to track progress.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evoChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fill: "#9a9790", fontSize: 9, fontFamily: "monospace" }}
                          axisLine={{ stroke: "rgba(0,0,0,0.08)" }} tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]} reversed
                          tick={{ fill: "#9a9790", fontSize: 9, fontFamily: "monospace" }}
                          axisLine={false} tickLine={false} width={28}
                        />
                        <Tooltip content={(props: any) => (
                          <EvolutionTooltip {...props} evoGroups={evoGroups} evoLabels={evoLabels} />
                        )} />
                        {evoKeys.map((key, i) => (
                          <Line
                            key={key} type="monotone" dataKey={key}
                            stroke={EVO_PALETTE[i % EVO_PALETTE.length]}
                            strokeWidth={2}
                            dot={{ r: 3, fill: EVO_PALETTE[i % EVO_PALETTE.length], strokeWidth: 0 }}
                            activeDot={{ r: 4 }} connectNulls={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid gap-2.5" style={{ gridTemplateRows: "1fr 1fr 1fr" }}>
                {[
                  {
                    label: "Avg score",
                    value: overviewAvgRisk !== null ? `${overviewAvgRisk}%` : "—",
                    sub: overviewAvgRisk !== null && overviewAvgRisk < 40 ? "Low risk" : undefined,
                    good: overviewAvgRisk !== null && overviewAvgRisk < 40,
                  },
                  {
                    label: "Best run",
                    value: bestRun ? String(bestRun.result?.score ?? "—") : "—",
                    sub: bestRun
                      ? `${new Date(bestRun.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${bestRun.jobLabel || bestRun.result?.job_details?.title || ""}`
                      : undefined,
                    good: true,
                  },
                  {
                    label: "Worst run",
                    value: worstRun ? String(worstRun.result?.score ?? "—") : "—",
                    sub: worstRun
                      ? `${new Date(worstRun.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${worstRun.jobLabel || worstRun.result?.job_details?.title || ""}`
                      : undefined,
                    good: false,
                  },
                ].map(({ label, value, sub, good }) => (
                  <div key={label} className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-3.5">
                    <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint mb-1">{label}</p>
                    <p className={`font-black text-[22px] leading-none ${good ? "text-rc-green" : "text-rc-text"}`}>{value}</p>
                    {sub && <p className="font-mono text-[9px] text-rc-hint mt-0.5 truncate">{sub}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[15px] text-rc-text tracking-tight">
                  {t.account.analysisHistory}
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
                  {totalAnalyses} {t.account.results}
                </p>
              </div>

              <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                {/* Type toggle */}
                <div className="flex border-b border-[rgba(0,0,0,0.06)]">
                  {(["vs-job", "cv-review"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setAnalysisTypeFilter(type)}
                      className={`relative px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${analysisTypeFilter === type ? "text-rc-red" : "text-rc-hint hover:text-rc-text"}`}
                    >
                      {type === "vs-job" ? "Analyses vs. JD" : "Audits CV"}
                      {analysisTypeFilter === type && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-rc-red" />}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="flex items-center border-b border-[rgba(0,0,0,0.06)]">
                  <div className="flex-1 relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rc-hint" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                      type="text"
                      value={analysisSearch}
                      onChange={e => setAnalysisSearch(e.target.value)}
                      placeholder={t.account.search.analysesPlaceholder}
                      className="w-full bg-transparent pl-9 pr-4 py-3 font-mono text-[12px] text-rc-text placeholder:text-rc-hint outline-none"
                    />
                  </div>
                  {analysisSearch && (
                    <button
                      onClick={() => setAnalysisSearch("")}
                      className="px-4 py-3 font-mono text-[10px] text-rc-hint hover:text-rc-text transition-colors border-l border-[rgba(0,0,0,0.06)]"
                    >
                      Clear
                    </button>
                  )}
                  <Link
                    href={localePath("/analyze")}
                    className="px-4 py-3 font-mono text-[10px] font-bold tracking-[0.1em] text-rc-red no-underline hover:opacity-70 transition-opacity border-l border-[rgba(0,0,0,0.06)]"
                  >
                    + New analysis
                  </Link>
                </div>

                {/* Header */}
                <div
                  className="grid font-mono text-[9px] text-rc-hint font-bold tracking-[0.12em] uppercase px-4 py-2.5 bg-rc-surface-hero"
                  style={{ gridTemplateColumns: "40px 1.6fr 1fr 110px 100px 110px 70px" }}
                >
                  <div>{analysisTypeFilter === "cv-review" ? "Quality" : "Score"}</div>
                  <div>{analysisTypeFilter === "cv-review" ? "Profile" : "Position"}</div>
                  <div>{analysisTypeFilter === "cv-review" ? "—" : "Company"}</div>
                  <div>Date</div><div>Status</div><div>Note</div><div />
                </div>

                {/* Rows */}
                {loadingHistory ? (
                  <div className="p-8 text-center">
                    <span className="font-mono text-[11px] text-rc-hint animate-pulse">Loading…</span>
                  </div>
                ) : totalAnalyses === 0 ? (
                  <div className="p-16 flex flex-col items-center gap-4">
                    <FileText className="w-10 h-10 text-rc-hint/20" />
                    <p className="text-rc-muted font-medium">{t.account.noResults}</p>
                    <Link href={localePath("/analyze")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90">
                      {t.account.startNewAnalysis} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="font-mono text-[11px] text-rc-hint">{t.account.search.noResults} "{analysisSearch}"</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                    {filteredHistory.map(item => {
                      const isCvReview = !!item.result?.cv_quality;
                      const label = isCvReview
                        ? [item.result?.projected_profile?.seniority, item.result?.projected_profile?.target_roles?.[0]].filter(Boolean).join(' · ') || 'CV Audit'
                        : (item.jobLabel || item.result?.job_details?.title || "Developer");
                      const company = isCvReview ? null : (item.company ?? item.result?.job_details?.company ?? null);
                      const score = isCvReview ? (item.result?.cv_quality?.overall ?? 0) : (item.result?.score ?? 0);
                      const appStatus = isCvReview ? undefined : applications.find(a => a.company?.toLowerCase() === company?.toLowerCase())?.status;
                      const aiNote = isCvReview
                        ? { text: item.result?.projected_profile?.profile_type ?? "Audit", color: "text-rc-muted" }
                        : (score > 60 ? { text: "Tailor CV", color: "text-rc-red" } : { text: "Strong match", color: "text-rc-green" });
                      return (
                        <div
                          key={item.id}
                          className="grid items-center px-4 py-3 hover:bg-[#faf9f7] transition-colors text-[12px]"
                          style={{ gridTemplateColumns: "40px 1.6fr 1fr 110px 100px 110px 70px" }}
                        >
                          <ScoreCircle score={score} />
                          <Link href={localePath(`/analyze?id=${item.id}`)} className="font-semibold text-rc-text no-underline hover:text-rc-red transition-colors truncate pr-2">
                            {label}
                          </Link>
                          <span className="text-rc-muted truncate pr-2">{company || "—"}</span>
                          <span className="font-mono text-[10px] text-rc-hint">
                            {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                          </span>
                          <span className={`font-mono text-[10px] font-bold ${appStatus === "interviewing" ? "text-rc-amber" : "text-rc-hint"}`}>
                            {appStatus ? appStatus.charAt(0).toUpperCase() + appStatus.slice(1) : "—"}
                          </span>
                          <span className={`font-mono text-[10px] ${aiNote.color}`}>{aiNote.text}</span>
                          <div className="flex items-center gap-3 justify-end">
                            <Link href={localePath(`/analyze?id=${item.id}`)} className="text-rc-hint hover:text-rc-red transition-colors no-underline text-[14px]">→</Link>
                            <button onClick={e => handleOpenExport(e, item)} className="text-rc-hint hover:text-rc-text transition-colors text-[14px]">↓</button>
                            <button
                              onClick={e => handleDelete(e, item.id)}
                              disabled={isDeleting === item.id}
                              className="text-rc-hint hover:text-rc-red transition-colors disabled:opacity-30 text-[12px]"
                            >✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(0,0,0,0.05)]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
                    Page {analysisPage} / {Math.max(1, totalAnalysisPages)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={analysisPage === 1}
                      onClick={() => setAnalysisPage(p => p - 1)}
                      className="px-3.5 py-1.5 rounded-lg border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={analysisPage >= Math.max(1, totalAnalysisPages)}
                      onClick={() => setAnalysisPage(p => p + 1)}
                      className="px-3.5 py-1.5 rounded-lg border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart legend */}
              {evoHasData && evoKeys.length > 1 && (
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
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
              )}
            </div>
          </div>
        )}

        {/* ── APPLICATIONS ─────────────────────────────────────────────── */}
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
      </DashboardShell>

      {showSuccessModal && <SuccessModal onClose={() => setShowSuccessModal(false)} />}
      <ExportModal isOpen={!!exportItem} onClose={() => setExportItem(null)} result={exportItem?.result || null} />
      <BuyCreditsModal isOpen={isCreditsModalOpen} onClose={() => setIsCreditsModalOpen(false)} />
    </>
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
