"use client";

import Link from "next/link";
import { AuthNavLink } from "../AuthNavLink";
import { useLanguage } from "../../../context/language";

type DashboardTab = "home" | "analyses" | "applications";

interface Props {
  activeTab: DashboardTab;
  totalAnalyses: number;
  totalApps: number;
}

const TAB_META: Record<DashboardTab, { title: string; sub: (n: number) => string }> = {
  home:         { title: "Overview",     sub: () => "" },
  analyses:     { title: "Analyses",     sub: (n) => `${n} total` },
  applications: { title: "Applications", sub: (n) => `${n} active` },
};

export function DashboardTopbar({ activeTab, totalAnalyses, totalApps }: Props) {
  const { localePath } = useLanguage();
  const meta = TAB_META[activeTab];
  const subText = meta.sub(activeTab === "analyses" ? totalAnalyses : totalApps);

  return (
    <div
      className="flex items-center justify-between flex-shrink-0 bg-rc-bg px-7"
      style={{ paddingTop: 14, paddingBottom: 14, borderBottom: "1px solid var(--rc-border)" }}
    >
      {/* Left: page title */}
      <div className="flex items-baseline gap-2">
        <h1 className="font-sans font-semibold text-rc-text" style={{ fontSize: 18, letterSpacing: -0.3 }}>
          {meta.title}
        </h1>
        {subText && (
          <span className="font-mono text-[11px] text-rc-hint tracking-[0.08em]">{subText}</span>
        )}
      </div>

      {/* Right: profile avatar */}
      <AuthNavLink />
    </div>
  );
}
