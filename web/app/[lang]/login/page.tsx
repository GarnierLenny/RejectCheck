"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../../lib/supabase";
import { useLanguage } from "../../../context/language";

type Mode = "signin" | "signup";

type OAuthProvider = "google" | "linkedin_oidc" | "github";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const supabase = createClient();
  const { t, localePath, locale } = useLanguage();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(redirect);
    });
  }, [router, redirect, supabase.auth]);

  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam === 'auth_failed' || errParam === 'missing_code') {
      setError(t.login.oauthError);
    }
  }, [searchParams, t.login.oauthError]);

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setInfo(null);
    setLoading(true);
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', redirect);
    callbackUrl.searchParams.set('lang', locale);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl.toString() },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success the browser is redirected to the provider; no need to reset loading.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push(redirect);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo(t.login.confirmEmail);
        setMode("signin");
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border">
        <Link href={localePath("/")} className="flex items-center gap-2.5 no-underline">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={36} height={36} />
        </Link>
        <Link
          href={localePath("/analyze")}
          className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 no-underline"
        >
          {t.login.tryFree}
        </Link>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-red" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red">
                {mode === "signin" ? t.login.signIn : t.login.createAccount}
              </span>
            </div>
            <h1 className="text-[28px] font-semibold text-rc-text leading-tight">
              {mode === "signin" ? t.login.welcomeBack : t.login.getStarted}
            </h1>
            <p className="mt-2 text-[13px] text-rc-hint font-sans">
              {mode === "signin" ? t.login.signInDesc : t.login.signUpDesc}
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-rc-red-bg border border-rc-red-border text-[13px] text-rc-red font-mono">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-rc-green-bg border border-rc-green-border text-[13px] text-rc-green font-mono">
              {info}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="flex flex-col gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-rc-surface border border-rc-border text-[13px] font-mono text-rc-text hover:border-rc-red/40 hover:bg-rc-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.login.continueWithGoogle}
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("linkedin_oidc")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-rc-surface border border-rc-border text-[13px] font-mono text-rc-text hover:border-rc-red/40 hover:bg-rc-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
              </svg>
              {t.login.continueWithLinkedIn}
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-rc-surface border border-rc-border text-[13px] font-mono text-rc-text hover:border-rc-red/40 hover:bg-rc-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.83.58A12 12 0 0 0 12 .3"/>
              </svg>
              {t.login.continueWithGitHub}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint">{t.login.or}</span>
            <div className="flex-1 h-px bg-rc-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-muted">
                {t.login.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-rc-surface border border-rc-border text-[13px] font-sans text-rc-text placeholder:text-rc-hint focus:outline-none focus:border-rc-red/40 transition-colors"
              />
            </div>

            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-muted">
                  {t.login.username}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="johndoe"
                  className="w-full px-4 py-3 rounded-lg bg-rc-surface border border-rc-border text-[13px] font-sans text-rc-text placeholder:text-rc-hint focus:outline-none focus:border-rc-red/40 transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-muted">
                {t.login.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-rc-surface border border-rc-border text-[13px] font-sans text-rc-text placeholder:text-rc-hint focus:outline-none focus:border-rc-red/40 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full font-mono text-[12px] tracking-[0.14em] uppercase text-white bg-rc-red rounded-lg py-3.5 border-none cursor-pointer transition-all duration-200 hover:bg-[#b33332] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? "..."
                : mode === "signin"
                ? t.login.signIn
                : t.login.createAccount}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-[12px] font-mono text-rc-hint flex flex-col gap-4">
            <span>
              {mode === "signin" ? t.login.noAccount : t.login.haveAccount}{" "}
              <button
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
                className="text-rc-red hover:underline bg-transparent border-none cursor-pointer font-mono text-[12px] p-0"
              >
                {mode === "signin" ? t.login.signUp : t.login.signIn}
              </button>
            </span>
            <Link href={localePath("/privacy")} className="opacity-60 hover:opacity-100 transition-opacity hover:text-rc-red no-underline">
              {t.login.privacyLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
