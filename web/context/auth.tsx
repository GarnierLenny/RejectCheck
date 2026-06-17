"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import { authHeaders } from "../lib/api";
import { getPendingClaim, clearPendingClaim } from "../lib/pending-claim";
import { whenIdle } from "../lib/idle";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

function syncSentryUser(user: User | null | undefined): void {
  Sentry.setUser(user ? { id: user.id, email: user.email } : null);
}

function syncPosthogUser(user: User | null | undefined): void {
  if (user) {
    posthog.identify(user.id, { email: user.email });
  } else {
    posthog.reset();
  }
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Holds the lazily-created client so signOut can reuse it without a second import.
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    // Defer the Supabase client (and its ~200 KB SDK) off the critical render
    // path: it's dynamically imported at idle, so it lands in its own chunk
    // instead of every page's first-load bundle. Marketing/SEO pages get the
    // auth state once the browser is idle (the navbar shows its loading state
    // until then, exactly as it already did during the async getSession).
    whenIdle(async () => {
      if (cancelled) return;
      const { createClient } = await import("../lib/supabase");
      if (cancelled) return;
      const supabase = createClient();
      supabaseRef.current = supabase;

      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          syncSentryUser(data.session?.user);
          syncPosthogUser(data.session?.user);
        }
      } catch {
        // Supabase unavailable; leave user/session as null
      } finally {
        if (!cancelled) setLoading(false);
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setUser(next?.user ?? null);
        syncSentryUser(next?.user);
        syncPosthogUser(next?.user);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Claim an analysis the user ran while logged out (set just before signup).
  // Idempotent: a 404 means it's already claimed/expired, so we clear either way
  // and only keep the token to retry on transient/network errors.
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    const pending = getPendingClaim();
    if (!pending) return;
    fetch(`${API_URL}/api/analyze/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ claimToken: pending }),
    })
      .then((res) => {
        if (res.ok || res.status === 404) clearPendingClaim();
      })
      .catch(() => {
        /* keep the token, retry on next load */
      });
  }, [session]);

  async function signOut() {
    const supabase =
      supabaseRef.current ?? (await import("../lib/supabase")).createClient();
    await supabase.auth.signOut();
    syncSentryUser(null);
    syncPosthogUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
