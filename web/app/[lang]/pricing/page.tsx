"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../../context/auth";
import { AuthNavLink } from "../../components/AuthNavLink";
import { useSubscription } from "../../../lib/queries";
import { useCreateCheckout } from "../../../lib/mutations";
import { useLanguage } from "../../../context/language";
import { Check, ShieldCheck, Zap, Star, Trophy, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t, localePath } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState<'shortlisted' | 'hired' | null>(null);

  const { data: subscription } = useSubscription();
  const createCheckout = useCreateCheckout();

  const activePlan = subscription?.status === 'active' ? subscription.plan : null;

  const plans = [
    {
      id: 'free' as const,
      name: t.pricing.plans.free.name,
      price: '0€',
      period: t.pricing.plans.free.period,
      description: t.pricing.plans.free.description,
      icon: <Zap className="w-5 h-5 text-rc-hint" />,
      features: t.pricing.plans.free.features as string[],
      cta: t.pricing.plans.free.cta,
      href: localePath('/analyze'),
      popular: false,
    },
    {
      id: 'shortlisted' as const,
      name: t.pricing.plans.shortlisted.name,
      price: '7.99€',
      period: t.pricing.plans.shortlisted.period,
      description: t.pricing.plans.shortlisted.description,
      icon: <Star className="w-5 h-5 text-rc-red" />,
      features: t.pricing.plans.shortlisted.features as string[],
      cta: t.pricing.plans.shortlisted.cta,
      href: null,
      popular: false,
    },
    {
      id: 'hired' as const,
      name: t.pricing.plans.hired.name,
      price: '14.99€',
      period: t.pricing.plans.hired.period,
      description: t.pricing.plans.hired.description,
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
      features: t.pricing.plans.hired.features as string[],
      cta: t.pricing.plans.hired.cta,
      href: null,
      popular: true,
      guarantee: t.pricing.plans.hired.guarantee,
    },
  ];

  useEffect(() => {
    if (searchParams.get("error") === "true") {
      toast.error("Payment cancelled. You can try again when you're ready.", { duration: 5000 });
    }
  }, [searchParams]);

  async function handlePaidPlan(plan: 'shortlisted' | 'hired') {
    if (!user) {
      router.push(localePath('/login?redirect=/pricing'));
      return;
    }

    if (activePlan === plan) return;

    setLoadingPlan(plan);
    try {
      const data = await createCheckout.mutateAsync({ plan, email: user.email });
      if (data.url) {
        window.location.href = data.url;
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

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-stretch">
          {plans.map((plan) => (
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
                  <p className="mt-3 text-sm text-rc-muted leading-relaxed font-medium">
                    {plan.description}
                  </p>
                </div>
              </div>

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

              {plan.guarantee && (
                <div className="mb-8 p-4 rounded-2xl bg-rc-red/5 border border-rc-red/10 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-rc-red shrink-0" />
                  <span className="text-[13px] font-bold text-rc-red leading-tight">
                    {plan.guarantee}
                  </span>
                </div>
              )}

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
                    onClick={() => handlePaidPlan(plan.id as 'shortlisted' | 'hired')}
                    disabled={loadingPlan !== null || activePlan === plan.id}
                    className={`relative overflow-hidden flex items-center justify-center w-full py-4 rounded-xl font-mono text-[11px] tracking-widest uppercase transition-all duration-300 group/btn font-bold cursor-pointer ${
                      activePlan === plan.id
                        ? 'bg-rc-bg text-rc-hint border border-rc-border cursor-default'
                        : plan.popular
                          ? 'bg-rc-red text-white shadow-lg shadow-rc-red/25 hover:shadow-rc-red/40 hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-rc-text text-white hover:bg-rc-red hover:shadow-lg active:scale-[0.98]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="relative z-10">
                      {activePlan === plan.id ? t.pricing.currentPlan : loadingPlan === plan.id ? t.common.processing : plan.cta}
                    </span>
                    {activePlan !== plan.id && (
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className="text-rc-hint text-sm font-mono tracking-widest uppercase">{t.pricing.footer.support}</p>
        </div>
      </div>

      <footer className="border-t border-rc-border bg-white/50 backdrop-blur-sm relative z-10">
        <div className="max-w-[1200px] mx-auto py-12 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Image src="/RejectCheck_500_bg_less.png" alt="Logo" width={32} height={32} />
            <div className="font-mono text-[12px] text-rc-hint">{t.pricing.footer.copyright}</div>
          </div>
          <div className="flex gap-8">
            <Link href={localePath("/privacy")} className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">{t.pricing.footer.privacy}</Link>
            <a href="#" className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">{t.pricing.footer.terms}</a>
            <a href="mailto:support@rejectcheck.com" className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">{t.pricing.footer.contact}</a>
          </div>
        </div>
      </footer>
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
