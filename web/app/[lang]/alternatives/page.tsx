import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../components/Navbar'
import {
  JsonLd,
  SITE_URL,
  breadcrumbSchema,
} from '../../components/JsonLd'
import { hasLocale, type Locale } from '../dictionaries'
import { ALTERNATIVES_REGISTRY } from './_data/registry'

type LangParams = { lang: string }

const PAGE_PATH = '/alternatives'

type HubCopy = {
  title: string
  description: string
  badgeLabel: string
  heroTitle: string
  heroIntro: string
  breadcrumbHome: string
  breadcrumbCurrent: string
  cardCta: string
  englishOnly: string
  bilingualLabel: string
  ctaTitle: string
  ctaSubtitle: string
  ctaButton: string
  footerCopyright: string
  footerPrivacy: string
  footerPricing: string
}

const COPY: Record<Locale, HubCopy> = {
  en: {
    title: 'CV Analyzer Alternatives — Honest Comparisons (2026)',
    description:
      'Hand-on comparisons of the main CV analyzer and ATS optimization tools — Jobscan, Rezi, Resume Worded, and more. Published pricing, honest weaknesses, and who each tool is actually best for.',
    badgeLabel: 'All comparisons',
    heroTitle: 'CV analyzer alternatives, compared',
    heroIntro:
      'Hand-on research, public pricing where available, and honest weaknesses. Each page lists 6-7 real alternatives (RejectCheck included), a decision guide, and an FAQ addressing the most common buyer questions. Updated April 2026.',
    breadcrumbHome: 'Home',
    breadcrumbCurrent: 'Alternatives',
    cardCta: 'Read the comparison →',
    englishOnly: 'English only',
    bilingualLabel: 'EN + FR',
    ctaTitle: 'Start with a free diagnosis',
    ctaSubtitle:
      'Before you commit to any of these tools, run your CV through RejectCheck free. One full analysis, no signup, in under 60 seconds.',
    ctaButton: 'Analyze my CV free',
    footerCopyright: '© RejectCheck · Last updated April 24, 2026',
    footerPrivacy: 'Privacy (GDPR)',
    footerPricing: 'Pricing',
  },
  fr: {
    title: "Alternatives aux analyseurs de CV — Comparaisons honnêtes (2026)",
    description:
      "Comparaisons hands-on des principaux outils d'analyse CV et d'optimisation ATS — Jobscan, Rezi, Resume Worded, et plus. Prix publiés, faiblesses honnêtes, et pour qui chaque outil est vraiment le mieux.",
    badgeLabel: 'Toutes les comparaisons',
    heroTitle: "Alternatives aux analyseurs de CV, comparées",
    heroIntro:
      "Recherche hands-on, prix publics quand dispo, et faiblesses honnêtes. Chaque page liste 6-7 alternatives réelles (RejectCheck inclus), un guide de décision, et une FAQ qui adresse les questions d'achat courantes. Mis à jour en avril 2026.",
    breadcrumbHome: 'Accueil',
    breadcrumbCurrent: 'Alternatives',
    cardCta: 'Lire la comparaison →',
    englishOnly: 'Anglais uniquement',
    bilingualLabel: 'EN + FR',
    ctaTitle: 'Démarre par un diagnostic gratuit',
    ctaSubtitle:
      "Avant de t'engager sur un de ces outils, fais passer ton CV dans RejectCheck gratuitement. 1 analyse complète, sans inscription, en moins de 60 secondes.",
    ctaButton: 'Analyser mon CV gratuit',
    footerCopyright: '© RejectCheck · Mis à jour le 24 avril 2026',
    footerPrivacy: 'Confidentialité (RGPD)',
    footerPricing: 'Tarifs',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const locale = lang as Locale
  const c = COPY[locale]
  const canonical = `${SITE_URL}/${locale}${PAGE_PATH}`

  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en${PAGE_PATH}`,
        fr: `${SITE_URL}/fr${PAGE_PATH}`,
        'x-default': `${SITE_URL}/en${PAGE_PATH}`,
      },
    },
    openGraph: {
      title: c.title,
      description: c.description,
      url: canonical,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      alternateLocale: locale === 'fr' ? ['en_US'] : ['fr_FR'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: c.title,
      description: c.description,
    },
  }
}

export default async function AlternativesHubPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const locale = lang as Locale
  const c = COPY[locale]
  const canonical = `${SITE_URL}/${locale}${PAGE_PATH}`

  const breadcrumbs = breadcrumbSchema([
    { name: c.breadcrumbHome, url: `${SITE_URL}/${locale}` },
    { name: c.breadcrumbCurrent, url: canonical },
  ])

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: c.title,
    description: c.description,
    url: canonical,
    inLanguage: locale,
    isPartOf: { '@type': 'WebSite', name: 'RejectCheck', url: SITE_URL },
    hasPart: ALTERNATIVES_REGISTRY.map((entry) => {
      const targetLang = entry.bilingual || locale === 'en' ? locale : 'en'
      return {
        '@type': 'Article',
        name: `${entry.competitor} alternatives`,
        url: `${SITE_URL}/${targetLang}/alternatives/${entry.slug}`,
        inLanguage: targetLang,
      }
    }),
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: c.heroTitle,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: ALTERNATIVES_REGISTRY.length,
    itemListElement: ALTERNATIVES_REGISTRY.map((entry, i) => {
      const targetLang = entry.bilingual || locale === 'en' ? locale : 'en'
      return {
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/${targetLang}/alternatives/${entry.slug}`,
        name: `${entry.competitor} alternatives`,
      }
    }),
  }

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <JsonLd id="ld-breadcrumb-alt-hub" data={breadcrumbs} />
      <JsonLd id="ld-collection-alt-hub" data={collectionSchema} />
      <JsonLd id="ld-itemlist-alt-hub" data={itemListSchema} />

      <Navbar />

      {/* HERO */}
      <section className="max-w-[1000px] mx-auto px-5 md:px-[40px] pt-16 pb-10 md:pt-24 md:pb-14">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rc-muted mb-8"
        >
          <Link href={`/${locale}`} className="no-underline hover:text-rc-red">
            {c.breadcrumbHome}
          </Link>
          <span>/</span>
          <span className="text-rc-text">{c.breadcrumbCurrent}</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-6 bg-rc-red" />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
            {c.badgeLabel}
          </span>
        </div>

        <h1 className="text-[38px] md:text-[54px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text mb-6 max-w-[900px]">
          {c.heroTitle}
        </h1>

        <p className="text-rc-muted text-[16px] md:text-[18px] leading-[1.65] max-w-[720px]">
          {c.heroIntro}
        </p>
      </section>

      {/* CARDS GRID */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ALTERNATIVES_REGISTRY.map((entry) => {
              const isAvailableInLocale = entry.bilingual || locale === 'en'
              const targetLang = isAvailableInLocale ? locale : 'en'
              const href = `/${targetLang}/alternatives/${entry.slug}`
              const tagline = entry.tagline[locale]
              const showEnglishOnly = locale === 'fr' && !entry.bilingual

              return (
                <Link
                  key={entry.slug}
                  href={href}
                  className="group no-underline flex flex-col h-full rounded-2xl border border-rc-border bg-rc-surface p-6 md:p-7 transition-all hover:border-rc-red hover:shadow-[0_8px_28px_rgba(201,58,57,0.08)]"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-muted">
                      vs {entry.competitor}
                    </span>
                    <span
                      className={`font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 rounded border ${
                        showEnglishOnly
                          ? 'border-amber-600/30 text-amber-700'
                          : 'border-green-600/30 text-green-700'
                      }`}
                    >
                      {showEnglishOnly ? c.englishOnly : c.bilingualLabel}
                    </span>
                  </div>

                  <h2 className="text-[22px] md:text-[24px] font-semibold tracking-[-0.01em] text-rc-text mb-3 leading-[1.2]">
                    {entry.competitor} alternatives
                  </h2>

                  <p className="text-rc-muted text-[14px] leading-[1.6] flex-1 mb-6">
                    {tagline}
                  </p>

                  <div className="font-mono text-[11px] tracking-[0.08em] text-rc-red group-hover:translate-x-1 transition-transform">
                    {c.cardCta}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-20 md:py-28 text-center">
          <h2 className="text-[28px] md:text-[40px] font-semibold tracking-[-0.02em] mb-5">
            {c.ctaTitle}
          </h2>
          <p className="text-rc-muted text-[15px] md:text-[17px] leading-[1.65] max-w-[580px] mx-auto mb-8">
            {c.ctaSubtitle}
          </p>
          <Link
            href={`/${locale}/analyze`}
            className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
          >
            {c.ctaButton}
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M7.5 3l4 4-4 4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[13px] text-rc-muted">{c.footerCopyright}</div>
        <div className="flex gap-6">
          <Link
            href={`/${locale}/privacy`}
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            {c.footerPrivacy}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            {c.footerPricing}
          </Link>
        </div>
      </footer>
    </div>
  )
}
