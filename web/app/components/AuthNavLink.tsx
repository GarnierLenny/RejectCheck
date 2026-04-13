"use client";

import Link from "next/link";
import { useAuth } from "../../context/auth";

export function AuthNavLink() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    const username = user.user_metadata?.username || "Account";
    const initials = username.substring(0, 2).toUpperCase();
    const avatarUrl = user.user_metadata?.avatar_url;

    return (
      <Link
        href="/account"
        className="flex items-center gap-2.5 group no-underline"
      >
        <div className="w-8 h-8 rounded-full bg-rc-red/5 border border-rc-red/10 flex items-center justify-center text-[10px] font-black text-rc-red group-hover:bg-rc-red/10 transition-colors overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="PP" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-muted group-hover:text-rc-text transition-colors hidden md:block truncate max-w-[120px]">
          {username}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-muted hover:text-rc-text px-4 py-2 transition-colors duration-200 no-underline"
    >
      Login
    </Link>
  );
}
