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
  children: React.ReactNode;
}

export function DashboardShell({
  activeTab,
  onTabChange,
  totalAnalyses,
  totalApps,
  onBuyCredits,
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
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardTopbar
          activeTab={activeTab}
          totalAnalyses={totalAnalyses}
          totalApps={totalApps}
        />
        <main className="flex-1 overflow-auto" style={{ padding: "20px 28px 24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
