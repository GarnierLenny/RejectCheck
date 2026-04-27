"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { Navbar } from "../../../components/Navbar";
import { Heading, Caption, Text } from "../../../components/typography";
import { Button } from "../../../components/Button";
import { useAuth } from "../../../../context/auth";
import { useLanguage } from "../../../../context/language";
import { useMyBlocked } from "../../../../lib/queries";
import { useUnblock } from "../../../../lib/mutations";

function BlockedContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { localePath, t } = useLanguage();
  const query = useMyBlocked();
  const unblock = useUnblock();

  useEffect(() => {
    if (!loading && !user) router.replace(localePath("/login"));
  }, [loading, user, router, localePath]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">
          {t.common.loading}
        </span>
      </div>
    );
  }

  const entries = query.data?.pages.flatMap((p) => p.entries) ?? [];

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans">
      <Navbar />
      <div className="max-w-[700px] mx-auto px-5 md:px-[40px] py-12">
        <header className="mb-6 border-b border-rc-border pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Ban size={16} className="text-rc-red" />
            <Heading as="h1" size="lg">
              {t.block.pageTitle}
            </Heading>
          </div>
          <Caption as="p" className="block">
            {t.block.pageSubtitle}
          </Caption>
        </header>

        {query.isLoading ? (
          <Caption as="p" tone="subtle" className="block py-4 text-center">
            {t.common.loading}
          </Caption>
        ) : entries.length === 0 ? (
          <Caption as="p" tone="subtle" className="block py-8 text-center">
            {t.block.empty}
          </Caption>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const initials = (entry.displayName ?? entry.username)
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={entry.username}
                  className="flex items-center gap-3 px-3 py-3 bg-rc-surface border border-rc-border rounded-md"
                >
                  <Link
                    href={localePath(`/u/${entry.username}`)}
                    className="shrink-0 no-underline"
                  >
                    {entry.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.avatarUrl}
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
                    <Text weight="medium" className="block truncate">
                      {entry.displayName ?? `@${entry.username}`}
                    </Text>
                    <Caption as="p" className="font-mono text-[11px] truncate">
                      @{entry.username}
                    </Caption>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => unblock.mutate(entry.username)}
                    loading={unblock.isPending && unblock.variables === entry.username}
                  >
                    {t.block.unblockButton}
                  </Button>
                </div>
              );
            })}
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
        )}
      </div>
    </div>
  );
}

export default function BlockedPage() {
  return (
    <Suspense fallback={null}>
      <BlockedContent />
    </Suspense>
  );
}
