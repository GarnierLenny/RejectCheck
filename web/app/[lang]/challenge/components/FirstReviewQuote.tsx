"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../../../../context/language";

type Props = {
  text: string;
};

export function FirstReviewQuote({ text }: Props) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left bg-rc-surface-raised border-l-2 border-rc-border rounded-r-lg pl-3 pr-3 py-2.5 hover:bg-black/[0.03] transition-colors group"
      aria-expanded={expanded}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-rc-hint font-semibold">
          {t.challenge.yourReviewLabel}
        </p>
        <ChevronDown
          className={`w-3 h-3 text-rc-hint transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </div>
      <div className={`relative ${expanded ? "" : "max-h-[70px] overflow-hidden"}`}>
        <p className="text-[12px] font-mono text-rc-muted leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
        {!expanded && (
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-rc-surface-raised to-transparent pointer-events-none" />
        )}
      </div>
    </button>
  );
}
