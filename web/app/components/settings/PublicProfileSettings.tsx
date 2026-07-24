"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Heading, FieldLabel, Caption, Text } from "../typography";
import { Button } from "../Button";
import { Plus, X } from "lucide-react";
import { Toggle } from "../Toggle";
import { GenericLinkIcon, detectSocialIcon } from "../SocialIcons";
import type { Profile } from "../../../lib/queries";
import { useLanguage } from "../../../context/language";
import {
  useUpdateProfile,
  useClaimUsername,
  useUpdatePublicSettings,
  UsernameTakenError,
  UsernameRateLimitError,
} from "../../../lib/mutations";

const inputClass =
  "w-full bg-rc-bg border border-rc-border rounded-md px-3 py-2 text-[14px] leading-5 text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors";

const MAX_SOCIAL_SLOTS = 8;

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

export function PublicProfileSettings({
  profile,
  lang,
}: {
  profile: Profile | null;
  lang: string;
}) {
  const { t } = useLanguage();
  const updateProfile = useUpdateProfile();
  const claimUsername = useClaimUsername();
  const updatePublicSettings = useUpdatePublicSettings();

  const [displayName, setDisplayName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [profileUrlCopied, setProfileUrlCopied] = useState(false);

  const [bioDraft, setBioDraft] = useState("");
  const [bioSaved, setBioSaved] = useState(false);

  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioSaved, setPortfolioSaved] = useState(false);

  const [socialDrafts, setSocialDrafts] = useState<string[]>([""]);
  const [socialSaved, setSocialSaved] = useState(false);

  // Optimistic override for the public switch: non-null while a toggle is in
  // flight, cleared once the server value catches up (or on failure).
  const [publicOptimistic, setPublicOptimistic] = useState<boolean | null>(null);
  const serverIsPublic = profile?.isPublic ?? true;
  const isPublicShown = publicOptimistic ?? serverIsPublic;

  useEffect(() => {
    if (publicOptimistic !== null && serverIsPublic === publicOptimistic) {
      setPublicOptimistic(null);
    }
  }, [serverIsPublic, publicOptimistic]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? profile.username ?? "");
    setUsernameDraft(profile.username ?? "");
    setBioDraft(profile.bio ?? "");
    setPortfolioUrl(profile.portfolioUrl ?? "");
    const existing = profile.socialLinks ?? [];
    setSocialDrafts(existing.length > 0 ? [...existing] : [""]);
  }, [profile]);

  const profileUrl =
    profile?.username && typeof window !== "undefined"
      ? `${window.location.origin}/${lang}/u/${profile.username}`
      : null;

  // Blur-saves await the mutation directly: a rejection used to escape as an
  // unhandled promise while the "Saved" badge flashed anyway. useUpdateProfile's
  // onError toasts and refetches (re-syncing these fields), so here we only
  // avoid claiming a save that did not happen.
  const lastSaveOk = useRef(true);
  async function safeSave(data: Parameters<typeof updateProfile.mutateAsync>[0]) {
    try {
      await updateProfile.mutateAsync(data);
      lastSaveOk.current = true;
    } catch {
      lastSaveOk.current = false;
    }
  }
  function flashSaved(setter: (v: boolean) => void) {
    if (!lastSaveOk.current) return;
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  async function handleNameBlur() {
    const current = profile?.displayName ?? profile?.username ?? "";
    if (displayName === current) return;
    await safeSave({ displayName });
    flashSaved(setNameSaved);
  }

  async function handleClaimUsername() {
    setUsernameError(null);
    const candidate = usernameDraft.trim().toLowerCase();
    if (!candidate || candidate === profile?.username) return;
    if (!/^[a-z0-9_-]{3,30}$/.test(candidate)) {
      setUsernameError(t.settingsTab.publicProfile.usernameInvalid);
      return;
    }
    try {
      await claimUsername.mutateAsync(candidate);
      setUsernameSaved(true);
      setTimeout(() => setUsernameSaved(false), 2000);
    } catch (err) {
      if (err instanceof UsernameTakenError) {
        setUsernameError(t.settingsTab.publicProfile.usernameTaken);
      } else if (err instanceof UsernameRateLimitError) {
        const dateLocale = lang === "fr" ? "fr-FR" : "en-GB";
        const formattedDate = err.retryAt.toLocaleDateString(dateLocale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        setUsernameError(
          t.settingsTab.publicProfile.usernameRateLimited.replace(
            "{date}",
            formattedDate,
          ),
        );
      } else if (err instanceof Error) {
        setUsernameError(err.message);
      } else {
        setUsernameError(t.settingsTab.publicProfile.usernameTaken);
      }
    }
  }

  async function handleBioBlur() {
    const current = profile?.bio ?? "";
    if (bioDraft === current || bioDraft.length > 240) return;
    try {
      await updatePublicSettings.mutateAsync({ bio: bioDraft || null });
    } catch {
      toast.error(t.toasts.saveFailed);
      return;
    }
    setBioSaved(true);
    setTimeout(() => setBioSaved(false), 2000);
  }

  async function handleTogglePublic(next: boolean) {
    // Move the thumb immediately, then let the server confirm. Binding the
    // switch straight to server state left it sitting in the old position
    // (dimmed) for the whole roundtrip, which reads as a dead control.
    setPublicOptimistic(next);
    try {
      await updatePublicSettings.mutateAsync({ isPublic: next });
    } catch {
      setPublicOptimistic(null); // snap back to the server value
      toast.error(t.toasts.saveFailed);
    }
  }

  async function handlePortfolioBlur() {
    const current = profile?.portfolioUrl ?? "";
    if (portfolioUrl === current) return;
    await safeSave({ portfolioUrl });
    flashSaved(setPortfolioSaved);
  }

  async function persistSocialLinks(next: string[]) {
    const cleaned = next.map((s) => s.trim()).filter(Boolean);
    const current = profile?.socialLinks ?? [];
    if (JSON.stringify(cleaned) === JSON.stringify(current)) return;
    await safeSave({ socialLinks: cleaned });
    flashSaved(setSocialSaved);
  }

  async function handleSocialBlur() {
    await persistSocialLinks(socialDrafts);
  }

  function handleAddSocial() {
    if (socialDrafts.length >= MAX_SOCIAL_SLOTS) return;
    setSocialDrafts([...socialDrafts, ""]);
  }

  async function handleRemoveSocial(idx: number) {
    const next = socialDrafts.filter((_, i) => i !== idx);
    const safe = next.length > 0 ? next : [""];
    setSocialDrafts(safe);
    await persistSocialLinks(safe);
  }

  async function handleCopyProfileUrl() {
    if (!profileUrl) return;
    // Confirm only a copy that actually succeeded.
    try {
      await navigator.clipboard.writeText(profileUrl);
      setProfileUrlCopied(true);
      setTimeout(() => setProfileUrlCopied(false), 1500);
    } catch {
      toast.error(t.toasts.saveFailed);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-[640px]">
      <header className="border-b border-rc-border pb-4">
        <Heading as="h2" size="lg">{t.settingsTab.publicProfile.cardTitle}</Heading>
        <Caption as="p" className="block mt-1">
          {t.settingsTab.publicProfile.cardDesc}
        </Caption>
      </header>

      {/* Display name */}
      <div>
        <FieldLabel htmlFor="display-name" className="block mb-1.5">{t.settingsTab.publicProfile.nameLabel}</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder={t.settingsTab.publicProfile.namePlaceholder}
            className={inputClass}
          />
          <SavedBadge show={nameSaved} label={t.settingsTab.savedBadge} />
        </div>
        <Caption as="p" className="block mt-1.5">
          {t.settingsTab.publicProfile.nameHint}
        </Caption>
      </div>

      {/* Username */}
      <div>
        <FieldLabel htmlFor="username" className="block mb-1.5">
          {t.settingsTab.publicProfile.usernameLabel}
        </FieldLabel>
        <div className="flex items-stretch gap-2 mb-1.5">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] leading-5 text-rc-hint pointer-events-none font-mono">@</span>
            <input
              id="username"
              value={usernameDraft}
              onChange={(e) => {
                setUsernameDraft(e.target.value);
                setUsernameError(null);
              }}
              placeholder={t.settingsTab.publicProfile.usernamePlaceholder}
              className="w-full bg-rc-bg border border-rc-border rounded-md py-2 pl-7 pr-3 text-[14px] leading-5 font-mono text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors"
            />
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleClaimUsername}
            loading={claimUsername.isPending}
            disabled={!usernameDraft || usernameDraft.toLowerCase() === profile?.username}
          >
            {profile?.username ? t.settingsTab.publicProfile.updateButton : t.settingsTab.publicProfile.claimButton}
          </Button>
          <SavedBadge show={usernameSaved} label={t.settingsTab.savedBadge} />
        </div>
        {usernameError ? (
          <Caption tone="red" className="block">{usernameError}</Caption>
        ) : (
          <Caption as="p" className="block">{t.settingsTab.publicProfile.usernameHint}</Caption>
        )}
      </div>

      {/* Bio */}
      <div>
        <FieldLabel htmlFor="bio" className="block mb-1.5">
          {t.settingsTab.publicProfile.bioLabel}
        </FieldLabel>
        <div className="flex items-start gap-2 mb-1">
          <textarea
            id="bio"
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value.slice(0, 240))}
            onBlur={handleBioBlur}
            placeholder={t.settingsTab.publicProfile.bioPlaceholder}
            rows={3}
            className="flex-1 bg-rc-bg border border-rc-border rounded-md px-3 py-2 text-[14px] leading-5 text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors resize-none"
          />
          <SavedBadge show={bioSaved} label={t.settingsTab.savedBadge} />
        </div>
        {/* The input is hard-sliced at 240, so warn before the user hits the
            wall rather than silently swallowing keystrokes. */}
        <Caption
          as="p"
          tone={bioDraft.length >= 240 ? "red" : bioDraft.length >= 220 ? "amber" : undefined}
          className="block text-right tabular-nums"
        >
          {bioDraft.length}/240
        </Caption>
      </div>

      {/* URL */}
      <div>
        <FieldLabel htmlFor="portfolio-url" className="block mb-1.5">{t.settingsTab.publicProfile.urlLabel}</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            id="portfolio-url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            onBlur={handlePortfolioBlur}
            placeholder={t.settingsTab.publicProfile.urlPlaceholder}
            className={inputClass}
          />
          <SavedBadge show={portfolioSaved} label={t.settingsTab.savedBadge} />
        </div>
      </div>

      {/* Social links */}
      <div>
        <FieldLabel className="block mb-1.5">{t.settingsTab.publicProfile.socialLabel}</FieldLabel>
        <div className="flex flex-col gap-2">
          {socialDrafts.map((value, idx) => {
            const Icon = value
              ? detectSocialIcon(value).Icon
              : GenericLinkIcon;
            const canRemove = socialDrafts.length > 1 || value.length > 0;
            return (
              <div key={idx} className="relative">
                <Icon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-rc-hint pointer-events-none"
                />
                <input
                  value={value}
                  onChange={(e) => {
                    const next = [...socialDrafts];
                    next[idx] = e.target.value;
                    setSocialDrafts(next);
                  }}
                  onBlur={handleSocialBlur}
                  placeholder={t.settingsTab.publicProfile.socialPlaceholder}
                  className="w-full bg-rc-bg border border-rc-border rounded-md py-2 pl-9 pr-9 text-[14px] leading-5 text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors"
                />
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSocial(idx)}
                    aria-label={t.settingsTab.publicProfile.removeSocial}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-rc-hint hover:text-rc-red transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-2">
            {socialDrafts.length < MAX_SOCIAL_SLOTS ? (
              <button
                type="button"
                onClick={handleAddSocial}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-rc-muted hover:text-rc-text transition-colors"
              >
                <Plus size={12} />
                {t.settingsTab.publicProfile.addSocial}
              </button>
            ) : (
              <span />
            )}
            <SavedBadge show={socialSaved} label={t.settingsTab.savedBadge} />
          </div>
        </div>
      </div>

      {/* Public toggle */}
      <div className="flex items-center justify-between gap-3 border-t border-rc-border pt-6">
        <div className="min-w-0">
          <Text weight="medium" className="block">{t.settingsTab.publicProfile.publicToggleLabel}</Text>
          <Caption as="p" className="block">{t.settingsTab.publicProfile.publicToggleHint}</Caption>
        </div>
        <Toggle
          checked={isPublicShown}
          onChange={handleTogglePublic}
          label={t.settingsTab.publicProfile.publicToggleLabel}
        />
      </div>

      {/* Share URL */}
      {profileUrl && (
        <div className="border-t border-rc-border pt-6">
          <FieldLabel className="block mb-2">{t.settingsTab.publicProfile.shareLabel}</FieldLabel>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate bg-rc-bg border border-rc-border rounded-md px-3 py-2 text-[12px] font-mono text-rc-muted">
              {profileUrl}
            </code>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyProfileUrl}
              leadingIcon={profileUrlCopied ? <Check size={14} /> : <Copy size={14} />}
            >
              {profileUrlCopied ? t.settingsTab.publicProfile.copiedLabel : t.settingsTab.publicProfile.copyButton}
            </Button>
            <Button
              as={Link}
              href={`/${lang}/u/${profile!.username}`}
              variant="default"
              size="sm"
              leadingIcon={<ExternalLink size={14} />}
            >
              {t.settingsTab.publicProfile.viewButton}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
