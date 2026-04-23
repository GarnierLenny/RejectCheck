type JsonLdSchema = Record<string, unknown>

export function JsonLd({ data, id }: { data: JsonLdSchema | JsonLdSchema[]; id?: string }) {
  const json = JSON.stringify(data)
  return (
    <script
      type="application/ld+json"
      id={id}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}

export const SITE_URL = 'https://rejectcheck.com'

export const organizationSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RejectCheck',
  alternateName: 'RejectCheck — CV rejection diagnosis',
  url: SITE_URL,
  logo: `${SITE_URL}/RejectCheck_white.png`,
  description:
    'RejectCheck is an AI-powered CV and job application diagnosis tool. Dual-AI pipeline (GPT-4o + Claude) delivers ATS simulation, technical skill gap radar, GitHub/LinkedIn signal audit, red-flag detection, CV rewrite, and a voice-based AI mock interview in under 60 seconds.',
  email: 'support@rejectcheck.com',
  sameAs: [],
}

export const websiteSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'RejectCheck',
  url: SITE_URL,
  inLanguage: ['en', 'fr'],
  publisher: {
    '@type': 'Organization',
    name: 'RejectCheck',
    url: SITE_URL,
  },
}

export function softwareApplicationSchema(locale: 'en' | 'fr'): JsonLdSchema {
  const description =
    locale === 'fr'
      ? "RejectCheck est un outil IA de diagnostic de CV et candidatures. Pipeline dual-IA (GPT-4o + Claude) : simulation ATS, radar des lacunes techniques, audit signaux GitHub/LinkedIn, détection de red flags, réécriture de CV, et entretien simulé IA vocal, le tout en moins de 60 secondes."
      : 'RejectCheck is an AI-powered CV and job application diagnosis tool. Dual-AI pipeline (GPT-4o + Claude) delivers ATS simulation, technical skill gap radar, GitHub/LinkedIn signal audit, red-flag detection, CV rewrite, and a voice-based AI mock interview in under 60 seconds.'

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RejectCheck',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Career / HR Tech',
    operatingSystem: 'Web',
    url: `${SITE_URL}/${locale}`,
    description,
    inLanguage: locale,
    offers: [
      {
        '@type': 'Offer',
        name: 'REJECTED (Free)',
        price: '0',
        priceCurrency: 'EUR',
        url: `${SITE_URL}/${locale}/pricing`,
        availability: 'https://schema.org/InStock',
        category: 'free',
      },
      {
        '@type': 'Offer',
        name: 'SHORTLISTED',
        price: '7.99',
        priceCurrency: 'EUR',
        url: `${SITE_URL}/${locale}/pricing`,
        availability: 'https://schema.org/InStock',
        category: 'subscription',
        eligibleDuration: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitCode: 'MON',
        },
      },
      {
        '@type': 'Offer',
        name: 'HIRED',
        price: '11.99',
        priceCurrency: 'EUR',
        url: `${SITE_URL}/${locale}/pricing`,
        availability: 'https://schema.org/InStock',
        category: 'subscription',
        eligibleDuration: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitCode: 'MON',
        },
      },
    ],
    featureList: [
      'ATS (Applicant Tracking System) simulation',
      'Technical skill gap radar chart',
      'GitHub signal audit',
      'LinkedIn signal audit',
      'Red-flag detection (employment gaps, vague titles, passive voice)',
      'AI CV rewrite with PDF export',
      'Voice-based AI mock interview',
      'Cover letter generator',
      'Application tracker',
    ],
    publisher: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: SITE_URL,
    },
  }
}

export function productOffersSchema(locale: 'en' | 'fr'): JsonLdSchema[] {
  const pricingUrl = `${SITE_URL}/${locale}/pricing`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'RejectCheck REJECTED (Free plan)',
      description:
        locale === 'fr'
          ? 'Plan gratuit : 1 analyse CV approfondie avec simulation ATS, audit ton, audit séniorité, et détection de red flags.'
          : 'Free plan: 1 deep CV analysis with ATS simulation, tone audit, seniority audit, and red-flag detection.',
      brand: { '@type': 'Brand', name: 'RejectCheck' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: pricingUrl,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'RejectCheck SHORTLISTED',
      description:
        locale === 'fr'
          ? 'Abonnement mensuel : analyses illimitées, historique, entretien simulé IA, réécriture de CV, suivi des candidatures.'
          : 'Monthly subscription: unlimited analyses, history, AI mock interview, CV rewrite, application tracker.',
      brand: { '@type': 'Brand', name: 'RejectCheck' },
      offers: {
        '@type': 'Offer',
        price: '7.99',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: pricingUrl,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'RejectCheck HIRED',
      description:
        locale === 'fr'
          ? 'Abonnement mensuel premium : tout Shortlisted + lettre de motivation, message recruteur, salary reality check, roadmaps. Garantie : remboursement si décroché.'
          : 'Premium monthly subscription: everything in Shortlisted + cover letter generator, recruiter message generator, salary reality check, roadmaps. Refund guarantee if you get hired.',
      brand: { '@type': 'Brand', name: 'RejectCheck' },
      offers: {
        '@type': 'Offer',
        price: '11.99',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: pricingUrl,
      },
    },
  ]
}

export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>,
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function faqPageSchema(
  items: Array<{ question: string; answer: string }>,
): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
