"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../lib/supabase";
import { useAuth } from "../../context/auth";
import { useSubscription, useAnalysisHistory, useProfile, useInterviewHistory } from "../../lib/queries";
import { useDeleteAnalysis, useUpdateProfile } from "../../lib/mutations";
import { SuccessModal } from "../components/SuccessModal";
import {
  FileText,
  Clock,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Trash2,
  ArrowRight,
  Star,
  Trophy,
  Zap,
  Camera,
  User as UserIcon,
  MoreVertical,
  Download,
  Mic,
} from "lucide-react";
import { ExportModal } from "../components/ExportModal";

type HistoryItem = {
  id: number;
  jobDescription: string;
  createdAt: string;
  result: any;
};

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, session, loading: authLoading } = useAuth();

  // Pagination state
  const [analysisPage, setAnalysisPage] = useState(1);
  const [interviewPage, setInterviewPage] = useState(1);

  // Queries
  const { data: subscription } = useSubscription();
  const { data: profile } = useProfile();
  const { data: analysisData, isLoading: loadingHistory } = useAnalysisHistory(analysisPage);
  const { data: interviewData } = useInterviewHistory(interviewPage);

  const history = analysisData?.data ?? [];
  const interviewHistory = interviewData?.data ?? [];

  // Mutations
  const deleteAnalysis = useDeleteAnalysis();
  const updateProfile = useUpdateProfile();

  // UI state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [exportItem, setExportItem] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Show success modal on ?success=true
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  // Sync active subscription to localStorage
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

  // Profile sync: DB ↔ Supabase auth metadata
  useEffect(() => {
    if (!profile || !user) return;
    const metaUsername = user.user_metadata?.username;

    // DB missing username but metadata has it → push to DB
    if (!profile.username && metaUsername) {
      updateProfile.mutate({ username: metaUsername });
    }

    // DB has different username from metadata → push to metadata
    if (profile.username && profile.username !== metaUsername) {
      supabase.auth.updateUser({ data: { username: profile.username } });
    }
  }, [profile, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis?")) return;

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

  async function handleUpdateProfile(data: { username?: string; avatarUrl?: string }) {
    if (!user?.email) return;
    try {
      await updateProfile.mutateAsync(data);

      // Sync to Supabase auth metadata
      if (data.avatarUrl || data.username) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            ...(data.avatarUrl && { avatar_url: data.avatarUrl }),
            ...(data.username && { username: data.username }),
          },
        });
        if (authError) console.error("[Profile] Auth sync error:", authError);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  }

  async function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await handleUpdateProfile({ avatarUrl: publicUrl });
    } catch (err: any) {
      alert(`Error uploading image: ${err.message || "Unknown error"}.`);
      console.error("[Avatar Upload Error]", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    localStorage.removeItem("rc_subscription");
    router.push("/");
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!user) return null;

  const isActive = subscription?.status === "active";
  const planLabel = (subscription?.plan || "Rejected").toUpperCase();
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const totalAnalyses = analysisData?.total ?? 0;
  const avgRiskScore = history.length > 0
    ? Math.round(history.reduce((acc, curr) => acc + (curr.result?.score || 0), 0) / history.length)
    : 0;
  const jobsTargeted = new Set(history.map(h => h.result?.job_details?.title || h.jobDescription)).size;

  const totalAnalysisPages = Math.ceil(totalAnalyses / 10);
  const totalInterviews = interviewData?.total ?? 0;
  const totalInterviewPages = Math.ceil(totalInterviews / 10);

  const getScoreColor = (score: number) => {
    if (score < 40) return "border-rc-green/30 text-rc-green bg-rc-green/5";
    if (score < 70) return "border-rc-amber/40 text-rc-amber bg-rc-amber/5";
    return "border-rc-red/30 text-rc-red bg-rc-red/5";
  };

  const displayName = profile?.username || user.user_metadata?.username || user.email?.split("@")[0] || "User";
  const userInitials = displayName.substring(0, 2).toUpperCase();
  const avatarUrl = profile?.avatarUrl || user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans flex flex-col items-center">
      {/* Navigation */}
      <nav className="w-full flex items-center justify-between px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={32} height={32} />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/analyze" className="font-mono text-[11px] tracking-widest uppercase text-rc-hint hover:text-rc-text transition-colors no-underline">Analyze</Link>
          <Link href="/pricing" className="font-mono text-[11px] tracking-widest uppercase text-rc-red hover:opacity-80 transition-opacity no-underline">Pricing</Link>
          <Link href="/account" className="flex items-center gap-2.5 group no-underline">
            <div className="w-8 h-8 rounded-full bg-rc-red/5 border border-rc-red/10 flex items-center justify-center text-[11px] font-black text-rc-red group-hover:bg-rc-red/10 transition-colors overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="PP" className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
          </Link>
        </div>
      </nav>

      <div className="max-w-[1200px] w-full px-5 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-6">

            {/* Profile Card */}
            <div className="bg-white border border-rc-border rounded-[24px] overflow-hidden shadow-sm p-8 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6 group cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-full h-full rounded-full bg-rc-red/5 border border-rc-red/10 flex items-center justify-center text-rc-red text-3xl font-black shadow-inner overflow-hidden relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                    <div className="w-5 h-5 border-2 border-rc-red border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="space-y-1 mb-6 group relative">
                {isEditingName ? (
                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      className="w-full text-center bg-rc-bg border border-rc-red/20 rounded-lg px-3 py-1 text-sm font-bold outline-none focus:border-rc-red/50"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === "Enter") { handleUpdateProfile({ username: tempName }); setIsEditingName(false); }
                        else if (e.key === "Escape") { setIsEditingName(false); setTempName(displayName); }
                      }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { handleUpdateProfile({ username: tempName }); setIsEditingName(false); }} className="text-[10px] font-mono uppercase tracking-widest text-rc-red hover:underline">Save</button>
                      <button onClick={() => { setIsEditingName(false); setTempName(displayName); }} className="text-[10px] font-mono uppercase tracking-widest text-rc-hint hover:underline">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 group-hover:translate-x-2 transition-transform">
                      <h1 className="text-xl font-bold tracking-tight text-rc-text truncate">{displayName}</h1>
                      <button onClick={() => { setTempName(displayName); setIsEditingName(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rc-bg rounded-md">
                        <UserIcon className="w-3.5 h-3.5 text-rc-hint" />
                      </button>
                    </div>
                    <p className="text-rc-hint font-medium text-xs truncate">{user.email}</p>
                  </>
                )}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rc-red/5 border border-rc-red/10 mb-8">
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-rc-red animate-pulse" : "bg-rc-hint"}`} />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">{planLabel}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-6 border-t border-rc-border/50">
                <div className="space-y-1.5 flex flex-col items-center">
                  <FileText className="w-3 h-3 text-rc-hint" />
                  <div className="text-center">
                    <p className="text-lg font-black text-rc-red">{totalAnalyses}</p>
                    <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">Analyses</p>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col items-center border-x border-rc-border/50">
                  <Zap className="w-3 h-3 text-rc-hint" />
                  <div className="text-center">
                    <p className="text-lg font-black text-rc-red">{avgRiskScore}</p>
                    <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">Risk</p>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col items-center">
                  <Trophy className="w-3 h-3 text-rc-hint" />
                  <div className="text-center">
                    <p className="text-lg font-black text-rc-red">{jobsTargeted}</p>
                    <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">Jobs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Info Card */}
            <div className="bg-white border border-rc-border rounded-[24px] p-6 shadow-sm space-y-4">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint font-bold">Subscription</p>
              <div className="space-y-1">
                <p className="text-sm font-bold text-rc-text">{planLabel} {isActive ? "Active" : "Expired"}</p>
                {isActive && periodEnd && (
                  <p className="text-[11px] text-rc-muted font-mono">Next billing: {periodEnd}</p>
                )}
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/pricing" className="w-full py-2 bg-rc-red text-white rounded-lg font-mono text-[10px] tracking-widest uppercase text-center no-underline hover:opacity-90 transition-opacity">Upgrade →</Link>
                <button className="w-full py-2 bg-rc-bg border border-rc-border rounded-lg font-mono text-[10px] tracking-widest uppercase text-rc-hint opacity-50 cursor-not-allowed">Manage</button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-rc-border rounded-[24px] p-6 shadow-sm space-y-4">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint font-bold">Actions</p>
              <div className="space-y-2">
                <button onClick={handleSignOut} disabled={signingOut} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-rc-bg transition-colors group">
                  <span className="text-sm font-medium text-rc-text group-hover:text-rc-red transition-colors">Sign out</span>
                  <LogOut className="w-4 h-4 text-rc-hint group-hover:text-rc-red" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl opacity-30 cursor-not-allowed">
                  <span className="text-sm font-medium text-rc-red">Delete account</span>
                  <Trash2 className="w-4 h-4 text-rc-red" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-rc-text flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-rc-red" /> Analysis History
              </h2>
              <div className="h-px flex-1 bg-rc-border" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">{totalAnalyses} result{totalAnalyses !== 1 ? "s" : ""}</p>
            </div>

            <div className="space-y-4">
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-rc-surface rounded-[24px] animate-pulse" />)}
                </div>
              ) : totalAnalyses === 0 ? (
                <div className="p-16 text-center bg-white border border-rc-border rounded-[24px] border-dashed space-y-4">
                  <FileText className="w-12 h-12 text-rc-hint/20 mx-auto" />
                  <p className="text-rc-muted font-medium">No results found yet.</p>
                  <Link href="/analyze" className="inline-flex items-center gap-2 px-6 py-3 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90">Start New Analysis <ArrowRight className="w-3 h-3" /></Link>
                </div>
              ) : (
                history.map(item => {
                  const jobTitle = item.result?.job_details?.title || "Developer";
                  const company = item.result?.job_details?.company || "Unknown Company";
                  const score = item.result?.score ?? 0;

                  return (
                    <div key={item.id} className="relative group">
                      <Link
                        href={`/analyze?id=${item.id}`}
                        className={`flex items-center justify-between p-6 bg-white border border-rc-border rounded-[24px] hover:border-rc-red/20 group/card transition-all no-underline shadow-sm ${isDeleting === item.id ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black shadow-sm transition-transform group-hover/card:scale-105 ${getScoreColor(score)}`}>
                            {score}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-rc-text tracking-tight flex items-center gap-2 group-hover/card:text-rc-red transition-colors">
                              {jobTitle} <span className="text-rc-hint/50 font-normal group-hover/card:text-rc-red/30">•</span> {company}
                            </h3>
                            <p className="font-mono text-[11px] uppercase tracking-widest text-rc-hint flex items-center gap-2">
                              <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pr-12">
                          <span className="font-mono text-[10px] tracking-widest uppercase text-rc-hint opacity-10 font-bold group-hover/card:opacity-100 group-hover/card:text-rc-red transition-all">Details</span>
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
                            <span className="font-semibold">Export Report</span>
                          </button>
                          <button onClick={e => handleDelete(e, item.id)} className="w-full flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-rc-red/5 text-rc-red transition-colors group/del">
                            <Trash2 className="w-4 h-4 group-hover/del:rotate-12 transition-transform" />
                            <span className="font-semibold">Delete Analysis</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {totalAnalysisPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
                    Page {analysisPage} / {totalAnalysisPages}
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
                      disabled={analysisPage === totalAnalysisPages}
                      onClick={() => setAnalysisPage(p => p + 1)}
                      className="px-4 py-2 rounded-xl border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Interview History */}
            {totalInterviews > 0 && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold tracking-tight text-rc-text flex items-center gap-3">
                    <Mic className="w-5 h-5 text-rc-red" /> AI Interviews
                  </h2>
                  <div className="h-px flex-1 bg-rc-border" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
                    {totalInterviews} attempt{totalInterviews !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-y-3">
                  {interviewHistory.map((attempt, i) => {
                    const score = attempt.globalScore;
                    const scoreColor = score === null
                      ? "border-rc-border text-rc-hint bg-rc-surface"
                      : score >= 7 ? "border-green-500/30 text-green-400 bg-green-500/5"
                      : score >= 4 ? "border-amber-500/30 text-amber-400 bg-amber-500/5"
                      : "border-rc-red/30 text-rc-red bg-rc-red/5";
                    const globalIndex = totalInterviews - ((interviewPage - 1) * 10) - i;

                    return (
                      <Link
                        key={attempt.id}
                        href={`/analyze?id=${attempt.analysisId}&tab=interview&interviewId=${attempt.id}`}
                        className="flex items-center justify-between p-5 bg-white border border-rc-border rounded-[20px] hover:border-rc-red/20 transition-all no-underline shadow-sm group/card"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black ${scoreColor}`}>
                            {score !== null ? score : "—"}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-rc-text tracking-tight group-hover/card:text-rc-red transition-colors">
                              Interview #{globalIndex}
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
                          <span className="font-mono text-[10px] tracking-widest uppercase text-rc-red opacity-0 group-hover/card:opacity-100 transition-all">View</span>
                          <ChevronRight className="w-4 h-4 text-rc-hint/30 group-hover/card:text-rc-red transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {totalInterviewPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
                      Page {interviewPage} / {totalInterviewPages}
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
                        disabled={interviewPage === totalInterviewPages}
                        onClick={() => setInterviewPage(p => p + 1)}
                        className="px-4 py-2 rounded-xl border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pt-12 pb-24 text-center space-y-2 opacity-30">
          <p className="font-mono text-[9px] tracking-widest uppercase text-rc-hint">RejectCheck Premium · SECURE SESSION</p>
          <p className="text-[10px] text-rc-muted">ID: {user.id} · UTC: {new Date().toISOString()}</p>
        </div>
      </div>

      {showSuccessModal && <SuccessModal onClose={() => setShowSuccessModal(false)} />}
      <ExportModal isOpen={!!exportItem} onClose={() => setExportItem(null)} result={exportItem?.result || null} />
    </div>
  );
}

export default function UserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
