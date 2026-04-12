"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { SuccessModal } from "../components/SuccessModal";

type Subscription = {
  plan: string;
  status: string;
  currentPeriodEnd: string;
} | null;

export default function UserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Check for success param
    if (searchParams.get("success") === "true") {
      setShowSuccessModal(true);
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUser(data.session.user);

      // Fetch subscription from backend
      const email = data.session.user.email;
      if (email) {
        setLoadingSub(true);
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";
          const res = await fetch(`${apiUrl}/api/stripe/subscription?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const json = await res.json();
            setSubscription(json);

            // Sync with localStorage for consistency
            if (json?.status === 'active') {
              const sub = {
                plan: json.plan,
                email: email,
                expiry: new Date(json.currentPeriodEnd).getTime(),
              };
              localStorage.setItem('rc_subscription', JSON.stringify(sub));
            }
          }
        } catch {
          // subscription fetch is best-effort
        }
        setLoadingSub(false);
      }

      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    );
  }

  const planLabel = subscription?.plan
    ? subscription.plan.toUpperCase()
    : "REJECTED";

  const isActive = subscription?.status === "active";

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={36} height={36} />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/analyze"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 no-underline"
          >
            Analyze →
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 max-w-[560px] mx-auto w-full px-5 py-14">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px w-6 bg-rc-red" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red">Account</span>
        </div>

        {/* Profile card */}
        <div className="bg-rc-surface border border-rc-border rounded-xl p-6 mb-4">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-hint mb-1">Email</p>
          <p className="text-[15px] text-rc-text">{user?.email}</p>
        </div>

        {/* Subscription card */}
        <div className="bg-rc-surface border border-rc-border rounded-xl p-6 mb-4">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-hint mb-3">Plan</p>

          {loadingSub ? (
            <span className="font-mono text-[11px] text-rc-hint animate-pulse">Loading…</span>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`font-mono text-[13px] font-medium tracking-wider ${
                    isActive ? "text-rc-green" : "text-rc-text"
                  }`}
                >
                  {planLabel}
                </span>
                {isActive && periodEnd && (
                  <p className="mt-1 text-[11px] font-mono text-rc-hint">
                    Renews {periodEnd}
                  </p>
                )}
              </div>
              {!isActive && (
                <Link
                  href="/pricing"
                  className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-3 py-1.5 rounded-lg transition-all duration-200 no-underline"
                >
                  Upgrade
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="bg-rc-surface border border-rc-border rounded-xl p-6">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-hint mb-3">Session</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 bg-transparent cursor-pointer disabled:opacity-40"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>

      {showSuccessModal && (
        <SuccessModal onClose={() => setShowSuccessModal(false)} />
      )}
    </div>
  );
}
