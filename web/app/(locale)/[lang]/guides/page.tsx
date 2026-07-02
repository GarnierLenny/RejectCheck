import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../../components/Navbar'
import { SeoFooter } from '../../../components/SeoFooter'
import { BlueprintCta } from '../../../components/BlueprintCta'
import { JsonLd, SITE_URL, breadcrumbSchema } from '../../../components/JsonLd'
import { hasLocale, type Locale } from '../dictionaries'

const PAGE_PATH = '/guides'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type Guide = {
  slug: string
  label: string
  title: string
  description: string
}

type Copy = {
  title: string
  description: string
  bcHome: string
  bcCurrent: string
  eyebrow: string
  h1Pre: string
  h1Em: string
  h1Post: string
  heroSub: string
  guides: Guide[]
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: 'Career & Resume Guides for Developers',
    description:
      'In-depth guides on getting past the ATS, why developers get rejected, and writing a software engineer CV that converts. Practical, no fluff.',
    bcHome: 'Home',
    bcCurrent: 'Guides',
    eyebrow: 'Guides · Optimised for devs. Works for any role.',
    h1Pre: 'Get past the filters,',
    h1Em: 'not just the keywords',
    h1Post: '.',
    heroSub:
      'Practical, no-fluff guides on the things that actually get developers rejected — and exactly how to fix them.',
    guides: [
      {
        slug: 'how-to-pass-ats',
        label: 'ATS · 12 min',
        title: 'How to Pass ATS in 2026 — A Developer’s Guide',
        description:
          'How ATS works, the format traps that break parsing, and the keyword + structure rules that get your CV through to a human.',
      },
      {
        slug: 'why-developers-get-rejected',
        label: 'Rejection · 10 min',
        title: 'Why Developers Get Rejected (2026)',
        description:
          'The three filters between Submit and the interview — ATS, the 6-second HR scan, and the hiring manager review — plus 9 red flags and how to iterate.',
      },
      {
        slug: 'software-engineer-resume-tips',
        label: 'Resume · 11 min',
        title: '12 Software Engineer Resume Tips (2026)',
        description:
          '12 tips based on what hiring managers actually look for: GitHub signals, ownership phrasing, ATS-friendly format, and seniority alignment.',
      },
    ],
  },
  fr: {
    title: 'Guides CV & Carrière pour Développeurs',
    description:
      'Des guides détaillés pour passer l’ATS, comprendre pourquoi les développeurs sont rejetés, et écrire un CV d’ingénieur logiciel qui convertit. Du concret, sans blabla.',
    bcHome: 'Accueil',
    bcCurrent: 'Guides',
    eyebrow: 'Guides · Optimisé pour les devs. Marche pour tous les métiers.',
    h1Pre: 'Passe les filtres,',
    h1Em: 'pas seulement les mots-clés',
    h1Post: '.',
    heroSub:
      'Des guides concrets et sans blabla sur ce qui fait vraiment rejeter les développeurs — et exactement comment y remédier.',
    guides: [
      {
        slug: 'how-to-pass-ats',
        label: 'ATS · 12 min',
        title: 'Comment passer l’ATS en 2026 — le guide du développeur',
        description:
          'Comment fonctionne l’ATS, les pièges de mise en forme qui cassent la lecture automatique, et les règles de mots-clés et de structure qui font arriver ton CV jusqu’à un humain.',
      },
      {
        slug: 'why-developers-get-rejected',
        label: 'Rejet · 10 min',
        title: 'Pourquoi les développeurs sont rejetés (2026)',
        description:
          'Les trois filtres entre « Envoyer » et l’entretien — l’ATS, le scan RH de 6 secondes et la relecture du manager — plus 9 signaux d’alerte et comment itérer.',
      },
      {
        slug: 'software-engineer-resume-tips',
        label: 'CV · 11 min',
        title: '12 conseils pour le CV d’ingénieur logiciel (2026)',
        description:
          '12 conseils basés sur ce que les managers regardent vraiment : signaux GitHub, formulations qui montrent l’ownership, format compatible ATS et alignement de séniorité.',
      },
    ],
  },
}

type LangParams = { lang: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const c = COPY[lang]
  const canonical = canonicalFor(lang)

  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical,
      languages: {
        en: canonicalFor('en'),
        fr: canonicalFor('fr'),
        'x-default': canonicalFor('en'),
      },
    },
    openGraph: {
      title: c.title,
      description: c.description,
      url: canonical,
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      siteName: 'RejectCheck',
      images: [{ url: `${SITE_URL}/og?lang=${lang}`, width: 1200, height: 630, alt: 'RejectCheck' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: c.title,
      description: c.description,
      images: [`${SITE_URL}/og?lang=${lang}`],
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
  const c = COPY[lang]
  const base = `/${lang}`
  const canonical = canonicalFor(lang)

  const breadcrumbs = breadcrumbSchema([
    { name: c.bcHome, url: `${SITE_URL}/${lang}` },
    { name: c.bcCurrent, url: canonical },
  ])

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: c.title,
    description: c.description,
    url: canonical,
    isPartOf: { '@type': 'WebSite', name: 'RejectCheck', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: c.guides.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/${lang}/guides/${g.slug}`,
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
              {c.eyebrow}
            </span>
          </div>
          <h1 className="text-[40px] md:text-[56px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[820px] mb-6">
            {c.h1Pre}{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {c.h1Em}
            </span>
            {c.h1Post}
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[620px]">
            {c.heroSub}
          </p>
        </section>

        {/* Guide list */}
        <section className="max-w-[1000px] mx-auto px-5 md:px-[40px] pb-20 md:pb-28">
          <div className="border-t border-rc-border">
            {c.guides.map((g) => (
              <Link
                key={g.slug}
                href={`${base}/guides/${g.slug}`}
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

        <BlueprintCta lang={lang} />
        <SeoFooter lang={lang} />
      </div>
    </>
  )
}
