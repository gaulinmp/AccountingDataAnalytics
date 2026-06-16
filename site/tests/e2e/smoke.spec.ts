import { expect, test } from '@playwright/test';

// Proves the Playwright runner + preview server are wired up.
test('home page loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
});
