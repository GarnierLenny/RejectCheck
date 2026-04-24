import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  JsonLd,
  SITE_URL,
  breadcrumbSchema,
  faqPageSchema,
} from '../../../components/JsonLd'
import { hasLocale, type Locale } from '../../dictionaries'
import { AlternativesView } from '../_components/AlternativesView'
import { getContent } from './content'

type LangParams = { lang: string }

const PAGE_PATH = '/alternatives/resume-worded'
const LAST_UPDATED_ISO = '2026-04-24'
const PUBLISHED_ISO = '2026-04-24'

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const locale = lang as Locale
  const c = getContent(locale)
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
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: c.title,
      description: c.description,
    },
  }
}

export default async function ResumeWordedAlternativesPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const locale = lang as Locale
  const c = getContent(locale)
  const canonical = `${SITE_URL}/${locale}${PAGE_PATH}`

  const breadcrumbs = breadcrumbSchema([
    { name: c.breadcrumbHome, url: `${SITE_URL}/${locale}` },
    { name: c.breadcrumbAlternatives, url: `${SITE_URL}/${locale}/alternatives` },
    { name: `${c.breadcrumbCurrent} ${c.breadcrumbAlternatives.toLowerCase()}`, url: canonical },
  ])

  const faqSchema = faqPageSchema(c.faqItems)

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: c.heroTitle,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: c.competitors.length,
    itemListElement: c.competitors.map((comp, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: comp.name,
        url: comp.website,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: comp.tagline,
      },
    })),
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    author: { '@type': 'Organization', name: 'RejectCheck', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/RejectCheck_white.png` },
    },
    datePublished: PUBLISHED_ISO,
    dateModified: LAST_UPDATED_ISO,
    mainEntityOfPage: canonical,
    inLanguage: locale,
    about: {
      '@type': 'SoftwareApplication',
      name: 'Resume Worded',
      url: 'https://resumeworded.com',
    },
  }

  return (
    <>
      <JsonLd id="ld-breadcrumb-alt-rw" data={breadcrumbs} />
      <JsonLd id="ld-faq-alt-rw" data={faqSchema} />
      <JsonLd id="ld-itemlist-alt-rw" data={itemListSchema} />
      <JsonLd id="ld-article-alt-rw" data={articleSchema} />
      <AlternativesView content={c} locale={locale} currentSlug="resume-worded" />
    </>
  )
}
