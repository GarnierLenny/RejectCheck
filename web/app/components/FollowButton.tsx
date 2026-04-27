"use client";

import { useState } from "react";
import { UserPlus, UserCheck, UserMinus } from "lucide-react";
import { useFollow, useUnfollow } from "../../lib/mutations";
import { useAuth } from "../../context/auth";
import { useLanguage } from "../../context/language";

type Props = {
  username: string;
  isFollowing: boolean;
  size?: "sm" | "md";
};

export function FollowButton({ username, isFollowing, size = "md" }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const [hover, setHover] = useState(false);

  if (!user) return null;

  const pending = follow.isPending || unfollow.isPending;
  const padding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const fontSize = size === "sm" ? "text-[10px]" : "text-[11px]";
  const iconSize = size === "sm" ? 11 : 12;

  if (!isFollowing) {
    return (
      <button
        type="button"
        onClick={() => follow.mutate(username)}
        disabled={pending}
        className={`inline-flex items-center gap-1.5 ${padding} bg-rc-red text-white font-mono ${fontSize} uppercase tracking-[0.12em] rounded-md hover:bg-[#b83332] transition-colors disabled:opacity-50`}
      >
        <UserPlus size={iconSize} />
        {t.publicProfilePage.header.follow}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => unfollow.mutate(username)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 ${padding} font-mono ${fontSize} uppercase tracking-[0.12em] rounded-md transition-colors disabled:opacity-50 ${
        hover
          ? "bg-rc-red/10 text-rc-red border border-rc-red/40"
          : "bg-rc-bg text-rc-text border border-rc-border"
      }`}
    >
      {hover ? (
        <>
          <UserMinus size={iconSize} />
          {t.publicProfilePage.header.unfollow}
        </>
      ) : (
        <>
          <UserCheck size={iconSize} />
          {t.publicProfilePage.header.following}
        </>
      )}
    </button>
  );
}
