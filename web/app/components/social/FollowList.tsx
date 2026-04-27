"use client";

import Link from "next/link";
import { Caption, Text } from "../typography";
import { Button } from "../Button";
import { FollowButton } from "../FollowButton";
import { useAuth } from "../../../context/auth";
import { useProfile } from "../../../lib/queries";
import { useLanguage } from "../../../context/language";
import type { FollowList as FollowListData, FollowSummary } from "../../../lib/queries";

type InfiniteState = {
  data?: { pages: FollowListData[] };
  isLoading: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
};

type Props = {
  query: InfiniteState;
  showFollowButton?: boolean;
};

function PeerRow({
  peer,
  showFollowButton,
}: {
  peer: FollowSummary;
  showFollowButton: boolean;
}) {
  const { localePath } = useLanguage();
  const { user } = useAuth();
  const { data: viewerProfile } = useProfile();
  const initials = (peer.displayName ?? peer.username).slice(0, 2).toUpperCase();
  const isMe = !!user && viewerProfile?.username === peer.username;

  return (
    <div className="flex items-center gap-3 px-3 py-3 bg-rc-surface border border-rc-border rounded-md">
      <Link
        href={localePath(`/u/${peer.username}`)}
        className="shrink-0 no-underline"
      >
        {peer.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={peer.avatarUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover border border-rc-border"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center text-[14px] font-semibold text-rc-muted">
            {initials}
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={localePath(`/u/${peer.username}`)}
          className="block no-underline"
        >
          <Text weight="medium" className="block truncate">
            {peer.displayName ?? `@${peer.username}`}
          </Text>
          <Caption as="p" className="font-mono text-[11px] truncate">
            @{peer.username}
          </Caption>
        </Link>
        {peer.bio && (
          <Caption as="p" className="block mt-1 text-[12px] line-clamp-2">
            {peer.bio}
          </Caption>
        )}
      </div>
      {showFollowButton && !isMe && (
        <FollowButton
          username={peer.username}
          isFollowing={peer.isFollowing ?? false}
          size="sm"
        />
      )}
    </div>
  );
}

export function FollowList({ query, showFollowButton = true }: Props) {
  const { t } = useLanguage();
  const entries: FollowSummary[] =
    query.data?.pages.flatMap((p) => p.entries) ?? [];

  if (query.isLoading) {
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
    <div className="flex flex-col gap-2">
      {entries.map((peer) => (
        <PeerRow
          key={`${peer.username}-${peer.followedAt}`}
          peer={peer}
          showFollowButton={showFollowButton}
        />
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
