"use client";

import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { AnalysisResult } from "../types";
import { useLanguage } from "../../../context/language";

type Props = {
  // Kept for call-site compatibility; the free tier renders a lock and never
  // reads the project, on purpose: even the name + "why" is enough to
  // reconstruct the whole project with an LLM, so nothing leaks here.
  project?: AnalysisResult["project_recommendation"];
};

export function ProjectTab(_props: Props) {
  const { localePath } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-xl border border-rc-border bg-rc-surface">
      {/* Blurred decoy so the lock reads as "there is real content here". */}
      <div aria-hidden className="absolute inset-0 blur-[6px] opacity-40 pointer-events-none select-none p-8">
        <div className="h-5 w-1/2 bg-rc-border/70 rounded mb-4" />
        <div className="h-3 w-full bg-rc-border/50 rounded mb-2" />
        <div className="h-3 w-11/12 bg-rc-border/50 rounded mb-2" />
        <div className="h-3 w-4/5 bg-rc-border/50 rounded mb-6" />
        <div className="flex gap-2 mb-6">
          {[60, 80, 50, 70, 64].map((w, i) => (
            <div key={i} style={{ width: w }} className="h-6 bg-rc-border/50 rounded" />
          ))}
        </div>
        <div className="h-28 w-full bg-rc-border/40 rounded" />
      </div>

      <div className="relative flex flex-col items-center text-center px-6 py-16">
        <div className="w-12 h-12 rounded-full bg-rc-red/10 border border-rc-red/20 flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-rc-red" />
        </div>
        <h3 className="font-sans font-bold text-[20px] tracking-tight text-rc-text mb-2">
          Your bridge project is locked
        </h3>
        <p className="text-[15px] text-rc-muted leading-relaxed max-w-[440px] mb-6">
          Unlock a personalized project built to close your exact gaps: the full spec, an architecture diagram, the tech stack, a detailed phase-by-phase roadmap, and a ready-to-code starter repo.
        </p>
        <Link
          href={localePath("/pricing")}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-rc-red text-white font-mono text-[11px] font-bold uppercase tracking-[0.14em] no-underline rounded-md hover:bg-[var(--rc-red-hover)] transition-colors"
        >
          Unlock my project <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
