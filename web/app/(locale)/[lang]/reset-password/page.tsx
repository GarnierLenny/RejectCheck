"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { createClient } from "../../../../lib/supabase";
import { useLanguage } from "../../../../context/language";
import { PasswordField } from "../../../../app/components/PasswordField";
import { AuthHero } from "../../../../app/components/AuthHero";
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
    <main className="rc-auth-shell">
      <AuthHero />

      <section className="rc-auth-form-panel">
        <div className="rc-auth-topbar">
          <Link href={localePath("/")} className="rc-auth-topbar-logo" aria-label="RejectCheck">
            <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={28} height={28} />
          </Link>
          <Link href={localePath("/login")} className="rc-auth-tryfree">
            {t.login.backToSignIn}
          </Link>
        </div>

        {status === "checking" && (
          <div className="rc-auth-form" style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--rc-hint)" }}>
            <Loader2 className="rc-auth-spin" width={16} height={16} />
            <span className="font-mono text-[11px] tracking-widest uppercase">{t.resetPassword.verifying}</span>
          </div>
        )}

        {status === "expired" && (
          <div className="rc-auth-form" style={{ textAlign: "center" }}>
            <div className="rc-auth-kicker" style={{ justifyContent: "center" }}>
              <span className="bar" />
              <span className="ktxt">{t.resetPassword.eyebrow}</span>
            </div>
            <p className="rc-auth-sub" style={{ marginBottom: 22 }}>{t.resetPassword.linkExpired}</p>
            <Link href={localePath("/login")} className="rc-auth-submit" style={{ textDecoration: "none" }}>
              {t.resetPassword.requestNew}
              <span className="arr">→</span>
            </Link>
          </div>
        )}

        {status === "ready" && (
          <form className="rc-auth-form" onSubmit={handleSubmit} noValidate>
            <div className="rc-auth-kicker">
              <span className="bar" />
              <span className="ktxt">{t.resetPassword.eyebrow}</span>
            </div>
            <h1 className="rc-auth-h1">{t.resetPassword.title}</h1>
            <p className="rc-auth-sub">{t.resetPassword.desc}</p>

            {error && <div className="rc-auth-alert err">{error}</div>}
            {info && <div className="rc-auth-alert ok">{info}</div>}

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

            <button type="submit" className="rc-auth-submit" disabled={loading || !!info}>
              {loading && <Loader2 className="rc-auth-spin" width={15} height={15} />}
              {loading ? t.resetPassword.updating : t.resetPassword.submit}
              {!loading && <span className="arr">→</span>}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
