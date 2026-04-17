"use client";

import Link from "next/link";
import Image from "next/image";
import { AuthNavLink } from "./AuthNavLink";
import { useAuth } from "../../context/auth";

export function Navbar() {
  const { user, loading } = useAuth();

  return (
    <nav className="flex items-center justify-between px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity">
        <Image
          src="/RejectCheck_500_bg_less.png"
          alt="RejectCheck Logo"
          width={40}
          height={40}
        />
      </Link>
      
      <div className="flex items-center gap-3">
        {!user && !loading && (
          <>
            <Link
              href="/pricing"
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-text/50 hover:text-rc-text px-4 py-2 transition-all duration-200 no-underline"
            >
              Pricing
            </Link>
          </>
        )}
        
        <AuthNavLink />
        
        {!user && !loading && (
          <Link
            href="/analyze"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 no-underline"
          >
            Try free →
          </Link>
        )}
      </div>
    </nav>
  );
}
