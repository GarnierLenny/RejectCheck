"use client";

import Link from "next/link";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { Heading, Caption } from "../../../components/typography";
import { Leaderboard } from "../../../components/Leaderboard";
import { useChallengeLeaderboard } from "../../../../lib/queries";
import { useAuth } from "../../../../context/auth";
import { useLanguage } from "../../../../context/language";
import type { LeaderboardScope } from "../../../../lib/queries";

type Props = {
  challengeId: number;
};

export function ChallengeLeaderboardCard({ challengeId }: Props) {
  const { user } = useAuth();
  const { localePath, t } = useLanguage();
  const [scope, setScope] = useState<LeaderboardScope>("global");
  const query = useChallengeLeaderboard(challengeId, scope, 10);

  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg p-5 mt-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-rc-amber" />
          <Heading as="h3">{t.leaderboard.todayTop}</Heading>
        </div>
        {user && (
          <ScopeToggle scope={scope} onChange={setScope} />
        )}
      </div>
      <Leaderboard entries={query.data ?? []} isLoading={query.isLoading} />
      <Link
        href={localePath("/leaderboard")}
        className="block mt-3 text-center font-mono text-[11px] text-rc-muted hover:text-rc-text no-underline"
      >
        {t.leaderboard.viewFull} →
      </Link>
    </div>
  );
}

export function ScopeToggle({
  scope,
  onChange,
}: {
  scope: LeaderboardScope;
  onChange: (s: LeaderboardScope) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 bg-rc-bg border border-rc-border rounded-md p-0.5">
      <button
        type="button"
        onClick={() => onChange("global")}
        className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider rounded transition-colors ${
          scope === "global"
            ? "bg-rc-surface text-rc-text"
            : "text-rc-muted hover:text-rc-text"
        }`}
      >
        {t.leaderboard.global}
      </button>
      <button
        type="button"
        onClick={() => onChange("following")}
        className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider rounded transition-colors ${
          scope === "following"
            ? "bg-rc-surface text-rc-text"
            : "text-rc-muted hover:text-rc-text"
        }`}
      >
        {t.leaderboard.following}
      </button>
    </div>
  );
}

/** Tiny wrapper over the imported Caption — used in the empty state guard. */
export function _PleaseTypeCheck() {
  return <Caption>shouldn&apos;t render</Caption>;
}
