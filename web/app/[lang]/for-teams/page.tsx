import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../components/Navbar'
import {
  JsonLd,
  SITE_URL,
  breadcrumbSchema,
  faqPageSchema,
} from '../../components/JsonLd'
import { getDictionary, hasLocale, type Locale } from '../dictionaries'

type LangParams = { lang: string }

const PAGE_PATH = '/for-teams'
const LAST_UPDATED_ISO = '2026-04-24'

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const c = dict.forTeams
  const canonical = `${SITE_URL}/${locale}${PAGE_PATH}`

  return {
    title: c.meta.title,
    description: c.meta.description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en${PAGE_PATH}`,
        fr: `${SITE_URL}/fr${PAGE_PATH}`,
        'x-default': `${SITE_URL}/en${PAGE_PATH}`,
      },
    },
    openGraph: {
      title: c.meta.title,
      description: c.meta.description,
      url: canonical,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      alternateLocale: locale === 'fr' ? ['en_US'] : ['fr_FR'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: c.meta.title,
      description: c.meta.description,
    },
  }
}

export default async function ForTeamsPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const c = dict.forTeams
  const canonical = `${SITE_URL}/${locale}${PAGE_PATH}`

  const breadcrumbs = breadcrumbSchema([
    { name: c.breadcrumb.home, url: `${SITE_URL}/${locale}` },
    { name: c.breadcrumb.current, url: canonical },
  ])

  const faqSchema = faqPageSchema(c.faq.items)

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'RejectCheck for Teams',
    description: c.meta.description,
    url: canonical,
    provider: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: SITE_URL,
    },
    serviceType: 'B2B SaaS - CV Diagnosis Platform for Career Services',
    areaServed: ['US', 'CA', 'FR', 'BE', 'CH', 'GB', 'DE', 'ES', 'IT', 'NL', 'LU'],
    audience: {
      '@type': 'BusinessAudience',
      audienceType:
        'Career coaches, coding bootcamps, university career services, outplacement firms, recruiting agencies',
    },
    category: 'Career Services Software',
    offers: c.pricing.tiers.map((tier) => ({
      '@type': 'Offer',
      name: tier.name,
      description: `${tier.range} - ${tier.billing}`,
      availability: 'https://schema.org/LimitedAvailability',
      priceSpecification: {
        '@type': 'PriceSpecification',
        description: 'Custom volume pricing - contact sales for a quote',
      },
      eligibleCustomerType: 'https://schema.org/BusinessCustomer',
    })),
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.meta.title,
    description: c.meta.description,
    author: { '@type': 'Organization', name: 'RejectCheck', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/RejectCheck_white.png` },
    },
    datePublished: LAST_UPDATED_ISO,
    dateModified: LAST_UPDATED_ISO,
    mainEntityOfPage: canonical,
    inLanguage: locale,
    about: {
      '@type': 'SoftwareApplication',
      name: 'RejectCheck',
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
    },
  }

  const analyzeHref = `/${locale}/analyze`
  const pricingHref = `/${locale}/pricing`
  const privacyHref = `/${locale}/privacy`
  const alternativesHref = `/${locale}/alternatives`

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <JsonLd id="ld-breadcrumb-for-teams" data={breadcrumbs} />
      <JsonLd id="ld-faq-for-teams" data={faqSchema} />
      <JsonLd id="ld-service-for-teams" data={serviceSchema} />
      <JsonLd id="ld-article-for-teams" data={articleSchema} />

      <Navbar />

      {/* HERO */}
      <section className="max-w-[1000px] mx-auto px-5 md:px-[40px] pt-16 pb-12 md:pt-24 md:pb-16">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rc-muted mb-8"
        >
          <Link href={`/${locale}`} className="no-underline hover:text-rc-red">
            {c.breadcrumb.home}
          </Link>
          <span>/</span>
          <span className="text-rc-text">{c.breadcrumb.current}</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-6 bg-rc-red" />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
            {c.hero.badge}
          </span>
        </div>

        <h1 className="text-[38px] md:text-[54px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text mb-6 max-w-[900px]">
          {c.hero.title}
        </h1>

        <p className="text-rc-muted text-[16px] md:text-[18px] leading-[1.65] max-w-[720px] mb-8">
          {c.hero.subtitle}
        </p>

        <div className="rounded-xl border border-amber-600/25 bg-amber-600/5 px-5 py-4 max-w-[720px]">
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-amber-700 mb-2">
            Early-access
          </div>
          <p className="text-[14px] text-rc-text leading-[1.55]">{c.hero.availabilityNote}</p>
        </div>
      </section>

      {/* SEGMENTS */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {c.segments.badge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-10">
            {c.segments.title}
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {c.segments.items.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-rc-border bg-rc-surface p-6 md:p-7"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    0{i + 1}
                  </span>
                  <div className="h-px flex-1 bg-rc-border" />
                </div>
                <h3 className="text-[19px] md:text-[20px] font-semibold tracking-[-0.01em] text-rc-text mb-3">
                  {item.label}
                </h3>
                <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.65]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-bg">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              {c.howItWorks.badge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-10">
            {c.howItWorks.title}
          </h2>

          <ol className="space-y-6">
            {c.howItWorks.steps.map((step, i) => (
              <li key={i} className="flex gap-5">
                <span className="font-mono text-[22px] text-rc-red font-semibold shrink-0 w-10">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-[17px] md:text-[18px] font-semibold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-rc-muted text-[15px] leading-[1.65]">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* STATUS (available vs roadmap) */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {c.status.badge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-10">
            {c.status.title}
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-green-600/25 bg-green-600/5 p-6 md:p-7">
              <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-green-700 mb-4">
                ✓ {c.status.availableTodayLabel}
              </div>
              <ul className="space-y-2.5">
                {c.status.availableToday.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.55] text-rc-text">
                    <span className="text-green-700 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-600/25 bg-amber-600/5 p-6 md:p-7">
              <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-amber-700 mb-4">
                → {c.status.roadmapLabel}
              </div>
              <ul className="space-y-2.5">
                {c.status.roadmap.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.55] text-rc-text">
                    <span className="text-amber-700 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-bg">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {c.pricing.badge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-4">
            {c.pricing.title}
          </h2>
          <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.65] max-w-[720px] mb-10">
            {c.pricing.subtitle}
          </p>

          <div className="grid md:grid-cols-3 gap-5">
            {c.pricing.tiers.map((tier, i) => (
              <div
                key={i}
                className={`rounded-2xl border bg-rc-surface p-6 md:p-7 flex flex-col ${
                  i === 1 ? 'border-rc-red shadow-[0_8px_28px_rgba(201,58,57,0.08)]' : 'border-rc-border'
                }`}
              >
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-muted mb-3">
                  {tier.range}
                </div>
                <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-rc-text mb-1">
                  {tier.name}
                </h3>
                <div className="text-[13px] text-rc-hint mb-5">{tier.billing}</div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex gap-2.5 text-[13px] leading-[1.55] text-rc-text">
                      <span className="text-rc-red shrink-0">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`mailto:${c.cta.email}?subject=RejectCheck ${tier.name} quote request`}
                  className={`font-mono text-[11px] tracking-[0.12em] uppercase text-center px-5 py-3 rounded-xl no-underline transition-all ${
                    i === 1
                      ? 'bg-rc-red text-white hover:bg-[#b83332]'
                      : 'border border-rc-border text-rc-text hover:border-rc-red hover:text-rc-red'
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              {c.faq.badge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-10">
            {c.faq.title}
          </h2>

          <div className="space-y-3">
            {c.faq.items.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-rc-border bg-rc-surface open:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 px-5 py-4 md:px-6 md:py-5">
                  <h3 className="text-[16px] md:text-[17px] font-semibold text-rc-text leading-[1.35]">
                    {item.question}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="shrink-0 mt-1 font-mono text-[18px] text-rc-red transition-transform group-open:rotate-45 select-none"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 md:px-6 md:pb-6 -mt-1">
                  <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.7]">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-20 md:py-28 text-center">
          <h2 className="text-[28px] md:text-[40px] font-semibold tracking-[-0.02em] mb-5">
            {c.cta.title}
          </h2>
          <p className="text-rc-muted text-[15px] md:text-[17px] leading-[1.65] max-w-[580px] mx-auto mb-8">
            {c.cta.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`mailto:${c.cta.email}?subject=RejectCheck for Teams - inquiry`}
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
            >
              {c.cta.emailLabel}
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M7.5 3l4 4-4 4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            {c.cta.calendlyUrl && (
              <a
                href={c.cta.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 border border-rc-border text-rc-text font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:border-rc-red hover:text-rc-red transition-all duration-200 no-underline"
              >
                {c.cta.calendlyLabel}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[13px] text-rc-muted">{c.footer.copyright}</div>
        <div className="flex gap-6 flex-wrap justify-center">
          <Link
            href={alternativesHref}
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            {c.footer.alternatives}
          </Link>
          <Link
            href={pricingHref}
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            {c.footer.pricing}
          </Link>
          <Link
            href={privacyHref}
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            {c.footer.privacy}
          </Link>
          <Link
            href={analyzeHref}
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            {locale === 'fr' ? 'Analyser mon CV' : 'Analyze my CV'}
          </Link>
        </div>
      </footer>
    </div>
  )
}
