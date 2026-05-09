"use client";

import { Check, type LucideIcon } from "lucide-react";

export function OptionCard({
  icon: Icon,
  label,
  meta,
  selected,
  compact,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  meta: string;
  selected: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const iconBox = compact ? "w-11 h-11" : "w-[52px] h-[52px]";
  const iconSize = compact ? 18 : 22;
  const labelSize = compact ? "text-[17px]" : "text-[19px]";
  const metaSize = compact ? "text-[13px]" : "text-[14px]";
  const padding = compact ? "px-4 py-4" : "px-4 py-4";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex items-center gap-4 ${padding} border-[1.5px] rounded-2xl text-left transition-all duration-150 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:scale-[0.985] ${
        selected
          ? "border-rc-red bg-rc-surface shadow-[0_8px_28px_rgba(201,58,57,0.12),0_0_0_4px_rgba(201,58,57,0.06)]"
          : "border-rc-border bg-rc-surface hover:border-rc-red/55 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(201,58,57,0.06)]"
      }`}
    >
      <span
        className={`${iconBox} flex items-center justify-center rounded-xl border flex-shrink-0 transition-all ${
          selected
            ? "bg-rc-red border-rc-red text-white"
            : "bg-rc-bg border-rc-border text-rc-muted"
        }`}
      >
        <Icon size={iconSize} strokeWidth={1.6} />
      </span>
      <span className="flex-1 flex flex-col gap-1 min-w-0">
        <span
          className={`${labelSize} font-semibold text-rc-text tracking-[-0.01em] leading-[1.2]`}
        >
          {label}
        </span>
        <span
          className={`${metaSize} ${selected ? "text-rc-muted" : "text-rc-hint"} leading-[1.4]`}
        >
          {meta}
        </span>
      </span>
      <span
        className={`w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          selected
            ? "border-rc-red bg-rc-red scale-105"
            : "border-rc-border scale-100"
        }`}
      >
        <Check
          size={14}
          strokeWidth={3}
          className={`text-white transition-all duration-200 ${
            selected ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        />
      </span>
    </button>
  );
}
