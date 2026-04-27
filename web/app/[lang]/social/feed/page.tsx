"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { Navbar } from "../../../components/Navbar";
import { ActivityFeed } from "../../../components/social/ActivityFeed";
import { Heading, Caption } from "../../../components/typography";
import { useAuth } from "../../../../context/auth";
import { useLanguage } from "../../../../context/language";
import { useMyFeed } from "../../../../lib/queries";

function FeedContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { localePath, locale, t } = useLanguage();
  const query = useMyFeed();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";

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
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-rc-red" />
            <Heading as="h1" size="lg">
              {t.social.feed.title}
            </Heading>
          </div>
          <Caption as="p" className="block">
            {t.social.feed.subtitle}
          </Caption>
        </header>
        <ActivityFeed query={query} dateLocale={dateLocale} />
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedContent />
    </Suspense>
  );
}
