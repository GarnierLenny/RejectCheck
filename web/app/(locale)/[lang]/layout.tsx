import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Inter, IBM_Plex_Mono, DM_Serif_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { getDictionary, hasLocale } from './dictionaries'
import { LanguageProvider } from '../../../context/language'
import Providers from '../../providers'
import { JsonLd, organizationSchema, websiteSchema, SITE_URL } from '../../components/JsonLd'
import '../../globals.css'

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
})

const dmSerifDisplay = DM_Serif_Display({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
})

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
    ? 'RejectCheck - Find out why your CV got rejected'
    : 'RejectCheck - Comprends pourquoi ton CV a été rejeté'

  const description = isEn
    ? 'AI ATS + resume checker for engineering roles, works for any job. Dual-AI scores ATS, skill gaps, GitHub & LinkedIn in 60 seconds. Free.'
    : 'Diagnostic IA de CV optimisé pour développeurs, fonctionne pour tous métiers. Score ATS, lacunes, audit GitHub & LinkedIn en 60s. Gratuit.'

  const ogLocale = isEn ? 'en_US' : 'fr_FR'
  const canonical = `${SITE_URL}/${lang}`

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: '%s - RejectCheck',
    },
    description,
    applicationName: 'RejectCheck',
    authors: [{ name: 'RejectCheck', url: SITE_URL }],
    creator: 'RejectCheck',
    publisher: 'RejectCheck',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    icons: {
      icon: '/RejectCheck_white.png',
      shortcut: '/RejectCheck_white.png',
      apple: '/RejectCheck_white.png',
    },
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
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function LocaleRootLayout({
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
    <html
      lang={lang}
      className={`${inter.variable} ${ibmPlexMono.variable} ${dmSerifDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <JsonLd id="ld-organization" data={organizationSchema} />
        <JsonLd id="ld-website" data={websiteSchema} />
      </head>
      <body className="min-h-full flex flex-col">
        <Toaster position="top-center" expand={true} richColors />
        <Providers>
          <LanguageProvider dictionary={dict} locale={lang}>
            {children}
          </LanguageProvider>
        </Providers>
      </body>
      <Analytics />
    </html>
  )
}
