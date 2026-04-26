"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Trash2, Plus, LogOut, AlertTriangle, CreditCard, Eye, Upload } from "lucide-react";
import { PdfPreviewModal } from "../PdfPreviewModal";
import { ChallengeHeatmap } from "../ChallengeHeatmap";
import { Heading, FieldLabel, Caption, Text } from "../typography";
import { Button } from "../Button";
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
    <Caption
      tone="green"
      className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}
    >
      Saved ✓
    </Caption>
  );
}

const inputClass =
  "flex-1 bg-rc-bg border border-rc-border rounded-md px-3 py-2 text-[14px] leading-5 text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors";

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
          <Heading as="h3" className="mb-4">Identity</Heading>
          <div className="flex items-center gap-3 mb-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-rc-border" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center text-[14px] font-semibold text-rc-muted">
                {email.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <Text as="p" weight="medium" className="truncate">{displayName || email}</Text>
              <Caption as="p" className="truncate">{email}</Caption>
            </div>
          </div>
          <FieldLabel htmlFor="display-name" className="block mb-1.5">Display name</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              id="display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Your name"
              className={inputClass}
            />
            <SavedBadge show={nameSaved} />
          </div>
        </div>

        {/* Subscription card */}
        <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} className="text-rc-muted" />
            <Heading as="h3">Subscription</Heading>
          </div>
          <div className="flex items-center justify-between mb-3">
            <Text weight="medium">{planLabel}</Text>
            <span
              className={`text-[12px] leading-4 font-medium px-2 py-0.5 rounded-md border ${
                isActive
                  ? "border-rc-green/30 text-rc-green bg-rc-green/5"
                  : "border-rc-border text-rc-muted"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {subscription?.currentPeriodEnd && (
            <Caption as="p" className="block mb-3">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </Caption>
          )}
          {isActive ? (
            <Button
              variant="default"
              block
              onClick={() => portalSession.mutate()}
              loading={portalSession.isPending}
            >
              {portalSession.isPending ? "Redirecting…" : "Manage billing"}
            </Button>
          ) : (
            <Button
              as={Link}
              href={`/${lang}/pricing`}
              variant="default"
              block
              className="!text-rc-red !border-rc-red/40 hover:!bg-rc-red/5 hover:!border-rc-red/60 no-underline"
            >
              Upgrade plan
            </Button>
          )}
        </div>

        {/* Account / Danger zone */}
        <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
          <Heading as="h3" className="mb-4">Account</Heading>
          <Button
            variant="default"
            block
            leadingIcon={<LogOut size={14} />}
            onClick={onSignOut}
            className="mb-2"
          >
            Sign out
          </Button>
          {!confirmDelete ? (
            <Button
              variant="danger"
              block
              leadingIcon={<Trash2 size={14} />}
              onClick={() => setConfirmDelete(true)}
            >
              Delete account
            </Button>
          ) : (
            <div className="border border-rc-red/30 rounded-md p-3 bg-rc-red/[0.03]">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={14} className="text-rc-red" />
                <Caption tone="red" className="font-medium">This cannot be undone</Caption>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  filled
                  size="sm"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  loading={deleteAccount.isPending}
                >
                  {deleteAccount.isPending ? "Deleting…" : "Confirm"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right column ────────────────────────────── */}
      <div className="flex flex-col gap-4">

        <ChallengeHeatmap />

        {/* Saved profile card */}
        <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
          <Heading as="h3">Saved profile</Heading>
          <Caption as="p" className="block mb-5">Autofills /analyze</Caption>

          {/* GitHub */}
          <div className="mb-5">
            <FieldLabel htmlFor="github-username" className="block mb-1.5">GitHub username</FieldLabel>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] leading-5 text-rc-hint pointer-events-none font-mono">
                  github.com/
                </span>
                <input
                  id="github-username"
                  value={githubUsername}
                  onChange={e => setGithubUsername(e.target.value)}
                  onBlur={handleGithubBlur}
                  placeholder="username"
                  className="w-full bg-rc-bg border border-rc-border rounded-md py-2 pl-[100px] pr-3 text-[14px] leading-5 font-mono text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors"
                />
              </div>
              <SavedBadge show={githubSaved} />
            </div>
          </div>

          {/* Cover letter name */}
          <div className="mb-5">
            <FieldLabel htmlFor="cover-letter-name" className="block mb-1.5">
              {t.settingsTab.coverLetterNameLabel}
            </FieldLabel>
            <div className="flex items-center gap-2">
              <input
                id="cover-letter-name"
                value={coverLetterName}
                onChange={e => setCoverLetterName(e.target.value)}
                onBlur={handleCoverLetterNameBlur}
                placeholder={t.settingsTab.coverLetterNamePlaceholder}
                className={inputClass}
              />
              <SavedBadge show={coverLetterNameSaved} />
            </div>
            <Caption as="p" className="block mt-1.5">{t.settingsTab.coverLetterNameHint}</Caption>
          </div>

          {/* CVs */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Saved CVs</FieldLabel>
              <Button
                variant="default"
                size="sm"
                leadingIcon={<Plus size={14} />}
                onClick={() => cvRef.current?.click()}
                loading={cvUploading}
              >
                Add CV
              </Button>
              <input
                ref={cvRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCvUpload(f); }}
              />
            </div>
            {savedCvs.length === 0 ? (
              <Caption as="p" tone="subtle" className="block py-2">No CVs saved yet.</Caption>
            ) : (
              <div className="flex flex-col gap-1.5">
                {savedCvs.map((cv: SavedCv) => (
                  <div key={cv.id} className="flex items-center gap-2 px-3 py-2 bg-rc-bg border border-rc-border rounded-md">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,58,57,0.6)" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <Text className="flex-1 truncate">{cv.name}</Text>
                    <button
                      onClick={() => setPreviewPdf({ url: cv.url, name: cv.name })}
                      className="text-rc-hint hover:text-rc-text transition-colors"
                      aria-label="Preview"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => deleteSavedCv.mutate(cv.id)}
                      className="text-rc-hint hover:text-rc-red transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>LinkedIn PDF</FieldLabel>
              <SavedBadge show={linkedinSaved} />
            </div>
            {profile?.linkedinUrl && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rc-bg border border-rc-green/30 rounded-md mb-2">
                <span className="text-[12px] font-bold text-[#0a66c2] w-4 text-center">in</span>
                <Text className="flex-1">linkedin.pdf</Text>
                <button
                  onClick={() => setPreviewPdf({ url: profile.linkedinUrl!, name: "linkedin.pdf" })}
                  className="text-rc-hint hover:text-rc-text transition-colors"
                  aria-label="Preview"
                >
                  <Eye size={14} />
                </button>
                <Caption tone="green">✓ Saved</Caption>
              </div>
            )}
            <Button
              variant="default"
              block
              leadingIcon={<Upload size={14} />}
              onClick={() => linkedinRef.current?.click()}
              loading={linkedinUploading}
            >
              {profile?.linkedinUrl ? "Replace LinkedIn PDF" : "Upload LinkedIn PDF"}
            </Button>
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
