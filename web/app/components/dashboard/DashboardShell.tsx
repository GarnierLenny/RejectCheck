"use client";

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
  return (
    <div
      className="flex bg-rc-bg text-rc-text font-sans"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onBuyCredits={onBuyCredits}
      />
      <main className="flex-1 min-w-0 overflow-auto flex flex-col" style={{ padding: "28px 32px" }}>
        <DashboardTopbar
          activeTab={activeTab}
          firstName={firstName}
          onBuyCredits={onBuyCredits}
        />
        {children}
      </main>
    </div>
  );
}
