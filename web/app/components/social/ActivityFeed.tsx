"use client";

import Link from "next/link";
import { Caption, Text } from "../typography";
import { Button } from "../Button";
import { useLanguage } from "../../../context/language";
import type { Feed, FeedEntry } from "../../../lib/queries";

type InfiniteState = {
  data?: { pages: Feed[] };
  isLoading: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
};

type Props = {
  query: InfiniteState;
  dateLocale?: string;
};

const DIFFICULTY_TONE: Record<string, string> = {
  easy: "text-rc-green border-rc-green/30 bg-rc-green/5",
  medium: "text-rc-amber border-rc-amber/30 bg-rc-amber/5",
  hard: "text-rc-red border-rc-red/30 bg-rc-red/5",
};

function scoreClass(score: number): string {
  if (score >= 90) return "text-rc-red";
  if (score >= 70) return "text-rc-amber";
  return "text-rc-muted";
}

function formatRelative(iso: string, locale = "en-GB"): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return locale.startsWith("fr") ? "à l'instant" : "just now";
  if (diffMin < 60) return locale.startsWith("fr") ? `il y a ${diffMin} min` : `${diffMin} min ago`;
  if (diffHr < 24) return locale.startsWith("fr") ? `il y a ${diffHr} h` : `${diffHr}h ago`;
  if (diffDay < 7) return locale.startsWith("fr") ? `il y a ${diffDay} j` : `${diffDay}d ago`;
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

function FeedRow({ entry, dateLocale }: { entry: FeedEntry; dateLocale: string }) {
  const { localePath, t } = useLanguage();
  const initials = (entry.user.displayName ?? entry.user.username)
    .slice(0, 2)
    .toUpperCase();

  const completedTemplate =
    t.social.feed.completedTemplate
      .replace("{user}", entry.user.displayName ?? `@${entry.user.username}`)
      .replace("{challenge}", entry.challenge.title);

  return (
    <div className="flex items-start gap-3 px-3 py-3 bg-rc-surface border border-rc-border rounded-md">
      <Link
        href={localePath(`/u/${entry.user.username}`)}
        className="shrink-0 no-underline"
      >
        {entry.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.user.avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-rc-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center text-[12px] font-semibold text-rc-muted">
            {initials}
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <Text className="text-[13px] truncate">
            <Link
              href={localePath(`/u/${entry.user.username}`)}
              className="font-medium text-rc-text no-underline hover:underline"
            >
              {entry.user.displayName ?? `@${entry.user.username}`}
            </Link>
            <span className="text-rc-muted">
              {" "}{t.social.feed.completedVerb}{" "}
            </span>
            <span className="font-medium text-rc-text">{entry.challenge.title}</span>
          </Text>
          <Caption className="font-mono text-[10px] shrink-0">
            {formatRelative(entry.completedAt, dateLocale)}
          </Caption>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              DIFFICULTY_TONE[entry.challenge.difficulty] ?? DIFFICULTY_TONE.medium
            }`}
          >
            {entry.challenge.difficulty}
          </span>
          <Caption className="font-mono text-[10px] truncate">
            {entry.challenge.focusTag} · {entry.challenge.language}
          </Caption>
          <span
            className={`ml-auto font-mono text-[14px] font-semibold tabular-nums ${scoreClass(entry.score)}`}
          >
            {entry.score}
          </span>
        </div>
      </div>
    </div>
  );
  void completedTemplate; // template kept for future i18n compositions; verb-based render is current
}

export function ActivityFeed({ query, dateLocale = "en-GB" }: Props) {
  const { t, localePath } = useLanguage();
  const entries: FeedEntry[] = query.data?.pages.flatMap((p) => p.entries) ?? [];

  if (query.isLoading) {
    return (
      <Caption as="p" tone="subtle" className="block py-4 text-center">
        {t.common.loading}
      </Caption>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-3">
        <Caption as="p" tone="subtle" className="block">
          {t.social.feed.empty}
        </Caption>
        <Link
          href={localePath("/leaderboard")}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-rc-red hover:underline no-underline"
        >
          {t.social.feed.discoverCta} →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <FeedRow key={entry.id} entry={entry} dateLocale={dateLocale} />
      ))}
      {query.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => query.fetchNextPage()}
            loading={query.isFetchingNextPage}
          >
            {t.publicProfilePage.lists.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
