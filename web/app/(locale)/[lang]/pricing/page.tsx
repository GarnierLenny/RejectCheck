"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../../../context/auth";
import { AuthNavLink } from "../../../components/AuthNavLink";
import { useSubscription, useFounderAvailability } from "../../../../lib/queries";
import { useCreateCheckout } from "../../../../lib/mutations";
import { useLanguage } from "../../../../context/language";
import { Check, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";

function PricingContent() {
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
      features: t.pricing.plans.shortlisted.features as string[],
      cta: t.pricing.plans.shortlisted.cta,
      checkoutPlan: 'shortlisted' as 'shortlisted' | 'hired' | 'founder' | null,
      href: null,
      // Never rendered: filtered out of visiblePlans below. Kept so the shape
      // stays available if the plan is ever put back on sale.
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
      // Carries what the founder banner used to say, now that it is gone: the
      // price is locked for life, and the seats are capped.
      period: founderActive ? t.pricing.founder.priceNote : t.pricing.plans.hired.period,
      description: founderActive
        ? t.pricing.founder.subtitle.replace('{cap}', String(founder!.cap))
        : t.pricing.plans.hired.description,
      features: t.pricing.plans.hired.features as string[],
      cta: founderActive ? t.pricing.founder.cta : t.pricing.plans.hired.cta,
      checkoutPlan: (founderActive ? 'founder' : 'hired') as 'shortlisted' | 'hired' | 'founder' | null,
      href: null,
      // Carries the highlighted treatment now that Shortlisted is gone: it is
      // the only paid plan, so it is the recommended one. Without this the CTA
      // falls into the neutral branch and renders black instead of red.
      popular: true,
      guarantee: t.pricing.plans.hired.guarantee,
      founderBadge: founderActive ? t.pricing.founder.badge : null,
      seatsLeft: founderActive
        ? t.pricing.founder.seatsLeft
            .replace('{remaining}', String(founder!.remaining))
            .replace('{cap}', String(founder!.cap))
        : null,
    },
  ];

  // Shortlisted is no longer sold. The plan, its Stripe price and its
  // entitlement stay wired so existing subscribers keep working, but it is
  // never offered again, here or on the landing. Both surfaces must agree.
  const visiblePlans = plans.filter((plan) => plan.id !== 'shortlisted');
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
    // Anonymous checkout is supported: the backend route is OptionalSupabaseGuard
    // and Stripe collects the email at checkout, so we don't gate on login here.
    // (A signed-in user's email is passed through to prefill the Stripe form.)
    if (activePlan === plan) return;

    posthog.capture("checkout_started", { plan });
    setLoadingPlan(plan);
    try {
      const data = await createCheckout.mutateAsync({ plan, email: user?.email });
      if (data.url) {
        // assign() rather than setting .href: same navigation, but it is a
        // method call, which the react-hooks immutability rule accepts.
        window.location.assign(data.url);
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

      {/* Exactly one viewport tall, content centred inside it: this page has one
          job and cannot ask for a scroll to do it, and the FAQ section's top
          border below then lands precisely on the fold. */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-[40px] pt-[73px] pb-6 min-h-screen flex flex-col justify-center">
        {/* Header. The block is centred in the viewport, so a larger bottom
            margin lifts the title and pushes the cards down at the same time. */}
        <div className="text-center mb-16">
          <h1 className="text-[30px] md:text-[40px] font-bold leading-[1.15] tracking-tight text-rc-text">
            {t.pricing.title} <span className="text-rc-red">{t.pricing.titleHighlight}</span>
          </h1>
        </div>

        {/* The founder deal used to be repeated here as a banner above the
            grid. It duplicated the Hired card one for one (badge, both prices,
            seat count, CTA), so it now lives only on that card, where the
            price sits next to the alternative it is compared against. */}

        {/* Pricing Grid */}
        {/* items-start: tops line up, and the shorter Free card simply ends
            earlier instead of being stretched to match the paid one. */}
        <div className={`grid grid-cols-1 ${gridCols} gap-8 relative items-start`}>
          {visiblePlans.map((plan) => (
            <div
              key={plan.id}
              className={`group relative flex flex-col p-6 md:p-7 rounded-[24px] transition-all duration-500 hover:-translate-y-1 border ${
                plan.popular
                  ? 'bg-white border-rc-red/20 shadow-[0_20px_50px_rgba(201,58,57,0.12)] scale-[1.02] origin-top z-10'
                  : 'bg-rc-surface/50 border-rc-border hover:bg-white hover:shadow-xl hover:border-rc-red/10'
              }`}
            >
              {/* Both badges are pinned to the same spot, so the founder one
                  wins when the deal is live. */}
              {plan.popular && !plan.founderBadge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-rc-red text-white font-mono text-[10px] tracking-widest uppercase rounded-full shadow-lg shadow-rc-red/20 z-20">
                  {t.pricing.recommended}
                </div>
              )}

              {/* Badge and seat count sit together on the card's top edge: the
                  scarcity belongs with the label that creates it, not buried
                  under the price. */}
              {plan.founderBadge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rc-red text-white font-mono text-[10px] tracking-widest uppercase rounded-full shadow-lg shadow-rc-red/20 whitespace-nowrap">
                    <Star className="w-3 h-3" fill="currentColor" />
                    {plan.founderBadge}
                    {plan.seatsLeft && (
                      <>
                        <span aria-hidden className="opacity-50">·</span>
                        {plan.seatsLeft}
                      </>
                    )}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="mb-2">
                  <span className={`font-mono text-[11px] tracking-[0.2em] uppercase font-bold ${plan.id === 'free' ? 'text-rc-hint' : 'text-rc-red'}`}>
                    {plan.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[46px] font-black tracking-tight text-rc-text leading-none">
                    {plan.price}
                  </span>
                  <span className="text-rc-hint font-mono text-sm">{plan.period}</span>
                  {plan.regularPrice && (
                    <span className="text-[13px] font-medium text-rc-hint">
                      {t.pricing.founder.regularPrice}{' '}
                      <span className="line-through decoration-rc-red/50 decoration-2">
                        {plan.regularPrice}
                      </span>
                    </span>
                  )}
                </div>
                <p className="mt-2.5 text-[15px] text-rc-muted leading-snug font-medium">
                  {plan.description}
                </p>
              </div>

              {/* CTA sits above the feature list, not below it: the decision
                  comes first and the justification second, so the button is
                  reachable without scrolling past ten bullets. */}
              <div className="mb-4">
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
                    className={`flex items-center justify-center w-full py-4 rounded-xl text-[14px] font-semibold transition-colors duration-200 cursor-pointer ${
                      activePlan === plan.id
                        ? 'bg-rc-bg text-rc-hint border border-rc-border cursor-default'
                        : plan.popular
                          ? 'bg-rc-red text-white shadow-lg shadow-rc-red/25 hover:bg-[var(--rc-red-hover)]'
                          : 'bg-rc-text text-white hover:bg-rc-red'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {activePlan === plan.id
                      ? t.pricing.currentPlan
                      : loadingPlan === plan.checkoutPlan
                        ? t.common.processing
                        : plan.cta}
                  </button>
                )}
                {plan.checkoutPlan && activePlan !== plan.id && (
                  <p className="mt-2 text-center text-[11px] text-rc-hint">
                    {t.pricing.safetyNote}
                  </p>
                )}
              </div>

              {plan.guarantee && (
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rc-red shrink-0" />
                  <span className="text-[12px] font-semibold text-rc-red leading-tight">
                    {plan.guarantee}
                  </span>
                </div>
              )}

              <div className="h-px w-full bg-gradient-to-r from-transparent via-rc-border to-transparent mb-3" />
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 group/item">
                    <div className={`mt-[3px] rounded-full p-0.5 shrink-0 transition-colors ${plan.popular ? 'bg-rc-red/10 text-rc-red' : 'bg-rc-border/50 text-rc-hint'}`}>
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span className="text-[14px] text-rc-muted leading-snug group-hover/item:text-rc-text transition-colors">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The refund line that sat here repeated the card's guarantee, was
            hardcoded in English so it never translated, and contradicted it on
            which month is refunded. The full terms live in the FAQ below. */}

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
