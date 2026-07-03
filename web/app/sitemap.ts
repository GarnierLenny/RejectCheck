import { MetadataRoute } from 'next'

const BASE_URL = 'https://rejectcheck.com'

type RoutePath = {
  path: string
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority: number
}

const ROUTES: RoutePath[] = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/analyze', changeFrequency: 'daily', priority: 0.9 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.3 },
  // B2B page (bilingual EN+FR)
  { path: '/for-teams', changeFrequency: 'monthly', priority: 0.75 },
  // Alternatives hub page (bilingual EN+FR)
  { path: '/alternatives', changeFrequency: 'weekly', priority: 0.75 },
  // All alternatives pages are bilingual EN+FR
  { path: '/alternatives/jobscan', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/alternatives/rezi', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/alternatives/resume-worded', changeFrequency: 'monthly', priority: 0.7 },
  // SEO product landings — now bilingual EN+FR (target EN: "ats checker",
  // "resume checker"; FR: "test cv ats", "checker de cv", "revue de cv")
  { path: '/ats-checker', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/resume-checker', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/software-engineer-cv', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/cv-review', changeFrequency: 'monthly', priority: 0.85 },
  // Named-frameworks / method page — bilingual EN+FR (AIO attribution surface)
  { path: '/methode', changeFrequency: 'monthly', priority: 0.7 },
  // Guides hub + long-form guides — bilingual EN+FR (AIO / LLM citation)
  { path: '/guides', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/guides/how-to-pass-ats', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/guides/why-developers-get-rejected', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/guides/software-engineer-resume-tips', changeFrequency: 'monthly', priority: 0.7 },
]

const LANGS = ['en', 'fr'] as const

// English-only routes (no FR version). Currently none — every SEO page is
// bilingual. Kept for future EN-only pages; emitted without hreflang alternates.
const EN_ONLY_ROUTES: RoutePath[] = []

// French-only routes (no EN version — native FR slug, EN intent covered
// elsewhere). Emitted under /fr with x-default pointing at the FR URL.
const FR_ONLY_ROUTES: RoutePath[] = [
  // FR dev-resume pillar (target: "cv développeur", "analyse cv développeur")
  { path: '/cv-developpeur', changeFrequency: 'monthly', priority: 0.8 },
]

// Fixed content-revision date. Using `new Date()` here stamps every URL with
// the build time on each deploy, which reads as fake freshness to crawlers.
// Bump this only when the marketing/content pages actually change.
const LAST_CONTENT_REVISION = new Date('2026-07-03T00:00:00Z')

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = LAST_CONTENT_REVISION
  const entries: MetadataRoute.Sitemap = []

  for (const route of ROUTES) {
    const enUrl = `${BASE_URL}/en${route.path}`
    const frUrl = `${BASE_URL}/fr${route.path}`

    for (const lang of LANGS) {
      entries.push({
        url: `${BASE_URL}/${lang}${route.path}`,
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            en: enUrl,
            fr: frUrl,
            'x-default': enUrl,
          },
        },
      })
    }
  }

  for (const route of EN_ONLY_ROUTES) {
    const url = `${BASE_URL}/en${route.path}`
    entries.push({
      url,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          en: url,
          'x-default': url,
        },
      },
    })
  }

  for (const route of FR_ONLY_ROUTES) {
    const url = `${BASE_URL}/fr${route.path}`
    entries.push({
      url,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          fr: url,
          'x-default': url,
        },
      },
    })
  }

  return entries
}
