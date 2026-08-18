import { expect, test } from '@playwright/test';

// Proves the Playwright runner + preview server are wired up.
test('home page loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
});

// The header's home entry — the way back to the week list from anywhere.
test('the header home entry returns to the syllabus', async ({ page }) => {
  await page.goto('/week-01/');
  await page.locator('.home-nav-item').click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('.syllabus .week-row').first()).toBeVisible();
  await expect(page.locator('.home-nav-item')).toHaveAttribute('aria-current', 'page');
});
