"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Trophy,
  Coins,
} from "lucide-react";
import { useLanguage } from "../../context/language";
import { useCreateSprintPassCheckout } from "../../lib/mutations";
import posthog from "posthog-js";
import { BuyCreditsModal } from "./BuyCreditsModal";

/**
 * Three flavours of the paywall:
 *  - `guest_limit`  : anonymous user hit the lifetime IP cap. The primary path
 *    is now "create a free account" (unlocks their own monthly quota + saved
 *    analyses + dashboard); pricing is demoted to a secondary link.
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
}: PaywallScreenProps) {
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const { t, localePath, locale } = useLanguage();
  const sprintPass = useCreateSprintPassCheckout();

  const isGuest = mode === "guest_limit";
  const g = t.paywall.guest;

  const badge = isGuest ? g.badge : t.paywall.badge;
  const title =
    mode === "subscriber_cap"
      ? t.paywall.subscriberCapTitle
      : mode === "free_cap"
        ? t.paywall.freeCapTitle
        : g.title;
  const titleHighlight =
    mode === "subscriber_cap" || mode === "free_cap" ? "" : g.titleHighlight;
  const subtitle =
    mode === "subscriber_cap"
      ? t.paywall.subscriberCapSubtitle
      : mode === "free_cap"
        ? t.paywall.freeCapSubtitle
        : g.subtitle;

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
                {badge}
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

            <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-center">
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
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-rc-red text-white text-[14px] rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rc-red/25 font-bold"
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
              ) : isGuest ? (
                <>
                  <button
                    type="button"
                    disabled={sprintPass.isPending}
                    onClick={() => {
                      posthog.capture("sprint_checkout_started", {
                        source: "paywall_guest_limit",
                      });
                      sprintPass.mutate(
                        { locale },
                        {
                          // Anonymous Sprint pass: no account yet, so Stripe
                          // collects the email at checkout and the webhook grants
                          // access by that verified email. Not configured (null
                          // url) → plans page instead of a dead click.
                          onSuccess: (data) => {
                            window.location.href =
                              data.url ?? localePath("/pricing");
                          },
                          onError: () => {
                            window.location.href = localePath("/pricing");
                          },
                        },
                      );
                    }}
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-rc-red text-white text-[14px] rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rc-red/25 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sprintPass.isPending ? t.common.processing : g.buyCta}{" "}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <Link
                    href={localePath("/login")}
                    onClick={() =>
                      posthog.capture("paywall_signup_clicked", {
                        source: "paywall_guest_limit",
                      })
                    }
                    className="inline-flex items-center justify-center px-8 py-4 border border-rc-border text-rc-muted hover:text-rc-text hover:bg-rc-bg transition-all duration-300 rounded-xl no-underline font-bold text-[14px]"
                  >
                    {g.cta}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={sprintPass.isPending}
                    onClick={() => {
                      posthog.capture("sprint_checkout_started", {
                        source: "paywall_free_cap",
                      });
                      sprintPass.mutate(
                        { locale },
                        {
                          onSuccess: (data) => {
                            // Deal not configured yet (STRIPE_SPRINT_PRICE_ID
                            // unset) → send to the plans page, not a dead click.
                            if (!data.url)
                              window.location.href = localePath("/pricing");
                          },
                        },
                      );
                    }}
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-rc-red text-white text-[14px] rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rc-red/25 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sprintPass.isPending
                      ? t.common.processing
                      : t.paywall.sprintCta}{" "}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <Link
                    href={localePath("/pricing")}
                    className="inline-flex items-center justify-center px-8 py-4 border border-rc-border text-rc-muted hover:text-rc-text hover:bg-rc-bg transition-all duration-300 font-mono text-[11px] tracking-widest uppercase rounded-xl no-underline font-bold"
                  >
                    {t.paywall.seeMonthlyPlans}
                  </Link>
                </>
              )}
            </div>

            {mode === "free_cap" && (
              <div className="flex flex-col items-center gap-1.5 mb-2">
                <p className="text-[12px] text-rc-hint">{t.paywall.sprintSafety}</p>
                <button
                  type="button"
                  onClick={() => {
                    posthog.capture("credit_purchase_started", {
                      source: "paywall_free_cap",
                    });
                    setIsCreditsModalOpen(true);
                  }}
                  className="text-[12px] text-rc-hint underline hover:text-rc-text transition-colors"
                >
                  {t.paywall.orBuyCredits}
                </button>
              </div>
            )}
            {mode === "subscriber_cap" && (
              <p className="text-[12px] text-rc-hint mb-2">{t.paywall.safetyOneTime}</p>
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
