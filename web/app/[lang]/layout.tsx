import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from './dictionaries'
import { LanguageProvider } from '../../context/language'
import { SITE_URL } from '../components/JsonLd'

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'fr' }]
}

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
    ? 'RejectCheck — Find out why your CV got rejected'
    : 'RejectCheck — Comprends pourquoi ton CV a été rejeté'

  const description = isEn
    ? 'AI-powered CV and job application diagnosis. Dual-AI (GPT-4o + Claude) delivers ATS simulation, skill gap radar, GitHub & LinkedIn audit, red-flag detection, CV rewrite, and AI mock interview — in under 60 seconds.'
    : "Diagnostic IA de CV et candidatures. Dual-IA (GPT-4o + Claude) : simulation ATS, radar des lacunes, audit GitHub & LinkedIn, détection de red flags, réécriture de CV, entretien simulé IA — en moins de 60 secondes."

  const ogLocale = isEn ? 'en_US' : 'fr_FR'
  const canonical = `${SITE_URL}/${lang}`

  return {
    title: {
      default: title,
      template: isEn ? '%s — RejectCheck' : '%s — RejectCheck',
    },
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en`,
        fr: `${SITE_URL}/fr`,
        'x-default': `${SITE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'RejectCheck',
      locale: ogLocale,
      alternateLocale: isEn ? ['fr_FR'] : ['en_US'],
      type: 'website',
      images: [
        {
          url: '/RejectCheck_white.png',
          width: 500,
          height: 500,
          alt: 'RejectCheck',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/RejectCheck_white.png'],
    },
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<LangParams>
}) {
  const { lang } = await params

  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  return (
    <LanguageProvider dictionary={dict} locale={lang}>
      {children}
    </LanguageProvider>
  )
}
