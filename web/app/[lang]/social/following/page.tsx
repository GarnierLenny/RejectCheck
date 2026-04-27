"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { FollowList } from "../../../components/social/FollowList";
import { Heading, Caption } from "../../../components/typography";
import { useAuth } from "../../../../context/auth";
import { useLanguage } from "../../../../context/language";
import { useMyFollowing } from "../../../../lib/queries";

function MyFollowingContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { localePath, t } = useLanguage();
  const query = useMyFollowing();

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

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans">
      <Navbar />
      <div className="max-w-[700px] mx-auto px-5 md:px-[40px] py-12">
        <header className="mb-6 border-b border-rc-border pb-4">
          <Heading as="h1" size="lg">
            {t.publicProfilePage.lists.myFollowing}
          </Heading>
          <Caption as="p" className="block mt-1">
            {t.publicProfilePage.header.followingCount}
          </Caption>
        </header>
        <FollowList query={query} />
      </div>
    </div>
  );
}

export default function MyFollowingPage() {
  return (
    <Suspense fallback={null}>
      <MyFollowingContent />
    </Suspense>
  );
}
