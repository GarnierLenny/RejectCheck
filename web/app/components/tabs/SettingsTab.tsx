"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Plus, LogOut, AlertTriangle, CreditCard } from "lucide-react";
import { createClient } from "../../../lib/supabase";
import type { Profile, Subscription } from "../../../lib/queries";
import { useSavedCvs } from "../../../lib/queries";
import type { Session } from "@supabase/supabase-js";
import {
  useCreatePortalSession,
  useDeleteAccount,
  useUpdateProfile,
  useAddSavedCv,
  useDeleteSavedCv,
} from "../../../lib/mutations";

interface SettingsTabProps {
  profile: Profile | null;
  profileLoading: boolean;
  subscription: Subscription | null;
  session: Session | null;
  onSignOut: () => void;
  lang: string;
}

function SavedBadge({ show }: { show: boolean }) {
  return (
    <span className={`font-mono text-[10px] text-green-600 transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}>
      Saved ✓
    </span>
  );
}

export function SettingsTab({ profile, profileLoading, subscription, session, onSignOut, lang }: SettingsTabProps) {
  const router = useRouter();
  const supabase = createClient();
  const updateProfile = useUpdateProfile();
  const portalSession = useCreatePortalSession();
  const deleteAccount = useDeleteAccount();
  const addSavedCv = useAddSavedCv();
  const deleteSavedCv = useDeleteSavedCv();
  const { data: savedCvs = [] } = useSavedCvs();

  const userId = session?.user?.id;
  const email = session?.user?.email ?? "";
  const avatarUrl = profile?.avatarUrl || session?.user?.user_metadata?.avatar_url;

  // Display name — fall back to username (old field) for existing users
  const resolvedName = profile?.displayName ?? profile?.username ?? "";
  const [displayName, setDisplayName] = useState(resolvedName);
  const [nameSaved, setNameSaved] = useState(false);

  // GitHub
  const [githubUsername, setGithubUsername] = useState(profile?.githubUsername ?? "");
  const [githubSaved, setGithubSaved] = useState(false);

  // LinkedIn (single)
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl ?? "");
  const [linkedinUploading, setLinkedinUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const [cvUploading, setCvUploading] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? profile.username ?? "");
    setGithubUsername(profile.githubUsername ?? "");
    setLinkedinUrl(profile.linkedinUrl ?? "");
  }, [profile]);

  function flash(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  async function handleNameBlur() {
    const current = profile?.displayName ?? profile?.username ?? "";
    if (displayName === current) return;
    await updateProfile.mutateAsync({ displayName });
    flash(setNameSaved);
  }

  async function handleGithubBlur() {
    if (githubUsername === (profile?.githubUsername ?? "")) return;
    await updateProfile.mutateAsync({ githubUsername });
    flash(setGithubSaved);
  }

  async function uploadToStorage(file: File, path: string): Promise<string | null> {
    setUploadError(null);
    const { error } = await supabase.storage.from("user-profiles").upload(path, file, { upsert: true });
    if (error) {
      setUploadError(error.message?.toLowerCase().includes("bucket")
        ? "Storage bucket not configured. Create a public bucket named 'user-profiles'."
        : error.message);
      return null;
    }
    const { data } = supabase.storage.from("user-profiles").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setCvUploading(true);
    try {
      const path = `${userId}/cvs/${Date.now()}-${file.name}`;
      const url = await uploadToStorage(file, path);
      if (url) await addSavedCv.mutateAsync({ name: file.name, url });
    } finally {
      setCvUploading(false);
      if (cvInputRef.current) cvInputRef.current.value = "";
    }
  }

  async function handleLinkedinUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setLinkedinUploading(true);
    try {
      const url = await uploadToStorage(file, `${userId}/linkedin.pdf`);
      if (url) {
        setLinkedinUrl(url);
        await updateProfile.mutateAsync({ linkedinUrl: url });
      }
    } finally {
      setLinkedinUploading(false);
    }
  }

  async function handleRemoveLinkedin() {
    setLinkedinUrl("");
    await updateProfile.mutateAsync({ linkedinUrl: "" });
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAccount.mutateAsync();
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Delete account failed:", err);
      setDeleting(false);
    }
  }

  const initials = (displayName || email).charAt(0).toUpperCase();
  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : null;
  const isActive = subscription?.status === "active";
  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const cardClass = "bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5";
  const inputClass = "w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#D94040]/50 bg-white";
  const labelClass = "font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start w-full">

      {/* LEFT COLUMN */}
      <div className="space-y-4">

        {/* Identity card */}
        <div className={cardClass}>
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-[rgba(0,0,0,0.06)]">
            <div className="w-16 h-16 rounded-full bg-[#D94040] flex items-center justify-center text-white text-[22px] font-bold shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight">{displayName || email.split("@")[0]}</p>
              <p className="font-mono text-[10px] text-gray-400 mt-0.5">{email}</p>
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Display name</label>
              <SavedBadge show={nameSaved} />
            </div>
            <input
              className={inputClass}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Your name"
            />
          </div>
        </div>

        {/* Subscription */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400 font-semibold">Subscription</p>
          </div>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D94040]/5 border border-[#D94040]/15">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-[#D94040] animate-pulse" : "bg-gray-300"}`} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#D94040] font-bold">{planLabel}</span>
                </span>
                {isActive && renewalDate && (
                  <span className="font-mono text-[9px] text-gray-400">Renews {renewalDate}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => portalSession.mutate()}
                  disabled={portalSession.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(0,0,0,0.08)] font-mono text-[10px] uppercase tracking-widest text-gray-600 hover:border-[#D94040]/30 hover:text-[#D94040] transition-all disabled:opacity-50 w-full justify-center"
                >
                  {portalSession.isPending
                    ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    : <CreditCard className="w-3 h-3" />
                  }
                  Manage billing
                </button>
                {subscription.plan !== "hired" && (
                  <Link
                    href={`/${lang}/pricing`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#D94040] text-white font-mono text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity no-underline"
                  >
                    Upgrade to HIRED →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] text-gray-500">You're on the <span className="font-semibold text-gray-700">Free</span> plan.</p>
              <Link
                href={`/${lang}/pricing`}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#D94040] text-white font-mono text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity no-underline"
              >
                Upgrade →
              </Link>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400 font-semibold">Account</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(0,0,0,0.08)] font-mono text-[10px] uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-3 h-3" /> Sign out
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D94040]/30 font-mono text-[10px] uppercase tracking-widest text-[#D94040] hover:bg-[#D94040]/5 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete account
              </button>
            ) : (
              <div className="space-y-2 p-3 rounded-lg border border-[#D94040]/30 bg-[#D94040]/[0.02]">
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Type <span className="font-mono font-bold">DELETE</span> to permanently delete all your data.
                </p>
                <input
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-[#D94040]/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "DELETE" || deleting}
                    className="flex-1 py-1.5 rounded-lg bg-[#D94040] text-white font-mono text-[9px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-opacity"
                  >
                    {deleting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Confirm
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                    className="flex-1 py-1.5 rounded-lg border border-[rgba(0,0,0,0.1)] font-mono text-[9px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — Saved Profile */}
      <div className={`${cardClass} space-y-5`}>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400 font-semibold">Saved Profile</p>
          <p className="text-[12px] text-gray-400 mt-1">Pre-fills your analysis form automatically.</p>
        </div>

        {uploadError && (
          <div className="px-3 py-2 rounded-lg bg-[#D94040]/5 border border-[#D94040]/20">
            <p className="text-[11px] text-[#D94040]">{uploadError}</p>
          </div>
        )}

        {/* GitHub */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={labelClass}>GitHub username</label>
            <SavedBadge show={githubSaved} />
          </div>
          <input
            className={inputClass}
            value={githubUsername}
            onChange={e => setGithubUsername(e.target.value)}
            onBlur={handleGithubBlur}
            placeholder="your-github-handle"
          />
        </div>

        {/* CVs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelClass}>CVs ({savedCvs.length})</label>
            <button
              onClick={() => cvInputRef.current?.click()}
              disabled={cvUploading}
              className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-gray-500 hover:text-[#D94040] transition-colors disabled:opacity-50"
            >
              {cvUploading
                ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                : <Plus className="w-3 h-3" />
              }
              Add CV
            </button>
          </div>
          <input ref={cvInputRef} type="file" accept=".pdf" className="hidden" onChange={handleCvUpload} />

          {savedCvs.length === 0 ? (
            <button
              onClick={() => cvInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[rgba(0,0,0,0.12)] rounded-lg text-[12px] text-gray-400 hover:border-[#D94040]/40 hover:text-[#D94040] transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Upload your first CV
            </button>
          ) : (
            <div className="space-y-1.5">
              {savedCvs.map(cv => (
                <div key={cv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[rgba(0,0,0,0.08)] bg-gray-50/50">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D94040" strokeWidth="1.5" className="shrink-0">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="flex-1 text-[12px] text-gray-700 truncate">{cv.name}</span>
                  <span className="font-mono text-[9px] text-gray-400 shrink-0">
                    {new Date(cv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <button
                    onClick={() => deleteSavedCv.mutate(cv.id)}
                    className="p-1 rounded text-gray-300 hover:text-[#D94040] hover:bg-[#D94040]/5 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LinkedIn */}
        <div className="space-y-1.5">
          <label className={labelClass}>LinkedIn PDF</label>
          {linkedinUrl ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[rgba(0,0,0,0.08)] bg-gray-50/50">
              <div className="w-5 h-5 rounded bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                <span className="font-mono text-[7px] font-bold text-[#0A66C2]">in</span>
              </div>
              <span className="flex-1 text-[12px] text-gray-700">linkedin.pdf</span>
              <button onClick={handleRemoveLinkedin} className="font-mono text-[9px] text-[#D94040] hover:underline shrink-0">
                Remove
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => linkedinInputRef.current?.click()}
                disabled={linkedinUploading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(0,0,0,0.1)] text-[12px] text-gray-600 hover:border-[#D94040]/40 hover:text-[#D94040] transition-all disabled:opacity-50"
              >
                {linkedinUploading && <span className="w-3.5 h-3.5 border-2 border-[#D94040] border-t-transparent rounded-full animate-spin" />}
                Upload LinkedIn PDF
              </button>
              <input ref={linkedinInputRef} type="file" accept=".pdf" className="hidden" onChange={handleLinkedinUpload} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
