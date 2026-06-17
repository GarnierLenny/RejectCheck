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

// preload:false on the non-LCP families — the hero text is Inter (still
// preloaded), so the mono labels and the display-serif accents can swap in
// without their woff2 racing the LCP paint.
const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  preload: false,
})

const dmSerifDisplay = DM_Serif_Display({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
  preload: false,
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
    // Icons come from the file conventions app/icon.png (256) + app/apple-icon.png
    // (180), the red-on-cream brand mark. (The old override pointed every icon at
    // the white-on-transparent logo, which is invisible on light browser tabs.)
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
      images: [{ url: `${SITE_URL}/${lang}/opengraph-image/main`, width: 1200, height: 630, alt: 'RejectCheck' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      // Custom twitter object suppresses Next's auto file-based card image, so
      // re-declare it explicitly (otherwise X renders an imageless card).
      images: [`${SITE_URL}/${lang}/opengraph-image/main`],
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
