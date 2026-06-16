import { expect, test } from '@playwright/test';

const DECK = '/week-03/3-1-vis-overview/';

// Wide viewport so the reinforcement pane (and relocated quiz) exist.
test.use({ viewport: { width: 1280, height: 800 } });

// Playwright CSS locators pierce open shadow roots, so we can target the
// <ai-tutor> internals directly.

test('copy-paste tier builds one prompt with system + context + question', async ({ page }) => {
  await page.goto(`${DECK}?ai-mode=copy-paste&slide=2`);
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-active', '1'); // controller ready

  await page.locator('.launcher').click();
  await page.locator('.composer textarea').fill('How do I start?');
  await page.getByRole('button', { name: 'Build prompt' }).click();

  const out = page.locator('.copy-area');
  await expect(out).toBeVisible();
  const value = await out.inputValue();
  expect(value).toContain('Socratic tutor'); // system prompt
  expect(value).toContain('Slide 2 of 7'); // current-slide context
  expect(value.trimEnd().endsWith('Student: How do I start?')).toBe(true);
});

test('outdated-chrome tier shows an upgrade banner and disables chat', async ({ page }) => {
  await page.goto(`${DECK}?ai-mode=outdated-chrome`);
  await page.locator('.launcher').click();
  await expect(page.locator('.banner')).toBeVisible();
  await expect(page.locator('.composer')).toHaveCount(0); // no chat composer
});

test('seed chips + context track the active slide', async ({ page }) => {
  // Title slide (no self-check) → no self-check chip.
  await page.goto(`${DECK}?ai-mode=copy-paste&slide=1`);
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-active', '0');
  await page.locator('.launcher').click();
  let chips = (await page.locator('.chip').allTextContents()).join(' | ');
  expect(chips).not.toMatch(/self-check/i);

  // Slide with a self-check → the self-check chip appears (chips re-render per slide).
  await page.goto(`${DECK}?ai-mode=copy-paste&slide=2`);
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-active', '1');
  await page.locator('.launcher').click();
  chips = (await page.locator('.chip').allTextContents()).join(' | ');
  expect(chips).toMatch(/self-check/i);
});

test('the tutor element imports nothing from the site (standalone)', async () => {
  // Static guard: the package source must not reference site aliases/paths.
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = new URL('../../packages/ai-tutor/', import.meta.url);
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.ts')) continue;
    const src = readFileSync(new URL(f, dir), 'utf8');
    expect(src, `${f} must not import from the site`).not.toMatch(/@components|@lib|@layout|@islands|src\//);
  }
});
