"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Trash2, Plus, LogOut, AlertTriangle, CreditCard, Eye } from "lucide-react";
import { PdfPreviewModal } from "../PdfPreviewModal";
import { createClient } from "../../../lib/supabase";
import type { Profile, Subscription, SavedCv } from "../../../lib/queries";
import { useSavedCvs } from "../../../lib/queries";
import { useLanguage } from "../../../context/language";
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
  const { t } = useLanguage();
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

  const [displayName, setDisplayName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  const [githubUsername, setGithubUsername] = useState("");
  const [githubSaved, setGithubSaved] = useState(false);

  const [coverLetterName, setCoverLetterName] = useState("");
  const [coverLetterNameSaved, setCoverLetterNameSaved] = useState(false);

  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [linkedinUploading, setLinkedinUploading] = useState(false);
  const [linkedinSaved, setLinkedinSaved] = useState(false);
  const linkedinRef = useRef<HTMLInputElement>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? profile.username ?? "");
    setGithubUsername(profile.githubUsername ?? "");
    setCoverLetterName(profile.coverLetterName ?? "");
  }, [profile]);

  async function handleNameBlur() {
    const current = profile?.displayName ?? profile?.username ?? "";
    if (displayName === current) return;
    await updateProfile.mutateAsync({ displayName });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  async function handleGithubBlur() {
    const current = profile?.githubUsername ?? "";
    if (githubUsername === current) return;
    await updateProfile.mutateAsync({ githubUsername });
    setGithubSaved(true);
    setTimeout(() => setGithubSaved(false), 2000);
  }

  async function handleCoverLetterNameBlur() {
    const current = profile?.coverLetterName ?? "";
    if (coverLetterName === current) return;
    await updateProfile.mutateAsync({ coverLetterName });
    setCoverLetterNameSaved(true);
    setTimeout(() => setCoverLetterNameSaved(false), 2000);
  }

  async function handleLinkedinUpload(file: File) {
    if (!userId) return;
    setLinkedinUploading(true);
    try {
      const path = `${userId}/linkedin.pdf`;
      const { error } = await supabase.storage.from("user-profiles").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("user-profiles").getPublicUrl(path);
      await updateProfile.mutateAsync({ linkedinUrl: publicUrl });
      setLinkedinSaved(true);
      setTimeout(() => setLinkedinSaved(false), 2000);
    } finally {
      setLinkedinUploading(false);
      setLinkedinFile(null);
    }
  }

  async function handleCvUpload(file: File) {
    if (!userId) return;
    setCvUploading(true);
    try {
      const path = `${userId}/cvs/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("user-profiles").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("user-profiles").getPublicUrl(path);
      await addSavedCv.mutateAsync({ name: file.name, url: publicUrl });
    } finally {
      setCvUploading(false);
      setCvFile(null);
      if (cvRef.current) cvRef.current.value = "";
    }
  }

  async function handleDeleteAccount() {
    await deleteAccount.mutateAsync();
    await supabase.auth.signOut();
    window.location.href = `/${lang}`;
  }

  const isActive = subscription?.status === "active";
  const planLabel = subscription?.plan?.toUpperCase() ?? "FREE";

  return (
    <>
    {previewPdf && <PdfPreviewModal url={previewPdf.url} name={previewPdf.name} onClose={() => setPreviewPdf(null)} />}
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

      {/* ── Left column ─────────────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* Identity card */}
        <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
          <div className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-4">Identity</div>
          <div className="flex items-center gap-3 mb-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-rc-border" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center font-mono text-[14px] font-bold text-rc-hint">
                {email.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-rc-text truncate">{displayName || email}</p>
              <p className="font-mono text-[10px] text-rc-hint truncate">{email}</p>
            </div>
          </div>
          <label className="block mb-1 font-mono text-[9px] uppercase tracking-widest text-rc-hint">Display name</label>
          <div className="flex items-center gap-2">
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Your name"
              className="flex-1 bg-rc-bg border border-rc-border rounded px-3 py-2 text-[12px] text-rc-text outline-none focus:border-rc-red/30 transition-colors"
            />
            <SavedBadge show={nameSaved} />
          </div>
        </div>

        {/* Subscription card */}
        <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={13} className="text-rc-hint" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-rc-hint">Subscription</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-rc-text font-medium">{planLabel}</span>
            <span className={`font-mono text-[9px] px-2 py-0.5 rounded border ${isActive ? "border-rc-green/30 text-rc-green bg-rc-green/5" : "border-rc-hint/30 text-rc-hint"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="font-mono text-[10px] text-rc-hint mb-3">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {isActive ? (
            <button
              onClick={() => portalSession.mutate()}
              disabled={portalSession.isPending}
              className="w-full font-mono text-[9px] uppercase tracking-widest border border-rc-border text-rc-hint hover:text-rc-text hover:border-rc-red/30 rounded px-3 py-2 transition-all disabled:opacity-50"
            >
              {portalSession.isPending ? "Redirecting…" : "Manage billing"}
            </button>
          ) : (
            <Link
              href={`/${lang}/pricing`}
              className="block w-full text-center font-mono text-[9px] uppercase tracking-widest border border-rc-red/40 text-rc-red hover:bg-rc-red/5 rounded px-3 py-2 transition-all no-underline"
            >
              Upgrade plan
            </Link>
          )}
        </div>

        {/* Account / Danger zone */}
        <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
          <div className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-4">Account</div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-rc-hint hover:text-rc-text border border-rc-border hover:border-rc-red/20 rounded px-3 py-2 transition-all mb-2"
          >
            <LogOut size={11} />
            Sign out
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-rc-red/60 hover:text-rc-red border border-rc-red/20 hover:border-rc-red/40 rounded px-3 py-2 transition-all"
            >
              <Trash2 size={11} />
              Delete account
            </button>
          ) : (
            <div className="border border-rc-red/30 rounded p-3 bg-rc-red/[0.03]">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={11} className="text-rc-red" />
                <span className="font-mono text-[9px] text-rc-red uppercase tracking-widest">This cannot be undone</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccount.isPending}
                  className="flex-1 font-mono text-[9px] uppercase tracking-widest bg-rc-red text-white rounded px-3 py-1.5 transition-all hover:bg-[#c93a39] disabled:opacity-50"
                >
                  {deleteAccount.isPending ? "Deleting…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="font-mono text-[9px] uppercase tracking-widest text-rc-hint hover:text-rc-text border border-rc-border rounded px-3 py-1.5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right column ────────────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* Saved profile card */}
        <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
          <div className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-4">Saved profile — autofills /analyze</div>

          {/* GitHub */}
          <div className="mb-5">
            <label className="block mb-1.5 font-mono text-[9px] uppercase tracking-widest text-rc-hint">GitHub username</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-rc-hint pointer-events-none">github.com/</span>
                <input
                  value={githubUsername}
                  onChange={e => setGithubUsername(e.target.value)}
                  onBlur={handleGithubBlur}
                  placeholder="username"
                  className="w-full bg-rc-bg border border-rc-border rounded px-3 py-2 pl-[76px] text-[12px] font-mono text-rc-text outline-none focus:border-rc-red/30 transition-colors"
                />
              </div>
              <SavedBadge show={githubSaved} />
            </div>
          </div>

          {/* Cover letter name */}
          <div className="mb-5">
            <label className="block mb-1.5 font-mono text-[9px] uppercase tracking-widest text-rc-hint">{t.settingsTab.coverLetterNameLabel}</label>
            <div className="flex items-center gap-2">
              <input
                value={coverLetterName}
                onChange={e => setCoverLetterName(e.target.value)}
                onBlur={handleCoverLetterNameBlur}
                placeholder={t.settingsTab.coverLetterNamePlaceholder}
                className="flex-1 bg-rc-bg border border-rc-border rounded px-3 py-2 text-[12px] text-rc-text outline-none focus:border-rc-red/30 transition-colors"
              />
              <SavedBadge show={coverLetterNameSaved} />
            </div>
            <p className="mt-1 font-mono text-[9px] text-rc-hint">{t.settingsTab.coverLetterNameHint}</p>
          </div>

          {/* CVs */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-[9px] uppercase tracking-widest text-rc-hint">Saved CVs</label>
              <button
                onClick={() => cvRef.current?.click()}
                disabled={cvUploading}
                className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-rc-hint hover:text-rc-text border border-rc-border hover:border-rc-red/30 rounded px-2 py-1 transition-all disabled:opacity-50"
              >
                {cvUploading ? (
                  <span className="w-3 h-3 border border-rc-red/60 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={10} />
                )}
                Add CV
              </button>
              <input
                ref={cvRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCvUpload(f); }}
              />
            </div>
            {savedCvs.length === 0 ? (
              <p className="font-mono text-[10px] text-rc-hint/50 py-2">No CVs saved yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {savedCvs.map((cv: SavedCv) => (
                  <div key={cv.id} className="flex items-center gap-2 px-3 py-2 bg-rc-bg border border-rc-border rounded">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(201,58,57,0.6)" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="text-[12px] text-rc-text flex-1 truncate">{cv.name}</span>
                    <button
                      onClick={() => setPreviewPdf({ url: cv.url, name: cv.name })}
                      className="text-rc-hint/40 hover:text-rc-hint transition-colors"
                    >
                      <Eye size={11} />
                    </button>
                    <button
                      onClick={() => deleteSavedCv.mutate(cv.id)}
                      className="text-rc-hint/40 hover:text-rc-red transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-[9px] uppercase tracking-widest text-rc-hint">LinkedIn PDF</label>
              {linkedinSaved && <SavedBadge show={true} />}
            </div>
            {profile?.linkedinUrl ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-rc-bg border border-rc-green/30 rounded mb-2">
                <span className="font-mono text-[9px] font-bold text-[#5ba3d9] w-4 text-center">in</span>
                <span className="text-[12px] text-rc-text flex-1">linkedin.pdf</span>
                <button
                  onClick={() => setPreviewPdf({ url: profile.linkedinUrl!, name: "linkedin.pdf" })}
                  className="text-rc-hint/40 hover:text-rc-hint transition-colors"
                >
                  <Eye size={11} />
                </button>
                <span className="font-mono text-[9px] text-rc-green">✓ Saved</span>
              </div>
            ) : null}
            <button
              onClick={() => linkedinRef.current?.click()}
              disabled={linkedinUploading}
              className="w-full flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-rc-hint hover:text-[#5ba3d9] border border-rc-border hover:border-[#0a66c2]/30 rounded px-3 py-2 transition-all disabled:opacity-50"
            >
              {linkedinUploading ? (
                <span className="w-3 h-3 border border-[#0a66c2]/60 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              )}
              {profile?.linkedinUrl ? "Replace LinkedIn PDF" : "Upload LinkedIn PDF"}
            </button>
            <input
              ref={linkedinRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLinkedinUpload(f); }}
            />
          </div>
        </div>
      </div>

    </div>
    </>
  );
}
