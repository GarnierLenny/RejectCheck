import { MetadataRoute } from 'next'

const AI_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'cohere-ai',
  'Diffbot',
  'FacebookBot',
  'Meta-ExternalAgent',
  'Amazonbot',
  'YouBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: '/api/',
      })),
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
      },
    ],
    sitemap: 'https://www.rejectcheck.com/sitemap.xml',
    host: 'https://www.rejectcheck.com',
  }
}
