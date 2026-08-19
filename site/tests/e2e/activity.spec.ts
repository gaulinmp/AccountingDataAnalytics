import { expect, test } from '@playwright/test';

const ACTIVITY = '/week-01/activity/';
const REVEALS = 8;

test('the table is complete and readable before any interaction', async ({ page }) => {
  await page.goto(ACTIVITY);
  await expect(page.locator('[data-inspector]')).toBeVisible();
  await expect(page.locator('.ins-table tbody tr')).toHaveCount(72);
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
  await expect(panel.locator('.ins-kicker')).toHaveText(`Finding 1 of ${REVEALS}`);
  await expect(panel.locator('.rv-title')).toHaveText('The CFO hand-keyed the rent');
  // CFO2 posts three of these by hand.
  await expect(page.locator('.ins-table tbody tr.is-hit')).toHaveCount(3);

  // Flagging locks once the walk starts.
  await expect(page.locator('[data-inspector]')).toHaveClass(/is-locked/);
  await page.locator('.ins-table tbody tr[data-row="1002"]').click();
  await expect(page.locator('.ins-table tbody tr[data-row="1002"]')).not.toHaveClass(/is-flagged/);

  // Walk the remaining findings, then one more click to reach the scorecard.
  for (let i = 0; i < REVEALS; i++) await page.locator('.ins-btn--primary').click();
  await expect(panel.locator('.ins-kicker')).toHaveText('How you did');
  // CFO2 (3) + Laura4's bare amounts (8) + Kayla (1) = 12 scored rows.
  await expect(panel.locator('.ins-summary')).toContainText('You flagged 1 of the 12 rows');
});

test('a column-scoped finding highlights the column, not rows', async ({ page }) => {
  await page.goto(ACTIVITY);
  // Findings 1-4 are row-scoped; the 5th is "Those amounts are not numbers".
  for (let i = 0; i < 5; i++) await page.locator('.ins-btn--primary').click();

  await expect(page.locator('.ins-panel .rv-title')).toHaveText('Those amounts are not numbers');
  await expect(page.locator('.ins-table tbody tr.is-hit')).toHaveCount(0);
  // 72 body cells + the header cell.
  await expect(page.locator('.ins-table [data-col="amount"].is-colhit')).toHaveCount(73);
});

test('cells reproduce the file\'s literal quoting', async ({ page }) => {
  await page.goto(ACTIVITY);
  // Most amounts are quoted and comma-grouped; Laura4's eight are bare.
  await expect(
    page.locator('.ins-table tbody tr[data-row="1024"] [data-col="amount"]')
  ).toHaveText('"5,000.00"');
  await expect(
    page.locator('.ins-table tbody tr[data-row="1008"] [data-col="amount"]')
  ).toHaveText('50000');
  await expect(page.locator('.ins-table tbody tr[data-row="1008"] [data-col="id"]')).toHaveText(
    'Laura4'
  );
});

test('headers sort, toggle, and return to file order', async ({ page }) => {
  await page.goto(ACTIVITY);
  const firstRow = () => page.locator('.ins-table tbody tr').first();
  const amountHeader = page.locator('.ins-table thead th[data-col="amount"]');

  await expect(firstRow()).toHaveAttribute('data-row', '1048'); // file order (now chronological)
  await expect(amountHeader).toHaveAttribute('aria-sort', 'none');

  // Ascending leads with the bare (machine-numeric) amounts — Laura4's eight —
  // before every quoted one, so the type split is visible rather than interleaved.
  await amountHeader.locator('button').click();
  await expect(amountHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(firstRow().locator('[data-col="amount"]')).toHaveText('1000');
  await expect(firstRow().locator('[data-col="id"]')).toHaveText('Laura4');

  await amountHeader.locator('button').click();
  await expect(amountHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(firstRow().locator('[data-col="amount"]')).toHaveText('"50,000.00"');

  // Third click restores the order the extract arrived in.
  await amountHeader.locator('button').click();
  await expect(amountHeader).toHaveAttribute('aria-sort', 'none');
  await expect(firstRow()).toHaveAttribute('data-row', '1048');
});

test('dates sort chronologically, not as text', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-table thead th[data-col="date"] button').click();
  const dates = (await page.locator('.ins-table tbody [data-col="date"]').allTextContents()).map(
    (d) => d.trim()
  );
  expect(dates.slice(0, 4)).toEqual(['01/02/2024', '01/02/2024', '01/05/2024', '01/11/2024']);
});

test('sorting by Posted by groups each user contiguously', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-table thead th[data-col="id"] button').click();
  const ids = (await page.locator('.ins-table tbody [data-col="id"]').allTextContents()).map((s) =>
    s.trim()
  );
  // 34 AUTOMATED rows lead, and each user's rows land in one contiguous block.
  expect(ids.slice(0, 34)).toEqual(Array(34).fill('AUTOMATED'));
  expect(new Set(ids.slice(34, 47)).size).toBe(1); // BeanCounter25's 13
});

test('sorting by Amount isolates the eight bare values as one block', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-table thead th[data-col="amount"] button').click();

  const amounts = (
    await page.locator('.ins-table tbody [data-col="amount"]').allTextContents()
  ).map((s) => s.trim());
  const ids = (await page.locator('.ins-table tbody [data-col="id"]').allTextContents()).map((s) =>
    s.trim()
  );

  // The bare-typed values occupy positions 0-7 and nothing else.
  const bare = amounts.map((a, i) => (a.startsWith('"') ? -1 : i)).filter((i) => i >= 0);
  expect(bare).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  // And every one of them is Laura4 — the whole point of the finding.
  expect(new Set(ids.slice(0, 8))).toEqual(new Set(['Laura4']));
});

test('sorting survives the reveal walk and preserves flags', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-table tbody tr[data-row="1023"]').click();
  await page.locator('.ins-btn--primary').click(); // finding 1 highlights the 3 CFO2 rows

  await page.locator('.ins-table thead th[data-col="amount"] button').click();
  await expect(page.locator('.ins-table tbody tr.is-hit')).toHaveCount(3);
  await expect(page.locator('.ins-table tbody tr[data-row="1023"]')).toHaveClass(/is-flagged/);
});

test('the clean check reads as clean, not as a finding', async ({ page }) => {
  await page.goto(ACTIVITY);
  for (let i = 0; i < REVEALS; i++) await page.locator('.ins-btn--primary').click();

  const panel = page.locator('.ins-panel');
  await expect(panel).toHaveAttribute('data-kind', 'clean');
  await expect(panel.locator('.ins-kicker')).toHaveText(`Clean check · ${REVEALS} of ${REVEALS}`);
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
