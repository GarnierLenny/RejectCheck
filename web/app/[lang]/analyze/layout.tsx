import type { Metadata } from 'next'
import {
  JsonLd,
  SITE_URL,
  breadcrumbSchema,
  howToSchema,
} from '../../components/JsonLd'
import { SeoFooter } from '../../components/SeoFooter'
import { hasLocale, type Locale } from '../dictionaries'

type LangParams = { lang: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const isEn = lang === 'en'

  const title = isEn
    ? 'CV Analyzer for Developers'
    : 'Analyseur de CV pour développeurs'

  const description = isEn
    ? 'Upload your CV + a job description. Get an ATS score, skill gap radar, GitHub/LinkedIn audit and fixes in 60 seconds. Free, no signup.'
    : "Téléverse ton CV et une offre. Score ATS, radar des lacunes, audit GitHub/LinkedIn, red flags et corrections en 60 secondes. Gratuit, sans inscription."

  const canonical = `${SITE_URL}/${lang}/analyze`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en/analyze`,
        fr: `${SITE_URL}/fr/analyze`,
        'x-default': `${SITE_URL}/en/analyze`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: isEn ? 'en_US' : 'fr_FR',
      alternateLocale: isEn ? ['fr_FR'] : ['en_US'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function AnalyzeLayout({
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
      name: locale === 'fr' ? 'Analyseur de CV' : 'CV Analyzer',
      url: `${SITE_URL}/${locale}/analyze`,
    },
  ])

  const howTo = howToSchema(locale)

  return (
    <>
      <JsonLd id="ld-breadcrumb-analyze" data={breadcrumbs} />
      <JsonLd id="ld-howto-analyze" data={howTo} />
      {children}
      <SeoFooter lang={locale} />
    </>
  )
}
