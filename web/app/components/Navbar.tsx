"use client";

import Link from "next/link";
import Image from "next/image";
import { AuthNavLink } from "./AuthNavLink";
import { LangSwitcher } from "./LangSwitcher";
import { useAuth } from "../../context/auth";
import { useLanguage } from "../../context/language";
type NavPage = "analyze" | "dashboard" | "pricing" | "challenge" | "leaderboard";

interface NavbarProps {
  center?: React.ReactNode;
  activePage?: NavPage;
}

export function Navbar({ center, activePage }: NavbarProps = {}) {
  const { user, loading } = useAuth();
  const { t, localePath } = useLanguage();

  const linkClass = (page: NavPage) =>
    `font-mono text-[11px] tracking-[0.14em] uppercase px-4 py-2 transition-all duration-200 no-underline ${
      activePage === page
        ? "text-rc-red font-bold"
        : "text-rc-muted hover:text-rc-text"
    }`;

  const challengeLabel = t.challenge.navLink;

  return (
    <nav className="w-full grid grid-cols-3 items-center px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border bg-white/50 backdrop-blur-md sticky top-0 z-50">
      {/* Left: logo */}
      <Link href={localePath("/")} className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity">
        <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck Logo" width={36} height={36} />
      </Link>

      {/* Center: optional slot */}
      <div className="flex items-center justify-center">
        {center}
      </div>

      {/* Right: nav links + lang + avatar */}
      <div className="flex items-center justify-end gap-3">
        {!user && !loading && (
          <>
            <Link href={localePath("/challenge")} className={linkClass("challenge")}>
              {challengeLabel}
            </Link>
            <Link href={localePath("/leaderboard")} className={linkClass("leaderboard")}>
              {t.leaderboard.title}
            </Link>
            <Link
              href={localePath("/pricing")}
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-text/50 hover:text-rc-text px-4 py-2 transition-all duration-200 no-underline"
            >
              {t.navbar.pricing}
            </Link>
          </>
        )}

        {user && !loading && (
          <>
            <Link href={localePath("/analyze")} className={linkClass("analyze")}>
              Analyze
            </Link>
            <Link href={localePath("/challenge")} className={linkClass("challenge")}>
              {challengeLabel}
            </Link>
            <Link href={localePath("/leaderboard")} className={linkClass("leaderboard")}>
              {t.leaderboard.title}
            </Link>
            <Link href={localePath("/dashboard")} className={linkClass("dashboard")}>
              Dashboard
            </Link>
            <Link href={localePath("/pricing")} className={linkClass("pricing")}>
              {t.navbar.pricing}
            </Link>
          </>
        )}

        <LangSwitcher />
        <AuthNavLink />

        {!user && !loading && (
          <Link
            href={localePath("/analyze")}
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 no-underline"
          >
            {t.navbar.tryFree}
          </Link>
        )}
      </div>
    </nav>
  );
}
