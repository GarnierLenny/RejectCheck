"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../lib/supabase";

type Mode = "signin" | "signup";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const supabase = createClient();

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
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={36} height={36} />
        </Link>
        <Link
          href="/analyze"
          className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 no-underline"
        >
          Try free →
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
                {mode === "signin" ? "Sign in" : "Create account"}
              </span>
            </div>
            <h1 className="text-[28px] font-semibold text-rc-text leading-tight">
              {mode === "signin" ? "Welcome back." : "Get started."}
            </h1>
            <p className="mt-2 text-[13px] text-rc-hint font-sans">
              {mode === "signin"
                ? "Sign in to access your subscription and analysis history."
                : "Create an account to unlock subscription benefits."}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-muted">
                Email
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
                  Username
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
                Password
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
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-[12px] font-mono text-rc-hint flex flex-col gap-4">
            <span>
              {mode === "signin" ? "No account?" : "Already have an account?"}{" "}
              <button
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
                className="text-rc-red hover:underline bg-transparent border-none cursor-pointer font-mono text-[12px] p-0"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </span>
            <Link href="/privacy" className="opacity-60 hover:opacity-100 transition-opacity hover:text-rc-red no-underline">
              Privacy Policy & GDPR →
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
