"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useLanguage } from "../../context/language";

/**
 * Sticky bottom nudge shown to anonymous users on a result screen — captures
 * the signup at the aha-moment (the audit's #1 leak: anonymous users see all
 * the value then leave without an account). Dismissible for the session.
 */
export function ResultSignupNudge() {
  const { t, localePath } = useLanguage();
  const n = t.resultNudge;
  const reduce = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <motion.div
      initial={reduce ? false : { y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1], delay: 0.35 }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
    >
      <div className="pointer-events-auto relative mx-auto flex max-w-[720px] flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-rc-border bg-rc-surface px-5 py-4 pr-10 shadow-[0_18px_50px_rgba(201,58,57,0.16)]">
        {/* thin red accent on the left edge */}
        <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-rc-red" aria-hidden />

        <Sparkles className="hidden h-4 w-4 flex-none text-rc-red sm:block" aria-hidden />

        <div className="min-w-[180px] flex-1">
          <div className="mb-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-rc-red">{n.eyebrow}</div>
          <div className="text-[14.5px] font-semibold leading-snug text-rc-text">{n.title}</div>
          <div className="mt-1 font-mono text-[10.5px] tracking-wide text-rc-hint">{n.benefits}</div>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <Link
            href={localePath("/login")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rc-red px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white no-underline transition-colors hover:bg-[var(--rc-red-hover)] active:scale-[0.98]"
          >
            {n.cta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={localePath("/login")}
            className="text-center font-mono text-[10px] text-rc-hint no-underline transition-colors hover:text-rc-text"
          >
            {n.login}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={n.dismiss}
          className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-md text-rc-hint transition-colors hover:bg-rc-bg hover:text-rc-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
