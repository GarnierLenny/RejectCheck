"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

type Props = {
  aggregateText: string;
  ctaText?: string;
  children: React.ReactNode;
};

export function BlurredSection({ aggregateText, ctaText = "Unlock full analysis →", children }: Props) {
  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="select-none pointer-events-none" style={{ filter: "blur(6px)", opacity: 0.5 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-rc-bg/60 backdrop-blur-[2px]">
        <div className="flex items-center gap-2 px-4 py-2 bg-rc-surface border border-rc-border">
          <Lock className="w-3.5 h-3.5 text-rc-red shrink-0" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-rc-red font-bold">
            Premium
          </span>
        </div>
        <p className="font-mono text-[13px] text-rc-text text-center max-w-[280px] leading-relaxed">
          {aggregateText}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center px-6 py-3 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase transition-colors hover:bg-rc-red/90 active:scale-95 no-underline"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );
}
