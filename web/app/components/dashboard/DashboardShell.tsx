"use client";

import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";

type DashboardTab = "home" | "analyses" | "applications";

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  totalAnalyses: number;
  totalApps: number;
  onBuyCredits: () => void;
  firstName?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  activeTab,
  onTabChange,
  totalAnalyses,
  totalApps,
  onBuyCredits,
  firstName,
  children,
}: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeNav = () => setMobileNavOpen(false);

  return (
    <div
      className="flex bg-rc-bg text-rc-text font-sans"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      <DashboardSidebar
        activeTab={activeTab}
        // Selecting a tab or buying credits also dismisses the mobile drawer.
        onTabChange={(tab) => {
          onTabChange(tab);
          closeNav();
        }}
        onBuyCredits={() => {
          onBuyCredits();
          closeNav();
        }}
        mobileOpen={mobileNavOpen}
        onClose={closeNav}
      />
      <main className="flex-1 min-w-0 overflow-auto flex flex-col px-5 py-6 md:px-8 md:py-7">
        <DashboardTopbar
          activeTab={activeTab}
          firstName={firstName}
          onBuyCredits={onBuyCredits}
          onOpenNav={() => setMobileNavOpen(true)}
        />
        {children}
      </main>
    </div>
  );
}
