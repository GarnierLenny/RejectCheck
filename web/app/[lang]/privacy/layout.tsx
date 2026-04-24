import type { Metadata } from 'next'
import {
  JsonLd,
  SITE_URL,
  breadcrumbSchema,
} from '../../components/JsonLd'
import { hasLocale, type Locale } from '../dictionaries'

type LangParams = { lang: string }

const LAST_UPDATED_ISO = '2026-04-20'
const PUBLISHED_ISO = '2025-01-15'

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const isEn = lang === 'en'

  const title = isEn
    ? 'Privacy Policy — GDPR-compliant CV data handling'
    : 'Politique de confidentialité — Traitement des données CV conforme RGPD'

  const description = isEn
    ? 'How RejectCheck handles your CV data: what we store, what we send to OpenAI GPT-4o and Anthropic Claude, retention, deletion, and your GDPR rights.'
    : "Comment RejectCheck traite les données de ton CV : ce qu'on stocke, ce qu'on envoie à OpenAI GPT-4o et Anthropic Claude, rétention, suppression, et tes droits RGPD."

  const canonical = `${SITE_URL}/${lang}/privacy`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en/privacy`,
        fr: `${SITE_URL}/fr/privacy`,
        'x-default': `${SITE_URL}/en/privacy`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: isEn ? 'en_US' : 'fr_FR',
      type: 'article',
      publishedTime: PUBLISHED_ISO,
      modifiedTime: LAST_UPDATED_ISO,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PrivacyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<LangParams>
}) {
  const { lang } = await params
  const locale = (hasLocale(lang) ? lang : 'en') as Locale

  const breadcrumbs = breadcrumbSchema([
    {
      name: locale === 'fr' ? 'Accueil' : 'Home',
      url: `${SITE_URL}/${locale}`,
    },
    {
      name: locale === 'fr' ? 'Confidentialité' : 'Privacy',
      url: `${SITE_URL}/${locale}/privacy`,
    },
  ])

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline:
      locale === 'fr'
        ? 'Politique de confidentialité RejectCheck'
        : 'RejectCheck Privacy Policy',
    author: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/RejectCheck_white.png`,
      },
    },
    datePublished: PUBLISHED_ISO,
    dateModified: LAST_UPDATED_ISO,
    inLanguage: locale,
    mainEntityOfPage: `${SITE_URL}/${locale}/privacy`,
  }

  return (
    <>
      <JsonLd id="ld-breadcrumb-privacy" data={breadcrumbs} />
      <JsonLd id="ld-article-privacy" data={articleSchema} />
      {children}
    </>
  )
}
