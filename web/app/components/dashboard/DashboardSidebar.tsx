"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, FileSearch, Briefcase,
  FileText, Mic, User, Trophy, CreditCard, Settings,
} from "lucide-react";
import { useQuota, useUserXp, useSubscription, useProfile } from "../../../lib/queries";
import { useLanguage } from "../../../context/language";
import { LangSwitcher } from "../LangSwitcher";
import { AuthNavLink } from "../AuthNavLink";
import { COMMUNITY_FEATURES_ENABLED, RANK_REWARDS_ENABLED, APPLICATIONS_TAB_ENABLED, AI_INTERVIEW_ENABLED } from "../../../lib/features";

type DashboardTab = "home" | "analyses" | "applications";

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onBuyCredits: () => void;
  /** Mobile drawer state — ignored on md+ where the sidebar is always visible. */
  mobileOpen?: boolean;
  onClose?: () => void;
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1.5 font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint font-bold">
        {label}
      </p>
      <div className="flex flex-col gap-px">{children}</div>
    </div>
  );
}

function TabItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full text-left py-2 px-3 rounded-lg transition-colors text-[13px] ${
        active
          ? "bg-rc-red/[0.06] font-semibold text-rc-red"
          : "text-rc-hint hover:bg-rc-surface-raised hover:text-rc-text font-medium"
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
      {label}
    </button>
  );
}

function LinkItem({
  label,
  icon: Icon,
  href,
  badge,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-rc-hint font-medium no-underline hover:bg-rc-surface-raised hover:text-rc-text transition-colors"
    >
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-75" />
      <span className="flex-1">{label}</span>
      {badge && <span className="font-mono text-[10px] text-rc-hint">{badge}</span>}
    </Link>
  );
}

export function DashboardSidebar({ activeTab, onTabChange, onBuyCredits, mobileOpen = false, onClose }: Props) {
  const { data: quota } = useQuota();
  const { data: xp } = useUserXp();
  const { data: sub } = useSubscription();
  const { data: profile } = useProfile();
  const { t, localePath } = useLanguage();
  const s = t.dashboardShell;

  const monthlyRemaining = quota ? quota.monthlyCap - quota.monthlyUsed : null;
  const perm = quota?.creditsBalance ?? 0;
  const progressPct = quota
    ? Math.max(0, Math.min(100, ((quota.monthlyCap - quota.monthlyUsed) / quota.monthlyCap) * 100))
    : 0;
  const isLow = monthlyRemaining !== null && monthlyRemaining < 100;

  const _now = new Date();
  const _nextMonth = new Date(Date.UTC(_now.getUTCFullYear(), _now.getUTCMonth() + 1, 1));
  const resetDays = Math.ceil((_nextMonth.getTime() - _now.getTime()) / 86400000);

  return (
    <>
      {/* Backdrop — mobile drawer only */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`flex flex-col flex-shrink-0 h-full bg-rc-bg fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 230, borderRight: "1px solid var(--rc-border)" }}
      >
      {/* Logo → landing */}
      <Link
        href={localePath("/")}
        className="flex items-center gap-2.5 px-4 no-underline hover:opacity-80 transition-opacity"
        style={{ paddingTop: 16, paddingBottom: 12, borderBottom: "1px solid var(--rc-border)" }}
      >
        <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={28} height={28} className="flex-shrink-0" />
        <span className="font-sans text-[15px] font-semibold leading-none text-rc-text" style={{ letterSpacing: -0.2 }}>
          Reject<span className="font-serif text-rc-red" style={{ fontWeight: 700 }}>Check</span>
        </span>
      </Link>

      {/* Nav */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-2 py-4">
        <NavSection label={s.navDashboard}>
          <TabItem label={s.overview}   icon={LayoutDashboard} active={activeTab === "home"}         onClick={() => onTabChange("home")} />
          <TabItem label={s.analyses}   icon={FileSearch}      active={activeTab === "analyses"}     onClick={() => onTabChange("analyses")} />
          {APPLICATIONS_TAB_ENABLED && <TabItem label={s.applications} icon={Briefcase} active={activeTab === "applications"} onClick={() => onTabChange("applications")} />}
        </NavSection>

        <NavSection label={s.navTools}>
          <LinkItem label={s.analyzeCv}     icon={FileText} href={localePath("/analyze")} />
          {AI_INTERVIEW_ENABLED && <LinkItem label={s.mockInterview} icon={Mic} href={`${localePath("/analyze")}?tab=interview`} />}
        </NavSection>

        <NavSection label={s.navAccount}>
          {COMMUNITY_FEATURES_ENABLED && profile?.username && (
            <LinkItem label={s.profile}       icon={User}       href={localePath(`/u/${profile.username}`)} />
          )}
          {RANK_REWARDS_ENABLED && (
            <LinkItem label={s.rankRewards} icon={Trophy}     href={localePath("/dashboard")} badge={xp ? `Lvl ${xp.level}` : undefined} />
          )}
          <LinkItem label={s.planBilling} icon={CreditCard} href={localePath("/settings")} />
          <LinkItem label={s.settings}    icon={Settings}   href={localePath("/settings")} />
        </NavSection>

        {/* Credits */}
        {quota && (
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-3">
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint font-bold">{s.credits}</span>
              <span className={`font-mono text-[9px] tracking-[0.1em] font-bold ${isLow ? "text-rc-red" : "text-rc-green"}`}>
                {`${s.reset} ${resetDays}${s.dayShort}`}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className={`font-black text-[22px] leading-none ${isLow ? "text-rc-red" : "text-rc-text"}`}>
                {monthlyRemaining}
              </span>
              <span className="font-mono text-[12px] text-rc-hint">/ {quota.monthlyCap}</span>
              {perm > 0 && (
                <span className="font-mono text-[9px] text-rc-hint ml-auto">+{perm} {s.perm}</span>
              )}
            </div>

            <div className="mt-2 h-1.5 bg-rc-surface-hero rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: isLow ? "var(--rc-red)" : "var(--rc-green)" }}
              />
            </div>

            <button
              onClick={onBuyCredits}
              className={`mt-2.5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase hover:opacity-70 transition-opacity ${isLow ? "text-rc-red" : "text-rc-hint"}`}
            >
              {isLow ? s.buyCreditsArrow : s.buyMoreArrow}
            </button>
          </div>
        )}
      </div>

      {/* User strip */}
      <div
        className="flex items-center justify-between px-3 py-3"
        style={{ borderTop: "1px solid var(--rc-border)" }}
      >
        <LangSwitcher />
        <AuthNavLink />
      </div>
      </aside>
    </>
  );
}
