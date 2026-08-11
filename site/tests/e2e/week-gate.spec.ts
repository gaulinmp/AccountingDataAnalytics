import { expect, test } from '@playwright/test';

// Week date-gating (src/lib/unlock.ts). A week whose unlockOn has not arrived
// stays *listed* — greyed out, lock-badged, and un-clickable — instead of
// vanishing. The preview clock drives the specs so they never depend on the
// day the suite happens to run: week 1 unlocks 2026-08-24, week 2 on 08-31.
const AFTER_WEEK_1 = '/?preview=2026-08-25';

test('a not-yet-unlocked week stays visible on the home page, marked and disabled', async ({ page }) => {
  await page.goto(AFTER_WEEK_1);

  const locked = page.locator('#week-02');
  await expect(locked).toHaveClass(/is-locked/);
  await expect(locked).toBeVisible();
  await expect(locked.locator('.lock-note')).toHaveText(/Unlocks \w+, \w+ \d+/);

  // Every link in the row is out of reach for pointer, keyboard, and AT.
  const link = locked.locator('.week-title a');
  await expect(link).toHaveAttribute('aria-disabled', 'true');
  await expect(link).toHaveAttribute('tabindex', '-1');
  await expect(link).toHaveCSS('pointer-events', 'none');

  // Even a click that reaches the anchor anyway is swallowed.
  await link.dispatchEvent('click');
  await expect(page).toHaveURL('/');
});

test('an unlocked week reads and behaves normally', async ({ page }) => {
  await page.goto(AFTER_WEEK_1);

  const open = page.locator('#week-01');
  await expect(open).not.toHaveClass(/is-locked/);
  await expect(open.locator('.lock-note')).toBeHidden();

  await open.locator('.week-title a').click();
  await expect(page).toHaveURL(/\/week-01\/?$/);
});

test('the header nav greys locked weeks and eats the click', async ({ page }) => {
  await page.goto(AFTER_WEEK_1);

  const item = page.locator('.week-nav-item[href*="week-02"]');
  await expect(item).toBeVisible();
  await expect(item).toHaveClass(/is-locked/);
  await expect(item).toHaveAttribute('title', /Unlocks \w+, \w+ \d+/);

  // dispatchEvent, not click(): Playwright refuses to click it (aria-disabled),
  // which is the point — this fires the event anyway to prove the guard holds.
  await item.dispatchEvent('click');
  await expect(page).toHaveURL('/');
});

test('?preview=all opens every week', async ({ page }) => {
  await page.goto('/?preview=all');

  await expect(page.locator('.week-row.is-locked')).toHaveCount(0);
  await expect(page.locator('.week-nav-item.is-locked')).toHaveCount(0);

  await page.locator('#week-13 .week-title a').click();
  await expect(page).toHaveURL(/\/week-13\/?$/);
});
