"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User as UserIcon, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useAuth } from "../../context/auth";
import { useProfile } from "../../lib/queries";
import { useLanguage } from "../../context/language";
import { createClient } from "../../lib/supabase";

const LOGIN_LABELS: Record<string, string> = {
  en: "Login",
  fr: "Connexion",
};

export function AuthNavLink() {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { localePath, locale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("rc_subscription");
      window.location.href = localePath("/");
    }
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-muted hover:text-rc-text px-4 py-2 transition-colors duration-200 no-underline"
      >
        {LOGIN_LABELS[locale] ?? LOGIN_LABELS.en}
      </Link>
    );
  }

  const username = profile?.username || user.user_metadata?.username || null;
  const displayName =
    profile?.displayName ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "Account";
  const avatarUrl = profile?.avatarUrl || user.user_metadata?.avatar_url;
  const initials = (displayName || "AC").substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center group no-underline"
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayName}
      >
        <div className="w-8 h-8 rounded-full bg-rc-red/5 border border-rc-red/10 flex items-center justify-center text-[10px] font-black text-rc-red group-hover:bg-rc-red/10 transition-colors overflow-hidden shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute right-0 mt-2 w-64 bg-rc-surface border border-rc-border rounded-lg shadow-lg overflow-hidden z-50 origin-top-right transition-all duration-150 ease-out ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-rc-border">
            <div className="w-10 h-10 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center text-[12px] font-semibold text-rc-muted overflow-hidden shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-[13px] text-rc-text truncate">
                {displayName}
              </div>
              {username && (
                <div className="font-mono text-[11px] text-rc-hint truncate">
                  @{username}
                </div>
              )}
            </div>
          </div>

          <div className="py-1">
            {username ? (
              <Link
                href={localePath(`/u/${username}`)}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-rc-text hover:bg-rc-bg no-underline"
              >
                <UserIcon size={14} className="text-rc-muted" />
                {t.navDropdown.profile}
              </Link>
            ) : (
              <span
                role="menuitem"
                aria-disabled="true"
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-rc-hint cursor-not-allowed"
                title={t.navDropdown.claimToEnable}
              >
                <UserIcon size={14} />
                {t.navDropdown.profile}
              </span>
            )}
            <Link
              href={localePath("/settings")}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-rc-text hover:bg-rc-bg no-underline"
            >
              <SettingsIcon size={14} className="text-rc-muted" />
              {t.navDropdown.settings}
            </Link>
          </div>

          <div className="border-t border-rc-border py-1">
            <button
              type="button"
              onClick={handleSignOut}
              role="menuitem"
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-[13px] text-rc-text hover:bg-rc-bg"
            >
              <LogOut size={14} className="text-rc-muted" />
              {t.navDropdown.signOut}
            </button>
          </div>
        </div>
    </div>
  );
}
