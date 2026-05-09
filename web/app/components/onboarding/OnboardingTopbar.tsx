"use client";

import Image from "next/image";

export function OnboardingTopbar({
  stepLabel,
  skipLabel,
  onSkip,
  skipDisabled,
  fillPercent,
}: {
  stepLabel: string;
  skipLabel: string;
  onSkip: () => void;
  skipDisabled?: boolean;
  fillPercent: number;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-rc-bg/[0.92] backdrop-blur-md border-b-[0.5px] border-rc-border">
      <div className="max-w-[1100px] mx-auto px-5 md:px-8 pt-3.5 md:pt-4 pb-2.5 md:pb-3 flex items-center gap-4">
        <Image
          src="/RejectCheck_500_bg_less.png"
          alt="RejectCheck"
          width={22}
          height={22}
          priority
        />
        <span className="sr-only" aria-live="polite">
          {stepLabel}
        </span>
        <button
          type="button"
          onClick={onSkip}
          disabled={skipDisabled}
          className="ml-auto font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint hover:text-rc-text transition-colors disabled:opacity-50 hidden sm:inline"
        >
          {skipLabel}
        </button>
      </div>
      <div className="h-[3px] bg-rc-border relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-rc-red transition-[width] duration-[550ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={{ width: `${Math.max(0, Math.min(100, fillPercent))}%` }}
        >
          <span className="absolute right-0 top-[-2px] bottom-[-2px] w-2 bg-rc-red rounded-full shadow-[0_0_16px_rgba(201,58,57,0.6)]" />
        </div>
      </div>
    </div>
  );
}
