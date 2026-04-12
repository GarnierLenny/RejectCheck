"use client";

import Link from "next/link";
import { useAuth } from "../../context/auth";

export function AuthNavLink() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <Link
        href="/account"
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-muted hover:text-rc-text px-4 py-2 transition-colors duration-200 no-underline"
      >
        Account
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
