"use client";

import Link from "next/link";
import { useLanguage } from "../../../context/language";

type DashboardTab = "home" | "analyses" | "applications";

interface Props {
  activeTab: DashboardTab;
  firstName?: string;
  onBuyCredits: () => void;
}

export function DashboardTopbar({ activeTab, firstName, onBuyCredits }: Props) {
  const { localePath } = useLanguage();

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const eyebrow =
    activeTab === "home" ? dateLabel :
    activeTab === "analyses" ? "Analysis history" :
    "Pipeline";

  const headingPrefix =
    activeTab === "home" ? `${greeting}, ` :
    "Your ";

  const headingItalic =
    activeTab === "home" ? `${firstName || "there"}.` :
    activeTab === "analyses" ? "analyses." :
    "applications.";

  return (
    <div className="flex items-end justify-between mb-7 shrink-0">
      <div>
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase text-rc-hint">
          <span className="w-1.5 h-1.5 rounded-full bg-rc-red animate-pulse shrink-0" />
          {eyebrow}
        </p>
        <h1
          className="font-sans font-semibold leading-none mt-3 text-rc-text"
          style={{ fontSize: "clamp(26px, 3vw, 38px)", letterSpacing: -0.5 }}
        >
          {headingPrefix}
          <span className="font-serif italic text-rc-red" style={{ fontWeight: 400 }}>
            {headingItalic}
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onBuyCredits}
          className="px-3.5 py-1.5 rounded-lg border border-rc-border bg-white font-mono text-[10px] tracking-widest uppercase text-rc-hint hover:border-rc-red/30 hover:text-rc-text transition-all"
        >
          Buy credits
        </button>
        <Link
          href={localePath("/analyze")}
          className="px-4 py-2 rounded-lg bg-rc-red text-white font-mono text-[10px] font-bold tracking-widest uppercase no-underline hover:opacity-90 transition-opacity"
        >
          + New analysis
        </Link>
      </div>
    </div>
  );
}
