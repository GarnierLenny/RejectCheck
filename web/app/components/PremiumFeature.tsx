"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "../../context/language";

type PremiumPaywallProps = {
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
};

export function PremiumPaywall({
  badge,
  title,
  description,
  ctaLabel,
}: PremiumPaywallProps) {
  const { localePath } = useLanguage();

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="bg-rc-surface border border-rc-border rounded-[24px] p-8 md:p-12 w-full max-w-[520px] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rc-red/40 to-transparent" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-red/5 border border-rc-red/10 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-rc-red" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">
            {badge}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-rc-text mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-[15px] text-rc-muted mb-8 leading-relaxed">
          {description}
        </p>
        <Link
          href={localePath("/pricing")}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/20 no-underline font-bold"
        >
          {ctaLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

type PremiumFeatureProps = PremiumPaywallProps & {
  isPremium: boolean;
  children: ReactNode;
};

export function PremiumFeature({
  isPremium,
  children,
  ...paywall
}: PremiumFeatureProps) {
  if (isPremium) return <>{children}</>;
  return <PremiumPaywall {...paywall} />;
}
