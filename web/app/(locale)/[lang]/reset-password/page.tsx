"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { createClient } from "../../../../lib/supabase";
import { useLanguage } from "../../../../context/language";
import { PasswordField } from "../../../../app/components/PasswordField";
import posthog from "posthog-js";

type Status = "checking" | "ready" | "expired";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t, localePath } = useLanguage();

  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // The /auth/callback exchanged the recovery code for a session before
  // redirecting here, so a valid session means the link is still good.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ready" : "expired");
    });
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t.resetPassword.tooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.resetPassword.noMatch);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    posthog.capture("password_reset_completed");
    setInfo(t.resetPassword.success);
    setTimeout(() => router.replace(localePath("/dashboard")), 1200);
  }

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border">
        <Link href={localePath("/")} className="flex items-center gap-2.5 no-underline">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={36} height={36} />
        </Link>
        <Link
          href={localePath("/login")}
          className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 no-underline"
        >
          {t.login.backToSignIn}
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-[400px]">
          {status === "checking" && (
            <div className="flex items-center justify-center gap-3 text-rc-hint">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-[11px] tracking-widest uppercase">{t.resetPassword.verifying}</span>
            </div>
          )}

          {status === "expired" && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-6 bg-rc-red" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red">{t.resetPassword.eyebrow}</span>
                <div className="h-px w-6 bg-rc-red" />
              </div>
              <p className="text-[14px] text-rc-text mb-6 leading-relaxed">{t.resetPassword.linkExpired}</p>
              <Link
                href={localePath("/login")}
                className="inline-flex items-center justify-center px-6 py-3 bg-rc-red text-white font-mono text-[11px] tracking-[0.14em] uppercase rounded-lg no-underline hover:bg-[#b33332] transition-colors"
              >
                {t.resetPassword.requestNew}
              </Link>
            </div>
          )}

          {status === "ready" && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-6 bg-rc-red" />
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red">
                    {t.resetPassword.eyebrow}
                  </span>
                </div>
                <h1 className="text-[28px] font-semibold text-rc-text leading-tight">{t.resetPassword.title}</h1>
                <p className="mt-2 text-[13px] text-rc-hint font-sans">{t.resetPassword.desc}</p>
              </div>

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

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  label={t.resetPassword.newPassword}
                  autoComplete="new-password"
                  showStrength
                />
                <PasswordField
                  value={confirm}
                  onChange={setConfirm}
                  label={t.resetPassword.confirmPassword}
                  autoComplete="new-password"
                />
                <button
                  type="submit"
                  disabled={loading || !!info}
                  className="mt-2 w-full flex items-center justify-center gap-2 font-mono text-[12px] tracking-[0.14em] uppercase text-white bg-rc-red rounded-lg py-3.5 border-none cursor-pointer transition-all duration-200 hover:bg-[#b33332] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {loading ? t.resetPassword.updating : t.resetPassword.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
