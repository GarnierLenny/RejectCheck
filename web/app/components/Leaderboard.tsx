"use client";

import Link from "next/link";
import { Caption, Text } from "./typography";
import { useLanguage } from "../../context/language";
import type { LeaderboardEntry } from "../../lib/queries";

type Props = {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  scoreSuffix?: string;
};

const RANK_COLOR: Record<number, string> = {
  1: "text-rc-amber",
  2: "text-rc-muted",
  3: "text-[#cd7f32]",
};

export function Leaderboard({ entries, isLoading, scoreSuffix }: Props) {
  const { localePath, t } = useLanguage();

  if (isLoading) {
    return (
      <Caption as="p" tone="subtle" className="block py-4 text-center">
        {t.common.loading}
      </Caption>
    );
  }

  if (entries.length === 0) {
    return (
      <Caption as="p" tone="subtle" className="block py-4 text-center">
        {t.publicProfilePage.lists.empty}
      </Caption>
    );
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry) => {
        const initials = (entry.displayName ?? entry.username)
          .slice(0, 2)
          .toUpperCase();
        return (
          <Link
            key={entry.username}
            href={localePath(`/u/${entry.username}`)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-rc-bg/50 transition-colors no-underline border-b border-rc-border last:border-b-0"
          >
            <span
              className={`font-mono text-[12px] font-semibold w-7 text-right tabular-nums ${
                RANK_COLOR[entry.rank] ?? "text-rc-hint"
              }`}
            >
              {entry.rank}
            </span>
            {entry.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-rc-border shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center text-[10px] font-semibold text-rc-muted shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Text className="block truncate" weight="medium">
                {entry.displayName ?? `@${entry.username}`}
              </Text>
              <Caption as="p" className="font-mono text-[10px] truncate">
                @{entry.username}
              </Caption>
            </div>
            <span className="font-mono text-[14px] font-semibold tabular-nums text-rc-text shrink-0">
              {entry.score}
              {scoreSuffix && (
                <span className="text-rc-hint text-[10px] ml-0.5">
                  {scoreSuffix}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
