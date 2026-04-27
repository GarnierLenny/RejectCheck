"use client";

import { use } from "react";
import { Navbar } from "../../../../components/Navbar";
import { FollowList } from "../../../../components/social/FollowList";
import { Heading } from "../../../../components/typography";
import { useLanguage } from "../../../../../context/language";
import { usePublicFollowing } from "../../../../../lib/queries";

export default function PublicFollowingPage({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { username } = use(params);
  const lower = username.toLowerCase();
  const { t } = useLanguage();
  const query = usePublicFollowing(lower);

  const title = t.publicProfilePage.lists.publicFollowing.replace(
    "{username}",
    lower,
  );

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans">
      <Navbar />
      <div className="max-w-[700px] mx-auto px-5 md:px-[40px] py-12">
        <header className="mb-6 border-b border-rc-border pb-4">
          <Heading as="h1" size="lg">
            {title}
          </Heading>
        </header>
        <FollowList query={query} />
      </div>
    </div>
  );
}
