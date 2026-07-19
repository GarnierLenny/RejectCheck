import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale, type Locale } from "../../dictionaries";
import { SharedAnalysisView } from "../../../../components/SharedAnalysisView";
import type { AnalysisResult } from "../../../../components/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

type SharedAnalysisData = {
  id: number;
  jobLabel: string | null;
  company: string | null;
  result: AnalysisResult | null;
  profile: { displayName: string | null; avatarUrl: string | null } | null;
  createdAt: string;
  cvTextFormatted: string | null;
  cvFileUrl: string | null;
  linkedinTextFormatted: string | null;
  liFileUrl: string | null;
  coverLetter: string | null;
  mlFileUrl: string | null;
};

async function fetchSharedAnalysis(token: string): Promise<SharedAnalysisData | null> {
  const res = await fetch(`${API_BASE}/api/share/${token}`, {
    next: { revalidate: 3600 },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; token: string }>;
}): Promise<Metadata> {
  const { lang, token } = await params;
  const data = await fetchSharedAnalysis(token);
  if (!data || !data.result) {
    return { title: "Shared analysis · RejectCheck" };
  }

  const name = data.profile?.displayName ?? "Someone";
  const position = [data.jobLabel, data.company].filter(Boolean).join(" @ ");
  const isCvReview = !!data.result.cv_quality;
  const score = isCvReview ? data.result.cv_quality!.overall : 100 - data.result.score;
  const ogImageUrl = `https://rejectcheck.com/og/share/${token}`;

  const title = isCvReview
    ? `${name} · ${score} CV Score · RejectCheck`
    : position
      ? `${name} · ${score} competitiveness for ${position} · RejectCheck`
      : `${name} · ${score} competitiveness · RejectCheck`;

  const description = isCvReview
    ? `See ${name}'s CV score on RejectCheck: layout, keywords, ATS compatibility and more.`
    : `See ${name}'s full application analysis on RejectCheck: ATS score, red flags, skill gap, and more.`;

  return {
    title,
    description,
    // Per-user, tokenized, thin pages: keep them out of the index (and off the
    // crawl budget) but leave OG/Twitter tags so link unfurls still render rich
    // previews when a share URL is pasted into social/chat.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: `/${lang}/share/${token}`,
      siteName: "RejectCheck",
      images: [{ url: ogImageUrl, width: 1290, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SharedAnalysisPage({
  params,
}: {
  params: Promise<{ lang: string; token: string }>;
}) {
  const { lang, token } = await params;
  const locale = (hasLocale(lang) ? lang : "en") as Locale;

  const data = await fetchSharedAnalysis(token);
  if (!data || !data.result) notFound();

  // SharedAnalysisView owns its own chrome: the vs-job branch is a full-height
  // report view with its own topbar (like the real analysis page), the cv-review
  // branch renders its own Navbar. No outer wrapper here.
  return (
    <SharedAnalysisView
      result={data.result}
      jobLabel={data.jobLabel}
      company={data.company}
      profile={data.profile}
      lang={locale}
      token={token}
      cvTextFormatted={data.cvTextFormatted}
      cvFileUrl={data.cvFileUrl}
      linkedinTextFormatted={data.linkedinTextFormatted}
      liFileUrl={data.liFileUrl}
      coverLetter={data.coverLetter}
      mlFileUrl={data.mlFileUrl}
    />
  );
}
