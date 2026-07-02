"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { AuthNavLink } from "./AuthNavLink";
import { LangSwitcher } from "./LangSwitcher";
import { useAuth } from "../../context/auth";
import { useLanguage } from "../../context/language";
type NavPage = "analyze" | "dashboard" | "pricing" | "leaderboard";

interface NavbarProps {
  center?: React.ReactNode;
  activePage?: NavPage;
}

export function Navbar({ center, activePage }: NavbarProps = {}) {
  const { user, loading } = useAuth();
  const { t, localePath } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (page: NavPage) =>
    `font-sans text-[11px] tracking-[0.04em] uppercase px-4 py-2 transition-all duration-200 no-underline ${
      activePage === page
        ? "text-rc-red font-bold"
        : "text-rc-muted hover:text-rc-text"
    }`;

  // Nav links reused by the desktop cluster and the mobile dropdown.
  const navLinks = (onNavigate?: () => void) =>
    user && !loading ? (
      <>
        <Link href={localePath("/analyze")} className={linkClass("analyze")} onClick={onNavigate}>
          {t.navbar.analyze}
        </Link>
        <Link href={localePath("/dashboard")} className={linkClass("dashboard")} onClick={onNavigate}>
          {t.navbar.dashboard}
        </Link>
        <Link href={localePath("/pricing")} className={linkClass("pricing")} onClick={onNavigate}>
          {t.navbar.pricing}
        </Link>
      </>
    ) : !loading ? (
      <Link
        href={localePath("/pricing")}
        className="font-sans text-[11px] tracking-[0.04em] uppercase text-rc-text/50 hover:text-rc-text px-4 py-2 transition-all duration-200 no-underline"
        onClick={onNavigate}
      >
        {t.navbar.pricing}
      </Link>
    ) : null;

  return (
    <nav className="relative w-full flex items-center justify-between md:grid md:grid-cols-3 px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border bg-white/50 backdrop-blur-md sticky top-0 z-50">
      {/* Left: logo */}
      <Link href={localePath("/")} className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity">
        <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck Logo" width={36} height={36} />
      </Link>

      {/* Center: optional slot (desktop only) */}
      <div className="hidden md:flex items-center justify-center">
        {center}
      </div>

      {/* Right: nav links + lang + avatar (desktop) */}
      <div className="hidden md:flex items-center justify-end gap-3">
        {navLinks()}

        <LangSwitcher />
        <AuthNavLink />

        {!user && !loading && (
          <Link
            href={localePath("/analyze")}
            className="font-sans text-[11px] tracking-[0.04em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 no-underline"
          >
            {t.navbar.tryFree}
          </Link>
        )}
      </div>

      {/* Mobile: hamburger toggle */}
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        className="md:hidden flex items-center justify-center p-2 -mr-2 text-rc-text"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile: dropdown panel */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 flex flex-col gap-1 px-5 py-4 border-b border-rc-border bg-white/95 backdrop-blur-md shadow-sm">
          <div className="flex flex-col">{navLinks(() => setMenuOpen(false))}</div>
          <div className="flex items-center gap-3 pt-2 mt-1 border-t border-rc-border/60">
            <LangSwitcher />
            <AuthNavLink />
          </div>
          {!user && !loading && (
            <Link
              href={localePath("/analyze")}
              onClick={() => setMenuOpen(false)}
              className="mt-2 text-center font-sans text-[11px] tracking-[0.04em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2.5 rounded-lg transition-all duration-200 no-underline"
            >
              {t.navbar.tryFree}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
