"use client";

import { createContext, useContext, useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase";
import { authHeaders } from "../lib/api";
import { getPendingClaim, clearPendingClaim } from "../lib/pending-claim";

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
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        syncSentryUser(data.session?.user);
        syncPosthogUser(data.session?.user);
      })
      .catch(() => {
        // Supabase unavailable; leave user/session as null
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      syncSentryUser(session?.user);
      syncPosthogUser(session?.user);
    });

    return () => listener.subscription.unsubscribe();
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
