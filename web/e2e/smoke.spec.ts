import { test, expect } from '@playwright/test';

// Smoke tests: key public pages render without errors. Catches build/runtime
// regressions on routes users see before they sign in.

const PUBLIC_PAGES = ['/', '/en/pricing', '/en/analyze'];

test.describe('Public pages smoke', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} renders successfully`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('response', (res) => {
        if (res.url().includes(path) && res.status() >= 500) {
          errors.push(`${res.status()} on ${res.url()}`);
        }
      });

      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `Status for ${path}`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
      expect(errors, `Page errors on ${path}`).toEqual([]);
    });
  }
});
