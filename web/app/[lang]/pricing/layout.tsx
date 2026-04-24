import type { Metadata } from 'next'
import {
  JsonLd,
  SITE_URL,
  productOffersSchema,
  breadcrumbSchema,
  faqPageSchema,
} from '../../components/JsonLd'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'

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
    ? 'Pricing - Free, Shortlisted (€7.99), Hired (€11.99)'
    : 'Tarifs - Gratuit, Shortlisted (7,99 €), Hired (11,99 €)'

  const description = isEn
    ? 'Transparent pricing: 1 free CV analysis forever (no signup), or unlimited analyses with AI mock interview and CV rewrite from €7.99/month. Refund guarantee on the Hired plan if you get hired.'
    : "Tarification transparente : 1 analyse CV gratuite à vie (sans inscription), ou analyses illimitées avec entretien simulé IA et réécriture de CV à partir de 7,99 €/mois. Garantie de remboursement sur le plan Hired si tu décroches le job."

  const canonical = `${SITE_URL}/${lang}/pricing`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en/pricing`,
        fr: `${SITE_URL}/fr/pricing`,
        'x-default': `${SITE_URL}/en/pricing`,
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

export default async function PricingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<LangParams>
}) {
  const { lang } = await params
  const locale = (hasLocale(lang) ? lang : 'en') as Locale

  const productSchemas = productOffersSchema(locale)
  const breadcrumbs = breadcrumbSchema([
    {
      name: locale === 'fr' ? 'Accueil' : 'Home',
      url: `${SITE_URL}/${locale}`,
    },
    {
      name: locale === 'fr' ? 'Tarifs' : 'Pricing',
      url: `${SITE_URL}/${locale}/pricing`,
    },
  ])

  const dict = await getDictionary(locale)
  const faqItems = dict.pricing.faq.items
  const faqSchema = faqPageSchema(faqItems)

  return (
    <>
      <JsonLd id="ld-breadcrumb-pricing" data={breadcrumbs} />
      {productSchemas.map((schema, i) => (
        <JsonLd key={i} id={`ld-product-${i}`} data={schema} />
      ))}
      <JsonLd id="ld-faq-pricing" data={faqSchema} />
      {children}
    </>
  )
}
