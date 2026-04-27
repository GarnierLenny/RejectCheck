"use client";

import { useState } from "react";
import { Trophy, Calendar, Flame } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Heading, Caption } from "../../components/typography";
import { Leaderboard } from "../../components/Leaderboard";
import { ScopeToggle } from "../challenge/components/ChallengeLeaderboardCard";
import { useAuth } from "../../../context/auth";
import { useLanguage } from "../../../context/language";
import {
  useGlobalLeaderboard,
  useStreakLeaderboard,
  type LeaderboardScope,
} from "../../../lib/queries";

type Tab = "alltime" | "week" | "streaks";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("alltime");
  const [scope, setScope] = useState<LeaderboardScope>("global");

  const allTime = useGlobalLeaderboard(scope, "alltime", 100);
  const weekly = useGlobalLeaderboard(scope, "week", 100);
  const streaks = useStreakLeaderboard(scope, 100);

  const tabs: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: "alltime", label: t.leaderboard.tabs.alltime, icon: Trophy },
    { id: "week", label: t.leaderboard.tabs.week, icon: Calendar },
    { id: "streaks", label: t.leaderboard.tabs.streaks, icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans">
      <Navbar />
      <div className="max-w-[800px] mx-auto px-5 md:px-[40px] py-12">
        <header className="mb-6 border-b border-rc-border pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-rc-amber" />
            <Heading as="h1" size="lg">
              {t.leaderboard.title}
            </Heading>
          </div>
        </header>

        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <nav className="flex items-center gap-1 bg-rc-surface border border-rc-border rounded-md p-1">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider rounded transition-colors ${
                    active
                      ? "bg-rc-bg text-rc-text"
                      : "text-rc-muted hover:text-rc-text"
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </nav>
          {user && <ScopeToggle scope={scope} onChange={setScope} />}
        </div>

        <div className="bg-rc-surface border border-rc-border rounded-lg overflow-hidden">
          {tab === "alltime" && (
            <Leaderboard
              entries={allTime.data ?? []}
              isLoading={allTime.isLoading}
            />
          )}
          {tab === "week" && (
            <Leaderboard
              entries={weekly.data ?? []}
              isLoading={weekly.isLoading}
            />
          )}
          {tab === "streaks" && (
            <Leaderboard
              entries={streaks.data ?? []}
              isLoading={streaks.isLoading}
              scoreSuffix={t.leaderboard.dayShort}
            />
          )}
        </div>
      </div>
    </div>
  );
}
