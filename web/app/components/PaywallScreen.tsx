"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Star,
  ShieldCheck,
  Trophy,
  Coins,
} from "lucide-react";
import { useLanguage } from "../../context/language";
import posthog from "posthog-js";
import { BuyCreditsModal } from "./BuyCreditsModal";

type SubmitState = "idle" | "loading" | "success" | "conflict" | "error";

/**
 * Three flavours of the paywall:
 *  - `guest_limit`  : anonymous user hit the lifetime IP cap. Show waitlist
 *    fallback + signup CTA — the current pre-credits behaviour.
 *  - `free_cap`     : signed-in free user used their 3 monthly analyses.
 *    Show subscription upgrade primary + buy-credits secondary.
 *  - `subscriber_cap`: paying user reached their monthly cap (15 or 30).
 *    Focus on buy-credits; the subscription is already maxed.
 *
 * `monthlyCap` is rendered into the copy when provided — falls back to
 * generic phrasing otherwise.
 */
export type PaywallMode = "guest_limit" | "free_cap" | "subscriber_cap";

interface PaywallScreenProps {
  mode?: PaywallMode;
  monthlyCap?: number;
}

export function PaywallScreen({
  mode = "guest_limit",
  monthlyCap,
}: PaywallScreenProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const { t, localePath } = useLanguage();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";
      const res = await fetch(`${apiUrl}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 201) {
        posthog.capture("waitlist_joined");
        setState("success");
      } else if (res.status === 409) setState("conflict");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  const title =
    mode === "subscriber_cap"
      ? t.paywall.subscriberCapTitle
      : mode === "free_cap"
        ? t.paywall.freeCapTitle
        : t.paywall.title;
  const titleHighlight =
    mode === "subscriber_cap" || mode === "free_cap"
      ? ""
      : t.paywall.titleHighlight;
  const subtitle =
    mode === "subscriber_cap"
      ? t.paywall.subscriberCapSubtitle
      : mode === "free_cap"
        ? t.paywall.freeCapSubtitle
        : t.paywall.subtitle;

  return (
    <>
      <div className="flex items-center justify-center min-h-[80vh] py-12 px-4 selection:bg-rc-red/10 selection:text-rc-red">
        <div className="bg-white border border-rc-border rounded-[32px] p-8 md:p-14 w-full max-w-[620px] shadow-[0_30px_70px_rgba(201,58,57,0.08)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Trophy className="w-40 h-40" />
          </div>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-red/5 border border-rc-red/10 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-rc-red animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">
                {t.paywall.badge}
              </span>
            </div>

            <h2 className="text-[32px] md:text-[42px] font-bold text-rc-text mb-4 leading-[1.1] tracking-tight">
              {title}
              {titleHighlight ? (
                <>
                  {" "}
                  <span className="text-rc-red">{titleHighlight}</span>
                </>
              ) : null}
            </h2>

            <p className="text-[17px] text-rc-muted mb-10 mx-auto max-w-[440px] leading-relaxed font-medium">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
              {mode === "subscriber_cap" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      posthog.capture("credit_purchase_started", {
                        source: "paywall_subscriber_cap",
                      });
                      setIsCreditsModalOpen(true);
                    }}
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rc-red/25 font-bold"
                  >
                    <Coins className="mr-2 w-4 h-4" />
                    {t.paywall.buyCredits}
                  </button>
                  <Link
                    href={localePath("/analyze")}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.reload();
                    }}
                    className="inline-flex items-center justify-center px-8 py-4 border border-rc-border text-rc-muted hover:text-rc-text hover:bg-rc-bg transition-all duration-300 font-mono text-[11px] tracking-widest uppercase rounded-xl no-underline font-bold"
                  >
                    {t.paywall.backToAnalyzer}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={localePath("/pricing")}
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rc-red/25 no-underline font-bold"
                  >
                    {t.paywall.getAccess}{" "}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  {mode === "free_cap" ? (
                    <button
                      type="button"
                      onClick={() => {
                        posthog.capture("credit_purchase_started", {
                          source: "paywall_free_cap",
                        });
                        setIsCreditsModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center px-8 py-4 border border-rc-border text-rc-muted hover:text-rc-text hover:bg-rc-bg transition-all duration-300 font-mono text-[11px] tracking-widest uppercase rounded-xl font-bold"
                    >
                      <Coins className="mr-2 w-4 h-4" />
                      Buy credits
                    </button>
                  ) : (
                    <Link
                      href={localePath("/analyze")}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.reload();
                      }}
                      className="inline-flex items-center justify-center px-8 py-4 border border-rc-border text-rc-muted hover:text-rc-text hover:bg-rc-bg transition-all duration-300 font-mono text-[11px] tracking-widest uppercase rounded-xl no-underline font-bold"
                    >
                      {t.paywall.backToAnalyzer}
                    </Link>
                  )}
                </>
              )}
            </div>

            {mode === "guest_limit" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-12">
                  {[
                    { icon: <Zap className="w-4 h-4 text-rc-red" />, text: t.paywall.features[0] },
                    { icon: <Star className="w-4 h-4 text-rc-red" />, text: t.paywall.features[1] },
                    { icon: <ShieldCheck className="w-4 h-4 text-rc-red" />, text: t.paywall.features[2] },
                    { icon: <Trophy className="w-4 h-4 text-rc-red" />, text: t.paywall.features[3] },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-rc-bg/40 border border-rc-border/50">
                      {feature.icon}
                      <span className="text-[13px] font-bold text-rc-muted leading-none">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-rc-border to-transparent mb-12" />

                <div className="max-w-[400px] mx-auto">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint mb-4 font-bold">
                    {t.paywall.waitlist.label}
                  </p>
                  {state === "success" ? (
                    <div className="p-4 bg-rc-green-bg border border-rc-green-border rounded-xl">
                      <p className="text-[14px] text-rc-green font-bold">{t.paywall.waitlist.success}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex gap-2">
                      <input
                        type="email"
                        placeholder={t.paywall.waitlist.placeholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-rc-bg border border-rc-border rounded-lg px-4 py-2 text-[14px] outline-none focus:border-rc-red/20 transition-colors"
                        required
                      />
                      <button
                        type="submit"
                        disabled={state === "loading"}
                        className="bg-rc-text text-white px-4 py-2 rounded-lg text-[11px] font-mono uppercase tracking-widest hover:opacity-90 transition-opacity font-bold disabled:opacity-50"
                      >
                        {t.paywall.waitlist.join}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}

            {(mode === "free_cap" || mode === "subscriber_cap") && (
              <p className="text-[13px] text-rc-hint mt-4">
                {t.paywall.creditsExpiryNote}
              </p>
            )}
          </div>
        </div>
      </div>

      <BuyCreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </>
  );
}
