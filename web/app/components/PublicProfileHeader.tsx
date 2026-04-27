"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, Pencil } from "lucide-react";
import { GenericLinkIcon, detectSocialIcon } from "./SocialIcons";
import { Heading, Caption, Text } from "./typography";
import { FollowButton } from "./FollowButton";
import { useAuth } from "../../context/auth";
import { useProfile } from "../../lib/queries";
import { useUpdateProfile } from "../../lib/mutations";
import { useLanguage } from "../../context/language";
import { createClient } from "../../lib/supabase";
import type { PublicProfile } from "../../lib/queries";

type Props = {
  profile: PublicProfile;
};

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <Caption className="font-mono text-[10px] uppercase tracking-[0.18em]">
        {label}
      </Caption>
      <span className="font-mono text-[18px] font-semibold text-rc-text tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function PublicProfileHeader({ profile }: Props) {
  const { user } = useAuth();
  const { data: viewerProfile } = useProfile();
  const { localePath, t } = useLanguage();
  const updateProfile = useUpdateProfile();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const isOwner = !!user && !!viewerProfile?.username && viewerProfile.username === profile.username;
  const initials = (profile.displayName ?? profile.username).slice(0, 2).toUpperCase();

  async function handleAvatarUpload(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("user-profiles")
        .upload(path, file, { upsert: true, cacheControl: "0" });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from("user-profiles")
        .getPublicUrl(path);
      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;
      await updateProfile.mutateAsync({ avatarUrl: cacheBustedUrl });
      window.location.reload();
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
      <div className="flex flex-col items-center text-center mb-5">
        <div
          onClick={isOwner ? () => fileInputRef.current?.click() : undefined}
          className={`relative mb-4 ${isOwner ? "cursor-pointer group" : ""}`}
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              className="w-44 h-44 rounded-full object-cover border border-rc-border"
            />
          ) : (
            <div className="w-44 h-44 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center text-[44px] font-semibold text-rc-muted">
              {initials}
            </div>
          )}
          {isOwner && (
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <Camera size={24} className="text-white" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-white">
                {uploading ? t.publicProfilePage.header.uploading : t.publicProfilePage.header.change}
              </span>
            </div>
          )}
        </div>
        {isOwner && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarUpload(f);
              if (e.target) e.target.value = "";
            }}
          />
        )}

        <Heading as="h1" className="text-[20px] mb-0.5 break-all">
          {profile.displayName ?? `@${profile.username}`}
        </Heading>
        {profile.displayName && (
          <Caption as="p" className="font-mono text-[12px] break-all">
            @{profile.username}
          </Caption>
        )}

        {profile.bio && (
          <Text as="p" className="mt-3 text-[13px] text-rc-muted leading-relaxed">
            {profile.bio}
          </Text>
        )}

        {isOwner ? (
          <Link
            href={localePath("/settings")}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-rc-bg border border-rc-border rounded-md font-mono text-[11px] uppercase tracking-[0.12em] text-rc-text hover:border-rc-red/40 transition-colors no-underline"
          >
            <Pencil size={12} />
            {t.publicProfilePage.header.editProfile}
          </Link>
        ) : (
          <div className="mt-4">
            <FollowButton
              username={profile.username}
              isFollowing={profile.isFollowing ?? false}
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-4">
          <Link
            href={localePath(`/u/${profile.username}/followers`)}
            className="font-mono text-[11px] text-rc-muted hover:text-rc-text no-underline"
          >
            <strong className="font-semibold text-rc-text tabular-nums">
              {profile.followersCount ?? 0}
            </strong>{" "}
            {t.publicProfilePage.header.followersCount}
          </Link>
          <span className="text-rc-border">·</span>
          <Link
            href={localePath(`/u/${profile.username}/following`)}
            className="font-mono text-[11px] text-rc-muted hover:text-rc-text no-underline"
          >
            <strong className="font-semibold text-rc-text tabular-nums">
              {profile.followingCount ?? 0}
            </strong>{" "}
            {t.publicProfilePage.header.followingCount}
          </Link>
        </div>
      </div>

      <div className="border-t border-rc-border pt-4 mb-4">
        <StatRow label={t.publicProfilePage.header.challenges} value={profile.challenges.total} />
        <StatRow label={t.publicProfilePage.header.avgScore} value={profile.challenges.avgScore} />
        <StatRow label={t.publicProfilePage.header.bestScore} value={profile.challenges.bestScore} />
        <StatRow label={t.publicProfilePage.header.currentStreak} value={profile.challenges.currentStreak} />
        <StatRow label={t.publicProfilePage.header.longestStreak} value={profile.challenges.longestStreak} />
      </div>

      {(profile.portfolioUrl ||
        (profile.socialLinks && profile.socialLinks.length > 0)) && (
        <div className="border-t border-rc-border pt-4 flex flex-col gap-2">
          {profile.portfolioUrl && (
            <Link
              href={profile.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-[12px] text-rc-muted hover:text-rc-text no-underline"
            >
              <GenericLinkIcon size={14} className="shrink-0" />
              <span className="truncate">{stripProtocol(profile.portfolioUrl)}</span>
            </Link>
          )}
          {profile.socialLinks?.map((url) => {
            const { Icon, label } = detectSocialIcon(url);
            return (
              <Link
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-[12px] text-rc-muted hover:text-rc-text no-underline"
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{label === "Link" ? stripProtocol(url) : label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
