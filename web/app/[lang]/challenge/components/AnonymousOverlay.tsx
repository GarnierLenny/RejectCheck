"use client";

import Link from "next/link";
import { useLanguage } from "../../../../context/language";

export function AnonymousOverlay() {
  const { t, localePath } = useLanguage();
  return (
    <div className="border border-rc-border rounded-2xl p-6 bg-white/80 backdrop-blur-sm text-center space-y-4">
      <h3 className="text-[20px] font-bold text-rc-text">
        {t.challenge.anonymous.heading}
      </h3>
      <p className="text-[15px] text-rc-muted leading-relaxed max-w-[460px] mx-auto">
        {t.challenge.anonymous.body}
      </p>
      <Link
        href={localePath("/login")}
        className="inline-flex items-center justify-center px-6 py-3 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rc-red/25 no-underline font-bold transition-transform"
      >
        {t.challenge.anonymous.cta}
      </Link>
    </div>
  );
}
