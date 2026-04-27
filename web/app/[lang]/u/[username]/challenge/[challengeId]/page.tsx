import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Navbar } from "../../../../../components/Navbar";
import { Heading, Caption, Text } from "../../../../../components/typography";
import { getDictionary, hasLocale, type Locale } from "../../../../dictionaries";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

type AttemptView = {
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  challenge: {
    id: number;
    title: string;
    focusTag: string;
    difficulty: string;
    language: string;
    date: string;
  };
  score: number;
  completedAt: string;
};

async function fetchAttempt(
  username: string,
  challengeId: number,
): Promise<AttemptView | null> {
  const res = await fetch(
    `${API_BASE}/api/u/${encodeURIComponent(username)}/attempts/${challengeId}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

const DIFFICULTY_TONE: Record<string, string> = {
  easy: "text-rc-green border-rc-green/30 bg-rc-green/5",
  medium: "text-rc-amber border-rc-amber/30 bg-rc-amber/5",
  hard: "text-rc-red border-rc-red/30 bg-rc-red/5",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; username: string; challengeId: string }>;
}): Promise<Metadata> {
  const { lang, username, challengeId } = await params;
  const lower = username.toLowerCase();
  const challengeIdNum = Number(challengeId);
  if (!Number.isFinite(challengeIdNum)) {
    return { title: "Score · RejectCheck" };
  }
  const attempt = await fetchAttempt(lower, challengeIdNum);
  if (!attempt) {
    return { title: "Score · RejectCheck" };
  }
  const name = attempt.user.displayName ?? `@${attempt.user.username}`;
  const title = `${name} · ${attempt.challenge.title} · RejectCheck`;
  const description = `${name} scored ${attempt.score}/100 on the RejectCheck challenge "${attempt.challenge.title}".`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/u/${attempt.user.username}/challenge/${attempt.challenge.id}`,
    },
    openGraph: {
      title,
      description,
      url: `/${lang}/u/${attempt.user.username}/challenge/${attempt.challenge.id}`,
      siteName: "RejectCheck",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicAttemptPage({
  params,
}: {
  params: Promise<{ lang: string; username: string; challengeId: string }>;
}) {
  const { lang, username, challengeId } = await params;
  const locale = (hasLocale(lang) ? lang : "en") as Locale;
  const dict = await getDictionary(locale);
  const dateLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const lower = username.toLowerCase();
  const challengeIdNum = Number(challengeId);
  if (!Number.isFinite(challengeIdNum)) notFound();

  const attempt = await fetchAttempt(lower, challengeIdNum);
  if (!attempt) notFound();

  const name = attempt.user.displayName ?? `@${attempt.user.username}`;
  const initials = name.slice(0, 2).toUpperCase();
  const completedAt = new Date(attempt.completedAt).toLocaleDateString(
    dateLocale,
    { day: "numeric", month: "long", year: "numeric" },
  );
  const scoreColor =
    attempt.score >= 90
      ? "text-rc-red"
      : attempt.score >= 70
        ? "text-rc-amber"
        : "text-rc-text";

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text font-sans">
      <Navbar />
      <div className="max-w-[600px] mx-auto px-5 md:px-[40px] py-12 md:py-16">
        <div className="bg-rc-surface border border-rc-border rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href={`/${lang}/u/${attempt.user.username}`}
              className="shrink-0 no-underline"
            >
              {attempt.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attempt.user.avatarUrl}
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
                href={`/${lang}/u/${attempt.user.username}`}
                className="block no-underline"
              >
                <Text weight="medium" className="block truncate">{name}</Text>
                <Caption as="p" className="font-mono text-[11px] truncate">
                  @{attempt.user.username}
                </Caption>
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center text-center py-6 border-y border-rc-border mb-6">
            <Trophy size={20} className="text-rc-amber mb-2" />
            <Heading as="h1" size="lg" className="mb-1">
              {attempt.challenge.title}
            </Heading>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                  DIFFICULTY_TONE[attempt.challenge.difficulty] ??
                  DIFFICULTY_TONE.medium
                }`}
              >
                {attempt.challenge.difficulty}
              </span>
              <Caption className="font-mono text-[11px]">
                {attempt.challenge.focusTag} · {attempt.challenge.language}
              </Caption>
            </div>
            <div
              className={`mt-6 font-mono text-[64px] font-bold tabular-nums leading-none ${scoreColor}`}
            >
              {attempt.score}
              <span className="text-[24px] text-rc-hint ml-1">/100</span>
            </div>
            <Caption as="p" className="block mt-3 font-mono text-[11px]">
              {dict.publicProfilePage.attemptShare.completedOn} {completedAt}
            </Caption>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              href={`/${lang}/u/${attempt.user.username}`}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-rc-muted hover:text-rc-text no-underline"
            >
              {dict.publicProfilePage.attemptShare.viewProfile} →
            </Link>
            <Link
              href={`/${lang}/challenge`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rc-red text-white font-mono text-[11px] uppercase tracking-[0.12em] rounded-md hover:bg-[#b83332] transition-colors no-underline"
            >
              {dict.publicProfilePage.attemptShare.tryYourself}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
