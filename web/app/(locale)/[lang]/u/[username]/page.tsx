import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PublicProfile, PublicActivityEntry } from "../../../../../lib/queries";
import { COMMUNITY_FEATURES_ENABLED } from "../../../../../lib/features";
import { Navbar } from "../../../../components/Navbar";
import { PublicHeatmap } from "../../../../components/PublicHeatmap";
import { PublicProfileHeader } from "../../../../components/PublicProfileHeader";
import { AchievementsList } from "../../../../components/AchievementsList";
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
  if (!COMMUNITY_FEATURES_ENABLED) return { title: "Not Found" };
  const { lang, username } = await params;
  const lower = username.toLowerCase();
  const profile = await fetchProfile(lower);
  if (!profile) {
    return { title: "Profile not found · RejectCheck" };
  }
  const name = profile.displayName ?? `@${profile.username}`;
  const title = `${name} · RejectCheck`;
  const description = profile.bio ?? `${name} on RejectCheck`;
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
      images: [
        {
          url: `https://www.rejectcheck.com/${lang}/opengraph-image/main`,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
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
  if (!COMMUNITY_FEATURES_ENABLED) notFound();
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

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <Navbar />
      <div className="max-w-[1420px] mx-auto px-8 md:px-16 py-12">
        <PublicProfileHeader profile={profile} />
        <div className="mt-10 flex flex-col gap-6">
          <PublicHeatmap
            activity={activity}
            title={dict.publicProfilePage.heatmap.title}
            lastYearLabel={dict.publicProfilePage.heatmap.lastYear}
          />
          <AchievementsList
            achievements={profile.achievements}
            dateLocale={dateLocale}
          />
        </div>
      </div>
    </div>
  );
}
