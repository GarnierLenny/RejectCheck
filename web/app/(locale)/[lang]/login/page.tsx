"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { createClient } from "../../../../lib/supabase";
import { useLanguage } from "../../../../context/language";
import { PasswordField } from "../../../../app/components/PasswordField";
import { AuthHero } from "../../../../app/components/AuthHero";
import posthog from "posthog-js";

type Mode = "signin" | "signup" | "reset";

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

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setInfo(null);
    setLoading(true);
    posthog.capture("oauth_login_initiated", { provider });
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

    if (mode === "reset") {
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', '/reset-password');
      callbackUrl.searchParams.set('lang', locale);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl.toString(),
      });
      if (error) {
        setError(error.message);
      } else {
        posthog.capture("password_reset_requested");
        setInfo(t.login.resetSent);
      }
    } else if (mode === "signin") {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        if (signInData.user) {
          posthog.identify(signInData.user.id, { email: signInData.user.email });
        }
        posthog.capture("user_signed_in", { method: "email" });
        router.push(redirect);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        setError(error.message);
      } else {
        posthog.capture("user_signed_up", { method: "email" });
        setInfo(t.login.confirmEmail);
        setMode("signin");
      }
    }

    setLoading(false);
  }

  const eyebrow =
    mode === "reset" ? t.login.resetEyebrow : mode === "signin" ? t.login.signIn : t.login.createAccount;
  const heading =
    mode === "reset" ? t.login.resetTitle : mode === "signin" ? t.login.welcomeBack : t.login.getStarted;
  const subheading =
    mode === "reset" ? t.login.resetDesc : mode === "signin" ? t.login.signInDesc : t.login.signUpDesc;
  const submitLabel =
    mode === "reset" ? t.login.sendResetLink : mode === "signin" ? t.login.signIn : t.login.createAccount;

  const oauthButtons: { provider: OAuthProvider; label: string; icon: React.ReactNode }[] = [
    {
      provider: "google",
      label: t.login.continueWithGoogle,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    {
      provider: "linkedin_oidc",
      label: t.login.continueWithLinkedIn,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
        </svg>
      ),
    },
    {
      provider: "github",
      label: t.login.continueWithGitHub,
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.83.58A12 12 0 0 0 12 .3"/>
        </svg>
      ),
    },
  ];

  return (
    <main className="rc-auth-shell">
      <AuthHero />

      <section className="rc-auth-form-panel">
        <div className="rc-auth-topbar">
          <Link href={localePath("/")} className="rc-auth-topbar-logo" aria-label="RejectCheck">
            <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={28} height={28} />
          </Link>
          <Link href={localePath("/analyze")} className="rc-auth-tryfree">
            {t.login.tryFree}
          </Link>
        </div>

        <form className="rc-auth-form" onSubmit={handleSubmit} noValidate>
          <div className="rc-auth-kicker">
            <span className="bar" />
            <span className="ktxt">{eyebrow}</span>
          </div>
          <h1 className="rc-auth-h1">{heading}</h1>
          <p className="rc-auth-sub">{subheading}</p>

          {error && <div className="rc-auth-alert err">{error}</div>}
          {info && <div className="rc-auth-alert ok">{info}</div>}

          {mode !== "reset" && (
            <>
              <div className="rc-auth-oauth">
                {oauthButtons.map((b) => (
                  <button
                    key={b.provider}
                    type="button"
                    className="rc-auth-oauth-btn"
                    onClick={() => handleOAuth(b.provider)}
                    disabled={loading}
                  >
                    {b.icon}
                    {b.label}
                  </button>
                ))}
              </div>

              <div className="rc-auth-or">
                <span className="line" />
                <span className="word">{t.login.or}</span>
                <span className="line" />
              </div>
            </>
          )}

          <div className="rc-auth-field">
            <label className="rc-auth-field-label" htmlFor="email">
              {t.login.email}
            </label>
            <div className="rc-auth-input-wrap">
              <input
                id="email"
                className="rc-auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="toi@exemple.com"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div className="rc-auth-field">
              <label className="rc-auth-field-label" htmlFor="username">
                {t.login.username}
              </label>
              <div className="rc-auth-input-wrap">
                <input
                  id="username"
                  className="rc-auth-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="johndoe"
                />
              </div>
            </div>
          )}

          {mode !== "reset" && (
            <PasswordField
              value={password}
              onChange={setPassword}
              label={t.login.password}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              showStrength={mode === "signup"}
              meta={
                mode === "signin" ? (
                  <button type="button" onClick={() => switchMode("reset")}>
                    {t.login.forgotPassword}
                  </button>
                ) : undefined
              }
            />
          )}

          <button type="submit" className="rc-auth-submit" disabled={loading}>
            {loading && <Loader2 className="rc-auth-spin" width={15} height={15} />}
            {submitLabel}
            {!loading && <span className="arr">→</span>}
          </button>

          <div className="rc-auth-foot">
            {mode === "reset" ? (
              <button type="button" onClick={() => switchMode("signin")}>
                {t.login.backToSignIn}
              </button>
            ) : (
              <span>
                {mode === "signin" ? t.login.noAccount : t.login.haveAccount}{" "}
                <button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}>
                  {mode === "signin" ? t.login.signUp : t.login.signIn}
                </button>
              </span>
            )}
          </div>

          <Link href={localePath("/privacy")} className="rc-auth-privacy">
            {t.login.privacyLink}
          </Link>
        </form>
      </section>
    </main>
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
