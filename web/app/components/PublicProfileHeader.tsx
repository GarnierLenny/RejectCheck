"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, Pencil } from "lucide-react";
import { GenericLinkIcon, detectSocialIcon } from "./SocialIcons";
import { FollowButton } from "./FollowButton";
import { ShareMenu } from "./ShareMenu";
import { ProfileActionsMenu } from "./ProfileActionsMenu";
import { useAuth } from "../../context/auth";
import { useProfile } from "../../lib/queries";
import { useUpdateProfile } from "../../lib/mutations";
import { useLanguage } from "../../context/language";
import { createClient } from "../../lib/supabase";
import { useQuota } from "../../lib/queries";
import type { PublicProfile } from "../../lib/queries";

type Props = {
  profile: PublicProfile;
};

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function EDStatCol({ label, value, suffix, accent }: {
  label: string; value: number | string; suffix?: string | null; accent?: boolean;
}) {
  return (
    <div className="border-r border-rc-border last:border-r-0 px-6 first:pl-0">
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-hint mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-serif text-[46px] font-medium leading-none tracking-tight tabular-nums ${accent ? "text-rc-red" : "text-rc-text"}`}>
          {value}
        </span>
        {suffix && <span className="font-mono text-[11px] text-rc-hint">{suffix}</span>}
      </div>
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

  const { data: quota } = useQuota();
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
    <div>
      {/* HERO */}
      <div
        className="grid gap-12 items-center pb-8 border-b border-rc-border"
        style={{ gridTemplateColumns: "1fr auto" }}
      >
        <div>
          {profile.xp && (
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-rc-hint mb-4 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-rc-red flex-shrink-0" />
              Lvl {profile.xp.level} · {profile.xp.tierLabel}
            </div>
          )}
          <h1 className="font-serif text-[68px] font-normal leading-none m-0 mb-2" style={{ letterSpacing: -1.5 }}>
            {profile.displayName ?? profile.username}<span className="text-rc-red">.</span>
          </h1>
          <p className="font-mono text-[13px] text-rc-hint mb-5">@{profile.username}</p>
          {profile.bio && (
            <p className="text-[15px] leading-relaxed max-w-[520px] mb-7 text-rc-text/80">{profile.bio}</p>
          )}

          <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
            {isOwner ? (
              <Link
                href={localePath("/settings")}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-rc-bg border border-rc-border rounded-md font-mono text-[11px] uppercase tracking-[0.12em] text-rc-text hover:border-rc-red/40 transition-colors no-underline"
              >
                <Pencil size={12} />
                {t.publicProfilePage.header.editProfile}
              </Link>
            ) : (
              <FollowButton username={profile.username} isFollowing={profile.isFollowing ?? false} />
            )}
            <ShareMenu
              url={
                typeof window !== "undefined"
                  ? `${window.location.origin}${localePath(`/u/${profile.username}`)}`
                  : `https://www.rejectcheck.com${localePath(`/u/${profile.username}`)}`
              }
              text={t.share.profileText.replace(
                "{user}",
                profile.displayName ?? `@${profile.username}`,
              )}
              size="md"
            />
            {user && !isOwner && <ProfileActionsMenu username={profile.username} />}
            <span className="hidden sm:block w-px h-4 bg-rc-border" />
            <div className="flex items-center gap-3 font-mono text-[12px] text-rc-hint">
              <Link
                href={localePath(`/u/${profile.username}/followers`)}
                className="no-underline hover:text-rc-text transition-colors"
              >
                <strong className="font-semibold text-rc-text tabular-nums">{profile.followersCount ?? 0}</strong>{" "}
                {t.publicProfilePage.header.followersCount}
              </Link>
              <span className="opacity-40">·</span>
              <Link
                href={localePath(`/u/${profile.username}/following`)}
                className="no-underline hover:text-rc-text transition-colors"
              >
                <strong className="font-semibold text-rc-text tabular-nums">{profile.followingCount ?? 0}</strong>{" "}
                {t.publicProfilePage.header.followingCount}
              </Link>
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div
          onClick={isOwner ? () => fileInputRef.current?.click() : undefined}
          className={`relative flex-shrink-0 ${isOwner ? "cursor-pointer group" : ""}`}
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              className="w-36 h-36 rounded-full object-cover border border-rc-border"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center text-[36px] font-semibold text-rc-hint">
              {initials}
            </div>
          )}
          {isOwner && (
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <Camera size={22} className="text-white" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-white">
                {uploading ? t.publicProfilePage.header.uploading : t.publicProfilePage.header.change}
              </span>
            </div>
          )}
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
        </div>
      </div>

      {/* STATS BIG NUMBERS */}
      <div className="grid py-8 border-b border-rc-border" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <EDStatCol
          label={t.publicProfilePage.header.challenges}
          value={profile.challenges.total}
        />
        <EDStatCol
          label={t.publicProfilePage.header.avgScore}
          value={profile.challenges.avgScore}
          suffix={profile.challenges.avgScore ? "/ 100" : null}
        />
        <EDStatCol
          label={t.publicProfilePage.header.bestScore}
          value={profile.challenges.bestScore}
          suffix={profile.challenges.bestScore ? "/ 100" : null}
          accent={profile.challenges.bestScore === 100}
        />
        <EDStatCol
          label={t.publicProfilePage.header.currentStreak}
          value={profile.challenges.currentStreak}
          suffix="d"
        />
        <EDStatCol
          label={t.publicProfilePage.header.longestStreak}
          value={profile.challenges.longestStreak}
          suffix="d"
        />
      </div>

      {/* CREDITS + NEXT ACHIEVEMENT */}
      {(() => {
        const p = profile.achievements.progress;
        const earnedSlugs = new Set(profile.achievements.earned.map(e => e.slug));
        const defs: { slug: string; label: string; description: string; progressText: string | null; pct: number }[] = [
          { slug: "first_steps",  label: "First Steps",   description: "Complete your first challenge",                  progressText: null,                                           pct: earnedSlugs.has("first_steps") ? 100 : 0 },
          { slug: "perfect_score",label: "Perfect Score", description: "Score 100 on a challenge",                       progressText: "0 / 1",                                        pct: 0 },
          { slug: "triple_crown", label: "Triple Crown",  description: "Get 5 perfect scores",                           progressText: `${Math.min(p.perfectCount, 5)} / 5`,           pct: Math.min(p.perfectCount, 5) / 5 * 100 },
          { slug: "week_warrior", label: "Week Warrior",  description: "Hit a 7-day streak",                             progressText: `${Math.min(p.longestStreak, 7)} / 7`,          pct: Math.min(p.longestStreak, 7) / 7 * 100 },
          { slug: "month_warrior",label: "Month Warrior", description: "Hit a 30-day streak",                            progressText: `${Math.min(p.longestStreak, 30)} / 30`,        pct: Math.min(p.longestStreak, 30) / 30 * 100 },
          { slug: "polyglot",     label: "Polyglot",      description: "Solve challenges in 3 different languages",      progressText: `${Math.min(p.languagesCount, 3)} / 3`,         pct: Math.min(p.languagesCount, 3) / 3 * 100 },
          { slug: "centurion",    label: "Centurion",     description: "Complete 100 challenges",                        progressText: `${Math.min(p.totalCount, 100)} / 100`,         pct: Math.min(p.totalCount, 100) },
          { slug: "connected",    label: "Connected",     description: "Reach 10 followers",                             progressText: `${Math.min(p.followersCount, 10)} / 10`,       pct: Math.min(p.followersCount, 10) / 10 * 100 },
        ];
        const nextAch = defs.find(d => !earnedSlugs.has(d.slug));
        const monthlyRemaining = quota ? quota.monthlyCap - quota.monthlyUsed : null;
        const progressPct = quota ? Math.max(0, Math.min(100, ((quota.monthlyCap - quota.monthlyUsed) / quota.monthlyCap) * 100)) : 0;
        const isLow = monthlyRemaining !== null && monthlyRemaining <= 3;
        const perm = quota?.creditsBalance ?? 0;
        const resetDays = quota?.currentPeriodEnd
          ? Math.max(0, Math.ceil((new Date(quota.currentPeriodEnd).getTime() - Date.now()) / 86400000))
          : null;
        const planLabel = quota?.plan === "hired" ? "Plan Hired" : quota?.plan === "shortlisted" ? "Plan Shortlisted" : "Plan Free";
        if (!nextAch && !isOwner) return null;
        return (
          <div className="flex py-8 border-b border-rc-border gap-8">
            {isOwner && quota && (
              <div className="flex-1 flex flex-col">
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-hint mb-3">Tes crédits</p>
                <div className="flex-1 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 flex flex-col gap-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint font-bold">Crédits d'analyse</span>
                    <span className="font-mono text-[9px] tracking-[0.12em] uppercase border border-rc-border rounded px-2 py-0.5 text-rc-hint">
                      {planLabel}
                    </span>
                  </div>
                  {/* Big number */}
                  <div className="flex items-baseline gap-1.5">
                    <span className={`font-black text-[32px] leading-none ${isLow ? "text-rc-red" : "text-rc-text"}`}>
                      {monthlyRemaining}
                    </span>
                    <span className="font-mono text-[13px] text-rc-hint">/ {quota.monthlyCap}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-rc-surface-hero rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, background: isLow ? "var(--rc-red)" : "var(--rc-green)" }}
                    />
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-rc-hint">
                      {resetDays !== null ? `Reset dans ${resetDays}j` : "—"}
                    </span>
                    <Link
                      href={localePath("/credits")}
                      className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-rc-hint hover:text-rc-text no-underline transition-colors"
                    >
                      Gérer →
                    </Link>
                  </div>
                </div>
              </div>
            )}
            {nextAch && (
              <div className="flex-1 flex flex-col">
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-hint mb-3">Prochain succès</p>
                <div className="flex-1 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 flex flex-col gap-3">
                  {/* Label */}
                  <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-red font-bold">Prochain succès</p>
                  {/* Icon + text row */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rc-red/10 border-2 border-rc-red/30 flex items-center justify-center flex-shrink-0">
                      <div className="w-4 h-4 rounded-full border-2 border-rc-red/60" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-rc-text leading-tight">{nextAch.label}</p>
                      <p className="font-mono text-[11px] text-rc-hint mt-0.5">{nextAch.description}</p>
                    </div>
                  </div>
                  {/* Progress bar + label */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-rc-surface-hero rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rc-red transition-all"
                        style={{ width: `${nextAch.pct}%` }}
                      />
                    </div>
                    {nextAch.progressText && (
                      <span className="font-mono text-[10px] text-rc-hint tabular-nums flex-shrink-0">{nextAch.progressText}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* LINKS */}
      {(profile.portfolioUrl || (profile.socialLinks && profile.socialLinks.length > 0)) && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 py-8 border-b border-rc-border">
          {profile.portfolioUrl && (
            <Link
              href={profile.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono text-[12px] text-rc-hint hover:text-rc-text no-underline transition-colors"
            >
              <GenericLinkIcon size={14} className="shrink-0" />
              <span>{stripProtocol(profile.portfolioUrl)}</span>
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
                className="flex items-center gap-2 font-mono text-[12px] text-rc-hint hover:text-rc-text no-underline transition-colors"
              >
                <Icon size={14} className="shrink-0" />
                <span>{label === "Link" ? stripProtocol(url) : label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
