import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../../components/Navbar'
import { SeoFooter } from '../../../components/SeoFooter'
import { BlueprintCta } from '../../../components/BlueprintCta'
import { JsonLd, SITE_URL, breadcrumbSchema } from '../../../components/JsonLd'
import { hasLocale, type Locale } from '../dictionaries'

const PAGE_PATH = '/guides'
const CANONICAL = `${SITE_URL}/en${PAGE_PATH}`

const TITLE = 'Career & Resume Guides for Developers'
const DESCRIPTION =
  'In-depth guides on getting past the ATS, why developers get rejected, and writing a software engineer CV that converts. Practical, no fluff.'

type LangParams = { lang: string }

// EN-only cluster (each guide notFound()s under /fr), so the hub matches.
const GUIDES = [
  {
    href: `${SITE_URL}/en/guides/how-to-pass-ats`,
    path: '/en/guides/how-to-pass-ats',
    label: 'ATS · 12 min',
    title: 'How to Pass ATS in 2026 — A Developer’s Guide',
    description:
      'How ATS works, the format traps that break parsing, and the keyword + structure rules that get your CV through to a human.',
  },
  {
    href: `${SITE_URL}/en/guides/why-developers-get-rejected`,
    path: '/en/guides/why-developers-get-rejected',
    label: 'Rejection · 10 min',
    title: 'Why Developers Get Rejected (2026)',
    description:
      'The three filters between Submit and the interview — ATS, the 6-second HR scan, and the hiring manager review — plus 9 red flags and how to iterate.',
  },
  {
    href: `${SITE_URL}/en/guides/software-engineer-resume-tips`,
    path: '/en/guides/software-engineer-resume-tips',
    label: 'Resume · 11 min',
    title: '12 Software Engineer Resume Tips (2026)',
    description:
      '12 tips based on what hiring managers actually look for: GitHub signals, ownership phrasing, ATS-friendly format, and seniority alignment.',
  },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang) || lang !== 'en') return {}

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: CANONICAL,
      languages: {
        en: CANONICAL,
        'x-default': CANONICAL,
      },
    },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: CANONICAL,
      locale: 'en_US',
      siteName: 'RejectCheck',
      images: [{ url: `${SITE_URL}/en/opengraph-image/main`, width: 1200, height: 630, alt: 'RejectCheck' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      images: [`${SITE_URL}/en/opengraph-image/main`],
    },
  }
}

export default async function GuidesHubPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  if (lang !== 'en') notFound()

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/en` },
    { name: 'Guides', url: CANONICAL },
  ])

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    isPartOf: { '@type': 'WebSite', name: 'RejectCheck', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: GUIDES.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: g.href,
        name: g.title,
      })),
    },
  }

  return (
    <>
      <JsonLd id="ld-breadcrumb-guides" data={breadcrumbs} />
      <JsonLd id="ld-collection-guides" data={collection} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        {/* Hero */}
        <section className="max-w-[1000px] mx-auto px-5 md:px-[40px] pt-20 pb-12 md:pt-28 md:pb-16">
          <div className="flex items-center gap-3 mb-7">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              Guides · Optimised for devs. Works for any role.
            </span>
          </div>
          <h1 className="text-[40px] md:text-[56px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[820px] mb-6">
            Get past the filters,{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              not just the keywords
            </span>
            .
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[620px]">
            Practical, no-fluff guides on the things that actually get developers
            rejected — and exactly how to fix them.
          </p>
        </section>

        {/* Guide list */}
        <section className="max-w-[1000px] mx-auto px-5 md:px-[40px] pb-20 md:pb-28">
          <div className="border-t border-rc-border">
            {GUIDES.map((g) => (
              <Link
                key={g.path}
                href={g.path}
                className="group grid grid-cols-[1fr_auto] items-center gap-6 border-b border-rc-border py-8 md:py-9 no-underline"
              >
                <div>
                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-rc-hint">
                    {g.label}
                  </span>
                  <h2 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mt-2 mb-2 group-hover:text-rc-red transition-colors">
                    {g.title}
                  </h2>
                  <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.6] max-w-[640px]">
                    {g.description}
                  </p>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-rc-hint group-hover:text-rc-red group-hover:translate-x-1 transition-all shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M2 7h10M7.5 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        <BlueprintCta lang={lang as Locale} />
        <SeoFooter lang={lang as Locale} />
      </div>
    </>
  )
}
