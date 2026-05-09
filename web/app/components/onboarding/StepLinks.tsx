"use client";

import { useRef, useState } from "react";
import { Globe, Upload } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { GithubIcon, LinkedinIcon } from "../SocialIcons";
import { createClient } from "../../../lib/supabase";
import {
  URL_PRESETS,
  type UrlField,
  type BannerTone,
} from "../../../lib/onboarding-data";
import type { RoleType } from "../../../lib/queries";
import type { Dictionary } from "../../[lang]/dictionaries";
import { StepHeader } from "./StepHeader";

const TONE: Record<
  BannerTone,
  {
    wrapper: string;
    iconBg: string;
    iconText: string;
    titleText: string;
    symbol: string;
  }
> = {
  red: {
    wrapper: "bg-rc-red-bg border-rc-red-border",
    iconBg: "bg-[rgba(201,58,57,0.18)]",
    iconText: "text-rc-red",
    titleText: "text-rc-red",
    symbol: "※",
  },
  green: {
    wrapper: "bg-rc-green-bg border-rc-green-border",
    iconBg: "bg-[rgba(61,97,20,0.18)]",
    iconText: "text-rc-green",
    titleText: "text-rc-green",
    symbol: "✓",
  },
  amber: {
    wrapper: "bg-rc-amber-bg border-rc-amber-border",
    iconBg: "bg-[rgba(154,98,0,0.18)]",
    iconText: "text-rc-amber",
    titleText: "text-rc-amber",
    symbol: "!",
  },
};

function FieldIcon({ field }: { field: UrlField }) {
  if (field === "github")
    return <GithubIcon size={22} className="text-rc-muted" />;
  if (field === "linkedin")
    return <LinkedinIcon size={22} className="text-rc-muted" />;
  return <Globe size={22} strokeWidth={1.6} className="text-rc-muted" />;
}

export function StepLinks({
  t,
  role,
  githubUsername,
  portfolioUrl,
  linkedinUrl,
  onGithubChange,
  onPortfolioChange,
  onLinkedinUrlChange,
  session,
}: {
  t: Dictionary;
  role: RoleType;
  githubUsername: string;
  portfolioUrl: string;
  linkedinUrl: string | null;
  onGithubChange: (v: string) => void;
  onPortfolioChange: (v: string) => void;
  onLinkedinUrlChange: (v: string | null) => void;
  session: Session | null;
}) {
  const preset = URL_PRESETS[role];
  const banner = t.onboarding.banners[role];
  const tone = TONE[preset.tone];
  const supabase = createClient();
  const [linkedinUploading, setLinkedinUploading] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);
  const linkedinRef = useRef<HTMLInputElement>(null);

  async function handleLinkedinUpload(file: File) {
    const userId = session?.user?.id;
    if (!userId) {
      setLinkedinError("You must be signed in to upload.");
      return;
    }
    setLinkedinError(null);
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
      onLinkedinUrlChange(publicUrl);
    } catch (err) {
      console.error("[onboarding] linkedin upload failed", err);
      setLinkedinError(
        err instanceof Error ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setLinkedinUploading(false);
    }
  }

  return (
    <section>
      <StepHeader
        eyebrow={t.onboarding.step5.eyebrow}
        title={t.onboarding.step5.title}
        titleAccent={t.onboarding.step5.titleAccent}
      >
        {t.onboarding.step5.sub}
      </StepHeader>

      <div
        className={`flex gap-3.5 items-start px-5 py-4 border rounded-2xl mb-7 ${tone.wrapper}`}
      >
        <span
          className={`w-8 h-8 flex items-center justify-center rounded-[10px] flex-shrink-0 font-mono text-[14px] font-bold ${tone.iconBg} ${tone.iconText}`}
        >
          {tone.symbol}
        </span>
        <div className="flex-1">
          <div
            className={`font-mono text-[10px] tracking-[0.20em] uppercase font-bold mb-1.5 ${tone.titleText}`}
          >
            {banner.title}
          </div>
          <div className="text-[14.5px] text-rc-text leading-[1.55]">
            {banner.text}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {preset.fields.map((field) => {
          const required = preset.recommended.includes(field);
          const pillLabel = required
            ? t.onboarding.pills.recommended
            : t.onboarding.pills.optional;

          if (field === "linkedin") {
            return (
              <div
                key={field}
                className={`flex items-center gap-4 px-5 py-4 border-[1.5px] rounded-2xl bg-rc-surface transition-all ${
                  required ? "border-rc-red/40" : "border-rc-border"
                }`}
              >
                <span className="w-[38px] h-[38px] flex items-center justify-center text-rc-muted flex-shrink-0">
                  <LinkedinIcon size={22} />
                </span>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
                    {t.onboarding.fieldLabels.linkedin}
                    <span
                      className={`font-mono text-[8px] tracking-[0.16em] font-bold px-[7px] py-[3px] rounded-full ${
                        required
                          ? "text-rc-red bg-rc-red-bg"
                          : "text-rc-hint bg-rc-surface-hero"
                      }`}
                    >
                      {pillLabel}
                    </span>
                  </div>
                  {linkedinUrl ? (
                    <div className="flex items-center gap-3 text-[15px]">
                      <span className="text-rc-text">linkedin.pdf</span>
                      <button
                        type="button"
                        onClick={() => onLinkedinUrlChange(null)}
                        className="text-rc-hint hover:text-rc-red transition-colors text-[12px] underline"
                      >
                        {t.onboarding.step5.linkedinDeleteLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => linkedinRef.current?.click()}
                        className="ml-auto text-rc-hint hover:text-rc-text transition-colors text-[12px] underline"
                      >
                        {t.onboarding.step5.linkedinReplaceLabel}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => linkedinRef.current?.click()}
                      disabled={linkedinUploading}
                      className="inline-flex items-center gap-2 self-start px-3.5 py-2 border border-rc-border bg-rc-bg rounded-lg text-[14px] text-rc-text hover:border-rc-red/40 transition-colors disabled:opacity-60"
                    >
                      <Upload size={14} />
                      {linkedinUploading
                        ? t.onboarding.step5.linkedinUploadingLabel
                        : t.onboarding.step5.linkedinUploadLabel}
                    </button>
                  )}
                  <input
                    ref={linkedinRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLinkedinUpload(f);
                      // Reset so re-uploading the same file still triggers onChange
                      e.target.value = "";
                    }}
                  />
                  {linkedinError && (
                    <span className="text-[12px] text-rc-red font-mono">
                      {linkedinError}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          const value = field === "github" ? githubUsername : portfolioUrl;
          const setValue =
            field === "github" ? onGithubChange : onPortfolioChange;
          return (
            <div
              key={field}
              className={`flex items-center gap-4 px-5 py-4 border-[1.5px] rounded-2xl bg-rc-surface transition-all focus-within:border-rc-red focus-within:shadow-[0_0_0_4px_rgba(201,58,57,0.08)] ${
                required ? "border-rc-red/40" : "border-rc-border"
              }`}
            >
              <span className="w-[38px] h-[38px] flex items-center justify-center text-rc-muted flex-shrink-0">
                <FieldIcon field={field} />
              </span>
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
                  {t.onboarding.fieldLabels[field]}
                  <span
                    className={`font-mono text-[8px] tracking-[0.16em] font-bold px-[7px] py-[3px] rounded-full ${
                      required
                        ? "text-rc-red bg-rc-red-bg"
                        : "text-rc-hint bg-rc-surface-hero"
                    }`}
                  >
                    {pillLabel}
                  </span>
                </div>
                <input
                  type={field === "portfolio" ? "url" : "text"}
                  autoComplete="off"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={
                    field === "github"
                      ? t.onboarding.fieldPlaceholders.github
                      : t.onboarding.fieldPlaceholders.portfolio
                  }
                  className="w-full py-1 border-none bg-transparent text-[16px] text-rc-text outline-none placeholder:text-rc-hint"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
