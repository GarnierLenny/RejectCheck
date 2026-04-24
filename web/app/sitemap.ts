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
]

const LANGS = ['en', 'fr'] as const

// English-only routes (no FR version). Emitted without hreflang alternates.
const EN_ONLY_ROUTES: RoutePath[] = []

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
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

  return entries
}
