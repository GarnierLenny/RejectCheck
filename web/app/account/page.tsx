"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { SuccessModal } from "../components/SuccessModal";
import { 
  FileText, 
  Clock, 
  ChevronRight, 
  LayoutGrid, 
  LogOut, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  Star,
  Trophy,
  Zap,
  Camera,
  User as UserIcon
} from "lucide-react";

type HistoryItem = {
  id: number;
  jobDescription: string;
  createdAt: string;
  result: any;
};

type Profile = {
  username: string | null;
  avatarUrl: string | null;
};

type Subscription = {
  plan: string;
  status: string;
  currentPeriodEnd: string;
} | null;

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSub, setLoadingSub] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccessModal(true);
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const currentUser = data.session.user;
      setUser(currentUser);

      if (currentUser.email) {
        setLoadingSub(true);
        setLoadingHistory(true);
        
        // Parallel fetch for sub, history and profile
        Promise.all([
          fetch(`${apiUrl}/api/stripe/subscription?email=${encodeURIComponent(currentUser.email)}`).then(r => r.ok ? r.json() : null),
          fetch(`${apiUrl}/api/analyze/history?email=${encodeURIComponent(currentUser.email)}`).then(r => r.ok ? r.json() : []),
          fetch(`${apiUrl}/api/analyze/profile?email=${encodeURIComponent(currentUser.email)}`).then(r => r.ok ? r.json() : null)
        ]).then(([subData, historyData, profileData]) => {
          if (subData) {
            setSubscription(subData);
            if (subData.status === 'active') {
              localStorage.setItem('rc_subscription', JSON.stringify({
                plan: subData.plan,
                email: currentUser.email,
                expiry: new Date(subData.currentPeriodEnd).getTime(),
              }));
            }
          }
          setHistory(historyData);
          setProfile(profileData);

          // If profile missing username but metadata has it, sync to DB
          const metaUsername = currentUser.user_metadata?.username;
          if (profileData && !profileData.username && metaUsername) {
            handleUpdateProfile({ username: metaUsername });
          }
          
          // If DB has username but metadata is different, sync to metadata
          if (profileData?.username && profileData.username !== metaUsername) {
            supabase.auth.updateUser({
              data: { username: profileData.username }
            }).then(() => {
              // Refresh user state to reflect metadata change mapping to initials
              supabase.auth.getUser().then(({ data: { user: updatedUser } }) => {
                if (updatedUser) setUser(updatedUser);
              });
            });
          }

          setLoadingSub(false);
          setLoadingHistory(false);
        }).catch(() => {
          setLoadingSub(false);
          setLoadingHistory(false);
        });
      }
      setLoading(false);
    });
  }, [searchParams, router, supabase.auth]);

  async function handleUpdateProfile(data: Partial<Profile>) {
    if (!user?.email) return;
    console.log("[Profile] Updating with data:", data);
    try {
      const res = await fetch(`${apiUrl}/api/analyze/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, ...data })
      });
      if (res.ok) {
        const updated = await res.json();
        console.log("[Profile] Updated success:", updated);
        setProfile(updated);

        // Sync to Supabase Auth metadata
        if (data.avatarUrl || data.username) {
          console.log("[Profile] Syncing to Auth metadata...");
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              ...(data.avatarUrl && { avatar_url: data.avatarUrl }),
              ...(data.username && { username: data.username }),
            }
          });
          if (authError) console.error("[Profile] Auth sync error:", authError);
        }
      } else {
        console.error("[Profile] Update failed:", await res.text());
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await handleUpdateProfile({ avatarUrl: publicUrl });
    } catch (err: any) {
      alert(`Error uploading image: ${err.message || "Unknown error"}. Check if the 'avatars' bucket exists in Supabase.`);
      console.error("[Avatar Upload Error]", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    localStorage.removeItem('rc_subscription');
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    );
  }

  const planLabel = (subscription?.plan || "Rejected").toUpperCase();
  const isActive = subscription?.status === "active";
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // Stats calculation
  const totalAnalyses = history.length;
  const avgRiskScore = totalAnalyses > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.result?.score || 0), 0) / totalAnalyses)
    : 0;
  const jobsTargeted = new Set(history.map(h => h.result?.job_details?.title || h.jobDescription)).size;

  const getScoreColor = (score: number) => {
    if (score < 40) return "border-rc-green/30 text-rc-green bg-rc-green/5";
    if (score < 70) return "border-rc-amber/40 text-rc-amber bg-rc-amber/5";
    return "border-rc-red/30 text-rc-red bg-rc-red/5";
  };

  const displayName = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || "User";
  const userInitials = displayName.substring(0, 2).toUpperCase();

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
          <Link
            href="/account"
            className="flex items-center gap-2.5 group no-underline"
          >
            <div className="w-8 h-8 rounded-full bg-rc-red/5 border border-rc-red/10 flex items-center justify-center text-[11px] font-black text-rc-red group-hover:bg-rc-red/10 transition-colors overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="PP" className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
          </Link>
        </div>
      </nav>

      <div className="max-w-[1200px] w-full px-5 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white border border-rc-border rounded-[24px] overflow-hidden shadow-sm p-8 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6 group cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-full h-full rounded-full bg-rc-red/5 border border-rc-red/10 flex items-center justify-center text-rc-red text-3xl font-black shadow-inner overflow-hidden relative">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full text-center bg-rc-bg border border-rc-red/20 rounded-lg px-3 py-1 text-sm font-bold outline-none focus:border-rc-red/50"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateProfile({ username: tempName });
                          setIsEditingName(false);
                        } else if (e.key === 'Escape') {
                          setIsEditingName(false);
                          setTempName(displayName);
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          handleUpdateProfile({ username: tempName });
                          setIsEditingName(false);
                        }}
                        className="text-[10px] font-mono uppercase tracking-widest text-rc-red hover:underline"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingName(false);
                          setTempName(displayName);
                        }}
                        className="text-[10px] font-mono uppercase tracking-widest text-rc-hint hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 group-hover:translate-x-2 transition-transform">
                      <h1 className="text-xl font-bold tracking-tight text-rc-text truncate">{displayName}</h1>
                      <button 
                        onClick={() => {
                          setTempName(displayName);
                          setIsEditingName(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rc-bg rounded-md"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-rc-hint" />
                      </button>
                    </div>
                    <p className="text-rc-hint font-medium text-xs truncate">{user?.email}</p>
                  </>
                )}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rc-red/5 border border-rc-red/10 mb-8">
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-rc-red animate-pulse' : 'bg-rc-hint'}`} />
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
                <p className="text-sm font-bold text-rc-text">{planLabel} {isActive ? 'Active' : 'Expired'}</p>
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

          {/* RIGHT COLUMN: History (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-rc-text flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-rc-red" /> Analysis History
              </h2>
              <div className="h-px flex-1 bg-rc-border" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">{totalAnalyses} results</p>
            </div>

            <div className="space-y-4">
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-rc-surface rounded-[24px] animate-pulse" />)}
                </div>
              ) : history.length === 0 ? (
                <div className="p-16 text-center bg-white border border-rc-border rounded-[24px] border-dashed space-y-4">
                  <FileText className="w-12 h-12 text-rc-hint/20 mx-auto" />
                  <p className="text-rc-muted font-medium">No results found yet.</p>
                  <Link href="/analyze" className="inline-flex items-center gap-2 px-6 py-3 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90">Start New Analysis <ArrowRight className="w-3 h-3" /></Link>
                </div>
              ) : (
                history.map((item) => {
                  const jobTitle = item.result?.job_details?.title || "Developer";
                  const company = item.result?.job_details?.company || "Unknown Company";
                  const score = item.result?.score ?? 0;
                  
                  return (
                    <Link 
                      key={item.id} 
                      href={`/analyze?id=${item.id}`}
                      className="flex items-center justify-between p-6 bg-white border border-rc-border rounded-[24px] hover:border-rc-red/20 group transition-all no-underline shadow-sm"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black shadow-sm transition-transform group-hover:scale-105 ${getScoreColor(score)}`}>
                          {score}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-rc-text tracking-tight flex items-center gap-2 group-hover:text-rc-red transition-colors">
                            {jobTitle} <span className="text-rc-hint/50 font-normal group-hover:text-rc-red/30">•</span> {company}
                          </h3>
                          <p className="font-mono text-[11px] uppercase tracking-widest text-rc-hint flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] tracking-widest uppercase text-rc-hint opacity-10 font-bold group-hover:opacity-100 group-hover:text-rc-red transition-all">Details</span>
                        <ChevronRight className="w-5 h-5 text-rc-hint/30 group-hover:text-rc-red transition-all" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-12 pb-24 text-center space-y-2 opacity-30">
          <p className="font-mono text-[9px] tracking-widest uppercase text-rc-hint">RejectCheck Premium • SECURE SESSION</p>
          <p className="text-[10px] text-rc-muted">ID: {user?.id} • UTC: {new Date().toISOString()}</p>
        </div>
      </div>

      {showSuccessModal && (
        <SuccessModal onClose={() => setShowSuccessModal(false)} />
      )}
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
