"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useLanguage } from "../../../context/language";

type DashboardTab = "home" | "analyses" | "applications";

interface Props {
  activeTab: DashboardTab;
  firstName?: string;
  onBuyCredits: () => void;
  /** Opens the mobile nav drawer (rendered only below md). */
  onOpenNav?: () => void;
}

export function DashboardTopbar({ activeTab, firstName, onBuyCredits, onOpenNav }: Props) {
  const { t, locale, localePath } = useLanguage();
  const s = t.dashboardShell;

  const now = new Date();
  const dateLabel = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  const hour = now.getHours();
  const greeting = hour < 12 ? s.goodMorning : hour < 18 ? s.goodAfternoon : s.goodEvening;

  const eyebrow =
    activeTab === "home" ? dateLabel :
    activeTab === "analyses" ? s.analysisHistory :
    s.pipeline;

  const headingPrefix =
    activeTab === "home" ? `${greeting}, ` :
    s.yourPrefix;

  const headingItalic =
    activeTab === "home" ? (firstName ? `${firstName}.` : s.there) :
    activeTab === "analyses" ? s.yourAnalyses :
    s.yourApplications;

  return (
    <div className="flex items-end justify-between mb-7 shrink-0 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {onOpenNav && (
          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Open menu"
            className="md:hidden flex items-center justify-center p-2 -ml-2 shrink-0 text-rc-text"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase text-rc-hint">
            <span className="w-1.5 h-1.5 rounded-full bg-rc-red animate-pulse shrink-0" />
            {eyebrow}
          </p>
          <h1
            className="font-sans font-semibold leading-none mt-3 text-rc-text truncate"
            style={{ fontSize: "clamp(26px, 3vw, 38px)", letterSpacing: -0.5 }}
          >
            {headingPrefix}
            <span className="font-serif text-rc-red" style={{ fontWeight: 700 }}>
              {headingItalic}
            </span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onBuyCredits}
          className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:border-rc-red/30 hover:text-rc-text transition-all"
        >
          {s.buyCredits}
        </button>
        <Link
          href={localePath("/analyze")}
          className="px-4 py-2 rounded-lg bg-rc-red text-white font-mono text-[10px] font-bold tracking-widest uppercase no-underline hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {s.newAnalysis}
        </Link>
      </div>
    </div>
  );
}
