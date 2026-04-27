import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PublicProfile, PublicActivityEntry } from "../../../../lib/queries";
import { Navbar } from "../../../components/Navbar";
import { PublicHeatmap } from "../../../components/PublicHeatmap";
import { PublicProfileHeader } from "../../../components/PublicProfileHeader";
import { PublicRecentChallenges } from "../../../components/PublicRecentChallenges";
import { BadgesPlaceholder } from "../../../components/BadgesPlaceholder";
import { getDictionary, hasLocale, type Locale } from "../../dictionaries";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

async function fetchProfile(username: string): Promise<PublicProfile | null> {
  const res = await fetch(
    `${API_BASE}/api/u/${encodeURIComponent(username)}`,
    { next: { revalidate: 60 } },
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

async function fetchActivity(
  username: string,
): Promise<PublicActivityEntry[]> {
  const res = await fetch(
    `${API_BASE}/api/u/${encodeURIComponent(username)}/activity`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return [];
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}): Promise<Metadata> {
  const { lang, username } = await params;
  const lower = username.toLowerCase();
  const profile = await fetchProfile(lower);
  if (!profile) {
    return { title: "Profile not found · RejectCheck" };
  }
  const name = profile.displayName ?? `@${profile.username}`;
  const title = `${name} · RejectCheck`;
  const description = profile.bio
    ? profile.bio
    : `${profile.challenges.total} challenges completed · ${profile.challenges.currentStreak}-day streak · best score ${profile.challenges.bestScore}`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/u/${profile.username}`,
    },
    openGraph: {
      title,
      description,
      url: `/${lang}/u/${profile.username}`,
      siteName: "RejectCheck",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { lang, username } = await params;
  const locale = (hasLocale(lang) ? lang : "en") as Locale;
  const dict = await getDictionary(locale);
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const lower = username.toLowerCase();
  const [profile, activity] = await Promise.all([
    fetchProfile(lower),
    fetchActivity(lower),
  ]);

  if (!profile) notFound();

  const badges = dict.publicProfilePage.badges;
  const badgeItems = [
    { label: badges.items.firstPerfect, desc: badges.items.firstPerfectDesc },
    { label: badges.items.streak7, desc: badges.items.streak7Desc },
    { label: badges.items.focusMaster, desc: badges.items.focusMasterDesc },
    { label: badges.items.polyglot, desc: badges.items.polyglotDesc },
  ];

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-5 md:px-[40px] py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="flex flex-col gap-4">
            <PublicProfileHeader profile={profile} />
          </div>
          <div className="flex flex-col gap-4">
            <PublicHeatmap
              activity={activity}
              title={dict.publicProfilePage.heatmap.title}
              lastYearLabel={dict.publicProfilePage.heatmap.lastYear}
            />
            <BadgesPlaceholder
              title={badges.title}
              comingSoonLabel={badges.comingSoon}
              items={badgeItems}
            />
            <PublicRecentChallenges
              challenges={profile.recentChallenges}
              title={dict.publicProfilePage.recent.title}
              emptyLabel={dict.publicProfilePage.recent.empty}
              dateLocale={dateLocale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
