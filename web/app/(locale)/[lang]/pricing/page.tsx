"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../../../context/auth";
import { AuthNavLink } from "../../../components/AuthNavLink";
import { useSubscription, useFounderAvailability } from "../../../../lib/queries";
import { useCreateCheckout } from "../../../../lib/mutations";
import { useLanguage } from "../../../../context/language";
import { Check, ShieldCheck, Zap, Star, Trophy, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t, localePath } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState<'shortlisted' | 'hired' | 'founder' | null>(null);

  const { data: subscription } = useSubscription();
  const { data: founder } = useFounderAvailability();
  const createCheckout = useCreateCheckout();

  const activePlan = subscription?.status === 'active' ? subscription.plan : null;

  // Founder deal lives inside the Hired card: when configured, seats remain,
  // and the visitor isn't already on a paid plan, Hired shows the discounted
  // 19.99€ (real 39.99€ struck through) and checks out on the founder price.
  const founderActive = Boolean(founder?.enabled && !founder.soldOut && !activePlan);

  const plans = [
    {
      id: 'free' as const,
      name: t.pricing.plans.free.name,
      price: '0€',
      regularPrice: null as string | null,
      period: t.pricing.plans.free.period,
      description: t.pricing.plans.free.description,
      icon: <Zap className="w-5 h-5 text-rc-hint" />,
      features: t.pricing.plans.free.features as string[],
      cta: t.pricing.plans.free.cta,
      checkoutPlan: null as 'shortlisted' | 'hired' | 'founder' | null,
      href: localePath('/analyze'),
      popular: false,
      guarantee: null as string | null,
      founderBadge: null as string | null,
      seatsLeft: null as string | null,
    },
    {
      id: 'shortlisted' as const,
      name: t.pricing.plans.shortlisted.name,
      price: '19.99€',
      regularPrice: null as string | null,
      period: t.pricing.plans.shortlisted.period,
      description: t.pricing.plans.shortlisted.description,
      icon: <Star className="w-5 h-5 text-rc-red" />,
      features: t.pricing.plans.shortlisted.features as string[],
      cta: t.pricing.plans.shortlisted.cta,
      checkoutPlan: 'shortlisted' as 'shortlisted' | 'hired' | 'founder' | null,
      href: null,
      // Recommended tier — kept consistent with the landing page (§06), which
      // highlights Shortlisted as the entry paid plan.
      popular: true,
      guarantee: null as string | null,
      founderBadge: null as string | null,
      seatsLeft: null as string | null,
    },
    {
      id: 'hired' as const,
      name: t.pricing.plans.hired.name,
      price: founderActive ? '19.99€' : '39.99€',
      regularPrice: founderActive ? '39.99€' : null,
      period: t.pricing.plans.hired.period,
      description: t.pricing.plans.hired.description,
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
      features: t.pricing.plans.hired.features as string[],
      cta: founderActive ? t.pricing.founder.cta : t.pricing.plans.hired.cta,
      checkoutPlan: (founderActive ? 'founder' : 'hired') as 'shortlisted' | 'hired' | 'founder' | null,
      href: null,
      popular: false,
      guarantee: t.pricing.plans.hired.guarantee,
      founderBadge: founderActive ? t.pricing.founder.badge : null,
      seatsLeft: founderActive
        ? t.pricing.founder.seatsLeft.replace('{remaining}', String(founder!.remaining))
        : null,
    },
  ];

  // While the founder deal is live, Hired costs the same 19.99€ as Shortlisted
  // but gives strictly more — so Shortlisted is dominated. Hide it until the
  // founder seats run out (Hired reverts to 39.99€ and Shortlisted makes sense
  // again).
  const visiblePlans = plans.filter((plan) => !(founderActive && plan.id === 'shortlisted'));
  const gridCols =
    visiblePlans.length === 2 ? 'lg:grid-cols-2 max-w-[760px] mx-auto' : 'lg:grid-cols-3';

  // Top-of-funnel denominator: pairs with the server-side subscription_started /
  // sprint_pass_purchased events to read pricing → checkout → conversion.
  useEffect(() => {
    posthog.capture("pricing_viewed");
  }, []);

  useEffect(() => {
    if (searchParams.get("error") === "true") {
      toast.error("Payment cancelled. You can try again when you're ready.", { duration: 5000 });
    }
  }, [searchParams]);

  async function handlePaidPlan(plan: 'shortlisted' | 'hired' | 'founder') {
    if (!user) {
      router.push(localePath('/login?redirect=/pricing'));
      return;
    }

    if (activePlan === plan) return;

    posthog.capture("checkout_started", { plan });
    setLoadingPlan(plan);
    try {
      const data = await createCheckout.mutateAsync({ plan, email: user.email });
      if (data.url) {
        window.location.href = data.url;
      } else if (data.soldOut) {
        // Founder deal ran out between page load and click.
        toast.error(t.pricing.founder.soldOut);
        setLoadingPlan(null);
      } else {
        toast.error("Failed to get checkout URL. Please try again.");
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error('[Pricing] Checkout error:', err);
      toast.error("Checkout failed. Please try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen selection:bg-rc-red/10 selection:text-rc-red">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-rc-bg/80 backdrop-blur-md border-b border-rc-border">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-5 py-4 md:px-[40px]">
          <Link href={localePath("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity no-underline">
            <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck Logo" width={32} height={32} className="w-8 h-8 md:w-10 md:h-10" />
          </Link>
          <div className="flex items-center gap-4">
            <AuthNavLink />
            <Link
              href={localePath("/analyze")}
              className="group relative inline-flex items-center justify-center px-4 py-2 font-mono text-[11px] tracking-widest uppercase text-white bg-rc-red rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 no-underline shadow-lg shadow-rc-red/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t.navbar.tryFree}
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 md:px-[40px] pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-red/5 border border-rc-red/10 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-rc-red animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-medium">{t.pricing.badge}</span>
          </div>
          <h1 className="text-[40px] md:text-[64px] font-bold leading-[1.1] tracking-tight text-rc-text">
            {t.pricing.title} <span className="text-rc-red">{t.pricing.titleHighlight}</span>
          </h1>
          <p className="text-rc-muted text-lg md:text-xl max-w-[600px] mx-auto font-medium">
            {t.pricing.subtitle} <br className="hidden md:block" /> {t.pricing.subtitleLine2}
          </p>
        </div>

        {/* ═══ Founder deal ═══ Discounted Hired for the first 100 members.
            Shown only when the deal is configured (STRIPE_FOUNDER_PRICE_ID set)
            and the visitor isn't already on a paid plan. */}
        {founder?.enabled && !activePlan && (
          <div className="mb-8 relative overflow-hidden rounded-[24px] border border-rc-red/20 bg-gradient-to-br from-rc-red/[0.07] via-rc-red/[0.03] to-transparent p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-red/10 border border-rc-red/20">
                  <Star className="w-3.5 h-3.5 text-rc-red" fill="currentColor" />
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">
                    {t.pricing.founder.badge}
                  </span>
                </div>
                <h2 className="text-[24px] md:text-[30px] font-black tracking-tight text-rc-text leading-tight">
                  {t.pricing.founder.title}
                </h2>
                {/* Founder price: the real Hired price (39.99€) struck through
                    next to the locked-in 19.99€. Prices mirror the cards below. */}
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[20px] font-bold text-rc-hint line-through decoration-rc-red/50 decoration-2">
                    39.99€
                  </span>
                  <span className="text-[34px] md:text-[40px] font-black tracking-tight text-rc-text leading-none">
                    19.99€
                  </span>
                  <span className="font-mono text-[12px] tracking-wide text-rc-muted">
                    {t.pricing.founder.priceNote}
                  </span>
                </div>
                <p className="text-sm text-rc-muted font-medium max-w-[520px] leading-relaxed">
                  {t.pricing.founder.subtitle}
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-3 shrink-0 md:w-[240px]">
                {!founder.soldOut && (
                  <div className="space-y-2">
                    <span className="block font-mono text-[11px] tracking-widest uppercase text-rc-red text-center md:text-right">
                      {t.pricing.founder.seatsLeft.replace('{remaining}', String(founder.remaining))}
                    </span>
                    <div className="h-1.5 w-full rounded-full bg-rc-border/60 overflow-hidden">
                      <div
                        className="h-full bg-rc-red rounded-full transition-all"
                        style={{ width: `${Math.min(100, (founder.taken / founder.cap) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={() => handlePaidPlan('founder')}
                  disabled={founder.soldOut || loadingPlan !== null}
                  className="relative overflow-hidden flex items-center justify-center w-full py-4 rounded-xl font-mono text-[11px] tracking-widest uppercase transition-all duration-300 font-bold cursor-pointer bg-rc-red text-white shadow-lg shadow-rc-red/25 hover:shadow-rc-red/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {founder.soldOut ? t.pricing.founder.soldOut
                    : loadingPlan === 'founder'
                      ? t.common.processing
                      : t.pricing.founder.cta}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Grid */}
        <div className={`grid grid-cols-1 ${gridCols} gap-8 relative items-stretch`}>
          {visiblePlans.map((plan) => (
            <div
              key={plan.id}
              className={`group relative flex flex-col p-8 rounded-[24px] transition-all duration-500 hover:-translate-y-1 border ${
                plan.popular
                  ? 'bg-white border-rc-red/20 shadow-[0_20px_50px_rgba(201,58,57,0.12)] scale-[1.02] z-10'
                  : 'bg-rc-surface/50 border-rc-border hover:bg-white hover:shadow-xl hover:border-rc-red/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-rc-red text-white font-mono text-[10px] tracking-widest uppercase rounded-full shadow-lg shadow-rc-red/20 z-20">
                  {t.pricing.recommended}
                </div>
              )}

              {plan.founderBadge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 bg-rc-red text-white font-mono text-[10px] tracking-widest uppercase rounded-full shadow-lg shadow-rc-red/20 z-20 whitespace-nowrap">
                  <Star className="w-3 h-3" fill="currentColor" />
                  {plan.founderBadge}
                </div>
              )}

              <div className="mb-8 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-xl ${plan.popular ? 'bg-rc-red/10' : 'bg-rc-bg'}`}>
                      {plan.icon}
                    </div>
                    <span className={`font-mono text-[11px] tracking-[0.2em] uppercase font-bold ${plan.id === 'free' ? 'text-rc-hint' : 'text-rc-red'}`}>
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[48px] font-black tracking-tight text-rc-text">
                      {plan.price}
                    </span>
                    <span className="text-rc-hint font-mono text-sm">{plan.period}</span>
                  </div>
                  {plan.regularPrice && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-rc-hint">
                      <span>{t.pricing.founder.regularPrice}</span>
                      <span className="line-through decoration-rc-red/50 decoration-2">
                        {plan.regularPrice}
                      </span>
                    </div>
                  )}
                  {plan.seatsLeft && (
                    <p className="mt-2 font-mono text-[11px] tracking-widest uppercase text-rc-red">
                      {plan.seatsLeft}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-rc-muted leading-relaxed font-medium">
                    {plan.description}
                  </p>
                </div>
              </div>

              {plan.guarantee && (
                <div className="mb-6 p-4 rounded-2xl bg-rc-red/5 border border-rc-red/10 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-rc-red shrink-0" />
                  <span className="text-[13px] font-bold text-rc-red leading-tight">
                    {plan.guarantee}
                  </span>
                </div>
              )}

              <div className="space-y-4 mb-10 flex-1">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-rc-border to-transparent mb-6" />
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 group/item">
                      <div className={`mt-0.5 rounded-full p-0.5 transition-colors ${plan.popular ? 'bg-rc-red/10 text-rc-red' : 'bg-rc-border/50 text-rc-hint'}`}>
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                      <span className="text-[14px] text-rc-muted leading-tight group-hover/item:text-rc-text transition-colors">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                {plan.href ? (
                  <Link
                    href={plan.href}
                    className={`flex items-center justify-center w-full py-4 rounded-xl font-mono text-[11px] tracking-widest uppercase border transition-all duration-300 font-bold no-underline ${
                      activePlan === 'free' && plan.id === 'free'
                        ? 'bg-rc-bg text-rc-hint border-rc-border cursor-default opacity-60'
                        : 'border-rc-border hover:border-rc-red hover:text-rc-red hover:bg-rc-red/5'
                    }`}
                  >
                    {activePlan === 'free' && plan.id === 'free'
                      ? t.pricing.currentPlan
                      : (activePlan !== null && activePlan !== 'free' && plan.id === 'free')
                        ? t.pricing.downgradeToFree
                        : plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => plan.checkoutPlan && handlePaidPlan(plan.checkoutPlan)}
                    disabled={loadingPlan !== null || activePlan === plan.id}
                    className={`relative overflow-hidden flex items-center justify-center w-full py-4 rounded-xl text-[14px] font-semibold transition-all duration-300 group/btn cursor-pointer ${
                      activePlan === plan.id
                        ? 'bg-rc-bg text-rc-hint border border-rc-border cursor-default'
                        : plan.popular
                          ? 'bg-rc-red text-white shadow-lg shadow-rc-red/25 hover:shadow-rc-red/40 hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-rc-text text-white hover:bg-rc-red hover:shadow-lg active:scale-[0.98]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="relative z-10">
                      {activePlan === plan.id
                        ? t.pricing.currentPlan
                        : loadingPlan === plan.checkoutPlan
                          ? t.common.processing
                          : plan.cta}
                    </span>
                    {activePlan !== plan.id && (
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                    )}
                  </button>
                )}
                {plan.checkoutPlan && activePlan !== plan.id && (
                  <p className="mt-3 text-center text-[11px] text-rc-hint">
                    {t.pricing.safetyNote}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap text-[12px] text-rc-hint font-sans">
          <span>Cancel anytime</span>
          <span className="w-1 h-1 rounded-full bg-rc-border" />
          <span>
            Hired? <strong className="text-rc-muted font-semibold">We&apos;ll refund your last month</strong> — once, within 30 days, on proof of hire.
          </span>
        </div>

        <div className="mt-24 text-center">
          <p className="text-rc-hint text-sm font-mono tracking-widest uppercase">{t.pricing.footer.support}</p>
        </div>
      </div>

      {/* ═══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section id="pricing-faq" className="relative z-10 border-t border-rc-border bg-rc-bg">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">FAQ</span>
          </div>
          <h2 className="text-[28px] md:text-[40px] font-semibold leading-[1.12] tracking-[-0.02em] text-rc-text mb-4">
            {t.pricing.faq.title}
          </h2>
          <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[620px] mb-10">
            {t.pricing.faq.subtitle}
          </p>

          <div className="space-y-3">
            {t.pricing.faq.items.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-rc-border bg-rc-surface open:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 px-5 py-4 md:px-6 md:py-5">
                  <h3 className="text-[16px] md:text-[17px] font-semibold text-rc-text leading-[1.35]">
                    {item.question}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="shrink-0 mt-1 font-mono text-[18px] text-rc-red transition-transform group-open:rotate-45 select-none"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 md:px-6 md:pb-6 -mt-1">
                  <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.7]">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
      {/* Footer is provided by the layout (shared SeoFooter) — no inline footer here. */}
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">Loading…</span>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
