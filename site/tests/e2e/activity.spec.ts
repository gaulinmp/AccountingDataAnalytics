import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

const ACTIVITY = '/week-01/activity/';
const REVEALS = 8;

/**
 * Click through the walk until `title` is showing.
 *
 * Deliberately not a fixed click count: the authored order of `reveals:` in
 * week-01.yaml is the instructor's importance ranking and is expected to change,
 * so tests that assert *which* card appears shouldn't also depend on where it
 * sits in the list. Tests that are genuinely about ordering assert positions
 * directly instead.
 */
async function advanceTo(page: Page, title: string): Promise<void> {
  const heading = page.locator('.ins-panel .rv-title');
  for (let i = 0; i < REVEALS; i++) {
    await page.locator('.ins-btn--primary').click();
    if ((await heading.textContent())?.trim() === title) return;
  }
  throw new Error(`"${title}" never appeared in ${REVEALS} steps`);
}

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
  // 1023 is a CFO2 row, so that finding leads and is marked as caught.
  await expect(panel.locator('.ins-kicker')).toHaveText(`You flagged this · Finding 1 of ${REVEALS}`);
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

test('the walk opens on a finding the student actually flagged', async ({ page }) => {
  await page.goto(ACTIVITY);
  // 1064 is one of Laura4's bare-amount rows — not the authored-first finding.
  await page.locator('.ins-table tbody tr[data-row="1064"]').click();
  await page.locator('.ins-btn--primary').click();

  const panel = page.locator('.ins-panel');
  await expect(panel.locator('.rv-title')).toHaveText(
    "One person's numbers are a different shape"
  );
  await expect(panel).toHaveAttribute('data-matched', 'true');
  await expect(panel.locator('.ins-kicker')).toHaveText('You flagged this · Finding 1 of 8');
  await expect(panel.locator('.ins-caught')).toContainText('You flagged 1 of the 8 rows');

  // 1064 is also one of the 38 manual rows, so that broad card is promoted too —
  // but only to second, on a share of 1/38 against Laura4's 1/8.
  await page.locator('.ins-btn--primary').click();
  await expect(panel.locator('.rv-title')).toHaveText(
    "Half of an automated process isn't automated"
  );

  // Everything unflagged follows, and none of it is marked as caught.
  await page.locator('.ins-btn--primary').click();
  await expect(panel).toHaveAttribute('data-matched', 'false');
});

test('more matches outrank fewer, and ties fall back to authored order', async ({ page }) => {
  await page.goto(ACTIVITY);
  // Two CFO2 rows vs one Laura4 row: CFO2 leads despite Laura4 being flagged too.
  for (const n of ['1023', '1035', '1064']) {
    await page.locator(`.ins-table tbody tr[data-row="${n}"]`).click();
  }
  await page.locator('.ins-btn--primary').click();

  const panel = page.locator('.ins-panel');
  await expect(panel.locator('.rv-title')).toHaveText('The CFO hand-keyed the rent');
  await expect(panel.locator('.ins-caught')).toContainText('You flagged 2 of the 3 rows');

  await page.locator('.ins-btn--primary').click();
  await expect(panel.locator('.rv-title')).toHaveText(
    "One person's numbers are a different shape"
  );
});

test('the reordered walk survives a reload mid-way', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-table tbody tr[data-row="1033"]').click(); // Kayla
  await page.locator('.ins-btn--primary').click();
  await expect(page.locator('.ins-panel .rv-title')).toHaveText('Who is Kayla?');

  await page.reload();
  await expect(page.locator('.ins-panel .rv-title')).toHaveText('Who is Kayla?');
  await expect(page.locator('.ins-panel')).toHaveAttribute('data-matched', 'true');
});

test('a sharp finding outranks a broad one caught by a bigger count', async ({ page }) => {
  await page.goto(ACTIVITY);
  // Three rows that sit only in the 38-row "half of these are manual" set,
  // plus one CFO2 row. The broad card has the higher raw count (4 vs 1) but the
  // lower share (4/38 = .11 vs 1/3 = .33), so the sharp finding still leads.
  for (const n of ['1002', '1003', '1004', '1023']) {
    await page.locator(`.ins-table tbody tr[data-row="${n}"]`).click();
  }
  await page.locator('.ins-btn--primary').click();

  const panel = page.locator('.ins-panel');
  await expect(panel.locator('.rv-title')).toHaveText('The CFO hand-keyed the rent');
  await expect(panel.locator('.ins-caught')).toContainText('You flagged 1 of the 3 rows');

  // The broad card is still promoted ahead of everything unflagged.
  await page.locator('.ins-btn--primary').click();
  await expect(panel.locator('.rv-title')).toHaveText(
    "Half of an automated process isn't automated"
  );
});

test('a column-scoped finding highlights the column, not rows', async ({ page }) => {
  await page.goto(ACTIVITY);
  await advanceTo(page, 'Those amounts are not numbers');

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
