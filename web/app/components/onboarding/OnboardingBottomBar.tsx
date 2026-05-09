"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
  onBack?: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  helper?: React.ReactNode;
  showBack?: boolean;
  primaryLoading?: boolean;
};

export function OnboardingBottomBar({
  onBack,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  helper,
  showBack,
  primaryLoading,
}: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 pt-7 px-5 md:px-8 pb-4 md:pb-5 flex justify-center pointer-events-none"
      style={{
        background:
          "linear-gradient(180deg, rgba(247,245,242,0) 0%, rgba(247,245,242,0.95) 35%, var(--rc-bg) 100%)",
      }}
    >
      <div className="w-full max-w-[1040px] flex items-center gap-3.5 pointer-events-auto">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-14 h-14 rounded-full border-[1.5px] border-rc-border bg-rc-surface text-rc-muted flex items-center justify-center hover:bg-rc-bg hover:text-rc-text hover:-translate-x-0.5 transition-all flex-shrink-0"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
          className="flex-1 h-14 px-7 rounded-full bg-rc-red text-white font-mono uppercase font-bold text-[12px] tracking-[0.18em] shadow-[0_8px_24px_rgba(201,58,57,0.3)] hover:bg-rc-red-hover hover:shadow-[0_12px_30px_rgba(201,58,57,0.38)] hover:-translate-y-px active:scale-[0.98] disabled:bg-rc-border disabled:text-rc-hint disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none transition-all inline-flex items-center justify-center gap-3.5"
        >
          <span>{primaryLabel}</span>
          {!primaryLoading && (
            <ArrowRight size={16} strokeWidth={2.5} />
          )}
        </button>
        {helper ? (
          <span className="ml-auto font-mono text-[10px] tracking-[0.16em] uppercase text-rc-hint hidden md:inline-flex items-center gap-2">
            {helper}
          </span>
        ) : null}
      </div>
    </div>
  );
}
