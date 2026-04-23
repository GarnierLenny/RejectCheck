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
]

const LANGS = ['en', 'fr'] as const

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

  return entries
}
