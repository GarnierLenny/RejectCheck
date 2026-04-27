"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Upload } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Heading, FieldLabel, Caption, Text } from "../typography";
import { Button } from "../Button";
import { GithubIcon, LinkedinIcon } from "../SocialIcons";
import { PdfPreviewModal } from "../PdfPreviewModal";
import { createClient } from "../../../lib/supabase";
import { useLanguage } from "../../../context/language";
import { useUpdateProfile } from "../../../lib/mutations";
import type { Profile } from "../../../lib/queries";

const inputClass =
  "w-full bg-rc-bg border border-rc-border rounded-md px-3 py-2 text-[14px] leading-5 text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors";

function SavedBadge({ show, label }: { show: boolean; label: string }) {
  return (
    <Caption
      tone="green"
      className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}
    >
      {label}
    </Caption>
  );
}

export function AutofillAnalyzeSettings({
  profile,
  session,
}: {
  profile: Profile | null;
  session: Session | null;
}) {
  const { t } = useLanguage();
  const supabase = createClient();
  const updateProfile = useUpdateProfile();
  const userId = session?.user?.id;

  const [githubUsername, setGithubUsername] = useState("");
  const [githubSaved, setGithubSaved] = useState(false);

  const [coverLetterName, setCoverLetterName] = useState("");
  const [coverLetterNameSaved, setCoverLetterNameSaved] = useState(false);

  const [linkedinUploading, setLinkedinUploading] = useState(false);
  const [linkedinSaved, setLinkedinSaved] = useState(false);
  const linkedinRef = useRef<HTMLInputElement>(null);

  const [previewPdf, setPreviewPdf] = useState<{
    url: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setGithubUsername(profile.githubUsername ?? "");
    setCoverLetterName(profile.coverLetterName ?? "");
  }, [profile]);

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
      const { error } = await supabase.storage
        .from("user-profiles")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-profiles").getPublicUrl(path);
      await updateProfile.mutateAsync({ linkedinUrl: publicUrl });
      setLinkedinSaved(true);
      setTimeout(() => setLinkedinSaved(false), 2000);
    } finally {
      setLinkedinUploading(false);
    }
  }

  return (
    <>
      {previewPdf && (
        <PdfPreviewModal
          url={previewPdf.url}
          name={previewPdf.name}
          onClose={() => setPreviewPdf(null)}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[640px]">
        <header className="border-b border-rc-border pb-4">
          <Heading as="h2" size="lg">
            {t.settingsTab.autofill.title}
          </Heading>
          <Caption as="p" className="block mt-1">
            {t.settingsTab.autofill.description}
          </Caption>
        </header>

        {/* GitHub username */}
        <div>
          <FieldLabel
            htmlFor="github-username"
            className="flex items-center gap-1.5 mb-1.5"
          >
            <GithubIcon size={14} className="text-rc-muted" />
            {t.settingsTab.autofill.githubLabel}
          </FieldLabel>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] leading-5 text-rc-hint pointer-events-none font-mono">
                github.com/
              </span>
              <input
                id="github-username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                onBlur={handleGithubBlur}
                placeholder={t.settingsTab.autofill.githubPlaceholder}
                className="w-full bg-rc-bg border border-rc-border rounded-md py-2 pl-[114px] pr-3 text-[14px] leading-5 font-mono text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors"
              />
            </div>
            <SavedBadge show={githubSaved} label={t.settingsTab.savedBadge} />
          </div>
          <Caption as="p" className="block mt-1.5">
            {t.settingsTab.autofill.githubHint}
          </Caption>
        </div>

        {/* LinkedIn PDF */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel className="flex items-center gap-1.5">
              <LinkedinIcon size={14} className="text-rc-muted" />
              {t.settingsTab.autofill.linkedinLabel}
            </FieldLabel>
            <SavedBadge show={linkedinSaved} label={t.settingsTab.savedBadge} />
          </div>
          {profile?.linkedinUrl && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rc-bg border border-rc-green/30 rounded-md mb-2">
              <LinkedinIcon size={14} className="text-[#0a66c2]" />
              <Text className="flex-1">linkedin.pdf</Text>
              <button
                onClick={() =>
                  setPreviewPdf({
                    url: profile.linkedinUrl!,
                    name: "linkedin.pdf",
                  })
                }
                className="text-rc-hint hover:text-rc-text transition-colors"
                aria-label={t.settingsTab.account.preview}
              >
                <Eye size={14} />
              </button>
              <Caption tone="green">✓ {t.settingsTab.autofill.linkedinSavedLabel}</Caption>
            </div>
          )}
          <Button
            variant="default"
            block
            leadingIcon={<Upload size={14} />}
            onClick={() => linkedinRef.current?.click()}
            loading={linkedinUploading}
          >
            {profile?.linkedinUrl
              ? t.settingsTab.autofill.replaceLinkedin
              : t.settingsTab.autofill.uploadLinkedin}
          </Button>
          <input
            ref={linkedinRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLinkedinUpload(f);
            }}
          />
        </div>

        {/* Cover letter name */}
        <div>
          <FieldLabel htmlFor="cover-letter-name" className="block mb-1.5">
            {t.settingsTab.coverLetterNameLabel}
          </FieldLabel>
          <div className="flex items-center gap-2">
            <input
              id="cover-letter-name"
              value={coverLetterName}
              onChange={(e) => setCoverLetterName(e.target.value)}
              onBlur={handleCoverLetterNameBlur}
              placeholder={t.settingsTab.coverLetterNamePlaceholder}
              className={inputClass}
            />
            <SavedBadge show={coverLetterNameSaved} label={t.settingsTab.savedBadge} />
          </div>
          <Caption as="p" className="block mt-1.5">
            {t.settingsTab.coverLetterNameHint}
          </Caption>
        </div>
      </div>
    </>
  );
}
