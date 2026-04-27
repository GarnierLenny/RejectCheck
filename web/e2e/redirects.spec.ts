import { test, expect } from '@playwright/test'

test.describe('Redirects SEO', () => {
  test('/analyse redirige en 301 vers /fr/analyze', async ({ request }) => {
    const response = await request.get('/analyse', { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(response.headers()['location']).toContain('/fr/analyze')
  })

  test('/analyse/sub-path préserve le path après redirect 301', async ({ request }) => {
    const response = await request.get('/analyse/sub-path', { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(response.headers()['location']).toContain('/fr/analyze/sub-path')
  })
})
