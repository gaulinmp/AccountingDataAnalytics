import { expect, test } from '@playwright/test';

const ACTIVITY = '/week-01/activity/';

test('the table is complete and readable before any interaction', async ({ page }) => {
  await page.goto(ACTIVITY);
  await expect(page.locator('[data-inspector]')).toBeVisible();
  await expect(page.locator('.ins-table tbody tr')).toHaveCount(30);
  // The reveals ship as <template>s — present in the DOM, rendered by nothing.
  await expect(page.locator('.ins-panel')).toBeHidden();
  await expect(page.getByText('The CFO hand-keyed the rent')).toHaveCount(0);
});

test('flagging a row marks it and survives a reload', async ({ page }) => {
  await page.goto(ACTIVITY);
  const row = page.locator('.ins-table tbody tr[data-row="1023"]');

  await row.click();
  await expect(row).toHaveClass(/is-flagged/);
  await expect(page.locator('.ins-count')).toContainText('1 row flagged');

  await page.reload();
  await expect(page.locator('.ins-table tbody tr[data-row="1023"]')).toHaveClass(/is-flagged/);
});

test('the walk reveals findings in order, then scores', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-table tbody tr[data-row="1023"]').click();

  const panel = page.locator('.ins-panel');
  await page.locator('.ins-btn--primary').click();

  await expect(panel).toBeVisible();
  await expect(panel.locator('.ins-kicker')).toHaveText('Finding 1 of 6');
  await expect(panel.locator('.rv-title')).toHaveText('The CFO hand-keyed the rent');
  // The reveal highlights exactly the rows it names.
  await expect(page.locator('.ins-table tbody tr.is-hit')).toHaveCount(2);

  // Flagging locks once the walk starts.
  await expect(page.locator('[data-inspector]')).toHaveClass(/is-locked/);
  await page.locator('.ins-table tbody tr[data-row="1000"]').click();
  await expect(page.locator('.ins-table tbody tr[data-row="1000"]')).not.toHaveClass(/is-flagged/);

  // Walk the remaining 5 findings, then one more click to reach the scorecard.
  for (let i = 0; i < 6; i++) await page.locator('.ins-btn--primary').click();
  await expect(panel.locator('.ins-kicker')).toHaveText('How you did');
  // 7, not 8: the CFO rows {1023,1028} and the HO rows {1024..1029} share 1028.
  await expect(panel.locator('.ins-summary')).toContainText('You flagged 1 of the 7 rows');
});

test('a column-scoped finding highlights the column, not rows', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-btn--primary').click(); // finding 1
  await page.locator('.ins-btn--primary').click(); // 2
  await page.locator('.ins-btn--primary').click(); // 3
  await page.locator('.ins-btn--primary').click(); // 4 — "Those amounts are not numbers"

  await expect(page.locator('.ins-panel .rv-title')).toHaveText('Those amounts are not numbers');
  await expect(page.locator('.ins-table tbody tr.is-hit')).toHaveCount(0);
  // 30 body cells + the header cell.
  await expect(page.locator('.ins-table [data-col="amount"].is-colhit')).toHaveCount(31);
});

test('the clean check reads as clean, not as a finding', async ({ page }) => {
  await page.goto(ACTIVITY);
  for (let i = 0; i < 6; i++) await page.locator('.ins-btn--primary').click();

  const panel = page.locator('.ins-panel');
  await expect(panel).toHaveAttribute('data-kind', 'clean');
  await expect(panel.locator('.ins-kicker')).toHaveText('Clean check · 6 of 6');
});

test('start over clears flags and returns to the table', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-table tbody tr[data-row="1023"]').click();
  await page.locator('.ins-btn--primary').click();
  await expect(page.locator('.ins-panel')).toBeVisible();

  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.locator('.ins-panel')).toBeHidden();
  await expect(page.locator('.ins-table tbody tr.is-flagged')).toHaveCount(0);
  await expect(page.locator('[data-inspector]')).not.toHaveClass(/is-locked/);
});

test('a week with no activity file keeps the placeholder', async ({ page }) => {
  await page.goto('/week-02/activity/');
  await expect(page.locator('.coming-soon')).toBeVisible();
  await expect(page.locator('[data-inspector]')).toHaveCount(0);
});
