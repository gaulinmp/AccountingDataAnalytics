import { expect, test, type Page } from '@playwright/test';
import { loadActivity, revealByTitle, scoredRows } from '../support/activity';

const ACTIVITY = '/week-01/activity/';

// Structure comes from the YAML so that editing week 1 — reordering the
// findings, refreshing the extract — doesn't break tests that were never about
// those numbers. What must NOT come from here is any expected answer: whether a
// finding's rows are the *right* rows is checked in unit/activity-source.test.ts
// against the original extract, which is an independent oracle. See
// tests/support/activity.ts.
const doc = loadActivity('week-01');
const REVEALS = doc.reveals.length;
const ROW_COUNT = doc.rows.length;
const SCORED = scoredRows(doc);

// Titles are the stable handle onto a finding; they're deliberately spelled out
// so retitling one is a decision, not a silent drift. revealByTitle throws if a
// title stops existing.
const CFO = 'The CFO hand-keyed the rent';
const FORMAT = "One person's numbers are a different shape";
const BROAD = "Half of an automated process isn't automated";
const COLUMN_ONLY = 'Those amounts are not numbers';

const cfoRows = revealByTitle(doc, CFO).rows!;
const formatRows = revealByTitle(doc, FORMAT).rows!;
const cleanTitle = doc.reveals.find((r) => r.kind === 'clean')!.title;

/** Click through the walk until `title` shows, so no test depends on a position. */
async function advanceTo(page: Page, title: string): Promise<void> {
  const heading = page.locator('.ins-panel .rv-title');
  for (let i = 0; i < REVEALS; i++) {
    await page.locator('.ins-btn--primary').click();
    if ((await heading.textContent())?.trim() === title) return;
  }
  throw new Error(`"${title}" never appeared in ${REVEALS} steps`);
}

const rowLocator = (page: Page, n: number) => page.locator(`.ins-table tbody tr[data-row="${n}"]`);

test('the table is complete and readable before any interaction', async ({ page }) => {
  await page.goto(ACTIVITY);
  await expect(page.locator('[data-inspector]')).toBeVisible();
  await expect(page.locator('.ins-table tbody tr')).toHaveCount(ROW_COUNT);
  // The reveals ship as <template>s — present in the DOM, rendered by nothing.
  await expect(page.locator('.ins-panel')).toBeHidden();
  await expect(page.getByText(CFO)).toHaveCount(0);
});

test('flagging a row marks it and survives a reload', async ({ page }) => {
  await page.goto(ACTIVITY);
  const row = rowLocator(page, cfoRows[0]);

  await row.click();
  await expect(row).toHaveClass(/is-flagged/);
  await expect(page.locator('.ins-count')).toContainText('1 row flagged');

  await page.reload();
  await expect(rowLocator(page, cfoRows[0])).toHaveClass(/is-flagged/);
});

test('the walk highlights a finding\'s rows, locks flagging, then scores', async ({ page }) => {
  await page.goto(ACTIVITY);
  await rowLocator(page, cfoRows[0]).click();

  const panel = page.locator('.ins-panel');
  await page.locator('.ins-btn--primary').click();

  await expect(panel).toBeVisible();
  await expect(panel.locator('.rv-title')).toHaveText(CFO); // flagged, so promoted
  await expect(page.locator('.ins-table tbody tr.is-hit')).toHaveCount(cfoRows.length);

  // Flagging locks once the walk starts.
  await expect(page.locator('[data-inspector]')).toHaveClass(/is-locked/);
  const unflagged = doc.rows.map((r) => r.number).find((n) => !cfoRows.includes(n))!;
  await rowLocator(page, unflagged).click();
  await expect(rowLocator(page, unflagged)).not.toHaveClass(/is-flagged/);

  for (let i = 0; i < REVEALS; i++) await page.locator('.ins-btn--primary').click();
  await expect(panel.locator('.ins-kicker')).toHaveText('How you did');
  await expect(panel.locator('.ins-summary')).toContainText(`1 of the ${SCORED.length} rows`);
});

test('the walk opens on a finding the student actually flagged', async ({ page }) => {
  await page.goto(ACTIVITY);
  await rowLocator(page, formatRows[0]).click();
  await page.locator('.ins-btn--primary').click();

  const panel = page.locator('.ins-panel');
  await expect(panel.locator('.rv-title')).toHaveText(FORMAT);
  await expect(panel).toHaveAttribute('data-matched', 'true');
  await expect(panel.locator('.ins-kicker')).toContainText('You flagged this');
  await expect(panel.locator('.ins-caught')).toContainText(`1 of the ${formatRows.length} rows`);
});

test('a sharper finding outranks a broad one caught by a bigger count', async ({ page }) => {
  await page.goto(ACTIVITY);
  const broadRows = revealByTitle(doc, BROAD).rows!;
  // Rows that belong only to the broad finding, plus one from the sharp one.
  const broadOnly = broadRows.filter((n) => !cfoRows.includes(n)).slice(0, 3);
  expect(broadOnly.length).toBeGreaterThan(1); // else the comparison is vacuous
  for (const n of [...broadOnly, cfoRows[0]]) await rowLocator(page, n).click();

  await page.locator('.ins-btn--primary').click();
  // Raw count favours the broad card; share favours the sharp one, and wins.
  expect(broadOnly.length + 1).toBeGreaterThan(1);
  expect(cfoRows.length).toBeLessThan(broadRows.length);
  await expect(page.locator('.ins-panel .rv-title')).toHaveText(CFO);
});

test('the reordered walk survives a reload mid-way', async ({ page }) => {
  await page.goto(ACTIVITY);
  await rowLocator(page, formatRows[0]).click();
  await page.locator('.ins-btn--primary').click();
  await expect(page.locator('.ins-panel .rv-title')).toHaveText(FORMAT);

  await page.reload();
  await expect(page.locator('.ins-panel .rv-title')).toHaveText(FORMAT);
  await expect(page.locator('.ins-panel')).toHaveAttribute('data-matched', 'true');
});

test('a column-scoped finding highlights the column, not rows', async ({ page }) => {
  await page.goto(ACTIVITY);
  const cols = revealByTitle(doc, COLUMN_ONLY).columns!;
  await advanceTo(page, COLUMN_ONLY);

  await expect(page.locator('.ins-table tbody tr.is-hit')).toHaveCount(0);
  for (const col of cols) {
    // Every body cell of the column, plus its header.
    await expect(page.locator(`.ins-table [data-col="${col}"].is-colhit`)).toHaveCount(
      ROW_COUNT + 1
    );
  }
});

test('cells reproduce the file\'s literal quoting', async ({ page }) => {
  await page.goto(ACTIVITY);
  // Taken from the YAML as *rendering* expectations; whether the YAML matches
  // the extract is unit/activity-source.test.ts's job, not this one's.
  const quoted = doc.rows.find((r) => r.amount.startsWith('"'))!;
  const barePlain = doc.rows.find((r) => !r.amount.startsWith('"'))!;
  expect(quoted && barePlain).toBeTruthy();

  await expect(rowLocator(page, quoted.number).locator('[data-col="amount"]')).toHaveText(
    quoted.amount
  );
  await expect(rowLocator(page, barePlain.number).locator('[data-col="amount"]')).toHaveText(
    barePlain.amount
  );
});

test('headers sort, toggle, and return to file order', async ({ page }) => {
  await page.goto(ACTIVITY);
  const firstRow = () => page.locator('.ins-table tbody tr').first();
  const header = page.locator('.ins-table thead th[data-col="amount"]');
  const fileFirst = String(doc.rows[0].number);

  await expect(firstRow()).toHaveAttribute('data-row', fileFirst);
  await expect(header).toHaveAttribute('aria-sort', 'none');

  await header.locator('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await header.locator('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');

  // Third click restores the order the extract arrived in.
  await header.locator('button').click();
  await expect(header).toHaveAttribute('aria-sort', 'none');
  await expect(firstRow()).toHaveAttribute('data-row', fileFirst);
});

test('sorting orders dates chronologically and amounts by value', async ({ page }) => {
  await page.goto(ACTIVITY);
  const val = (a: string) => Number(a.replace(/[",]/g, ''));

  await page.locator('.ins-table thead th[data-col="date"] button').click();
  const dates = (await page.locator('.ins-table tbody [data-col="date"]').allTextContents()).map(
    (d) => d.trim()
  );
  const asInstant = (d: string) => {
    const [m, day, y] = d.split('/').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  expect(dates.map(asInstant)).toEqual([...dates.map(asInstant)].sort((a, b) => a - b));

  await page.locator('.ins-table thead th[data-col="amount"] button').click();
  const amounts = (
    await page.locator('.ins-table tbody [data-col="amount"]').allTextContents()
  ).map((a) => a.trim());
  // Within each type block, values ascend.
  const bareVals = amounts.filter((a) => !a.startsWith('"')).map(val);
  const quotedVals = amounts.filter((a) => a.startsWith('"')).map(val);
  expect(bareVals).toEqual([...bareVals].sort((a, b) => a - b));
  expect(quotedVals).toEqual([...quotedVals].sort((a, b) => a - b));
});

test('a mixed-type amount column sorts as two blocks, not interleaved', async ({ page }) => {
  await page.goto(ACTIVITY);
  await page.locator('.ins-table thead th[data-col="amount"] button').click();
  const amounts = (
    await page.locator('.ins-table tbody [data-col="amount"]').allTextContents()
  ).map((a) => a.trim());

  const bareCount = doc.rows.filter((r) => !r.amount.startsWith('"')).length;
  expect(bareCount).toBeGreaterThan(0);
  // The machine-numeric values occupy the leading positions and nothing else.
  const barePositions = amounts.map((a, i) => (a.startsWith('"') ? -1 : i)).filter((i) => i >= 0);
  expect(barePositions).toEqual([...Array(bareCount).keys()]);
});

test('sorting survives the reveal walk and preserves flags', async ({ page }) => {
  await page.goto(ACTIVITY);
  await rowLocator(page, cfoRows[0]).click();
  await page.locator('.ins-btn--primary').click();

  await page.locator('.ins-table thead th[data-col="amount"] button').click();
  await expect(page.locator('.ins-table tbody tr.is-hit')).toHaveCount(cfoRows.length);
  await expect(rowLocator(page, cfoRows[0])).toHaveClass(/is-flagged/);
});

test('the clean check reads as clean, not as a finding', async ({ page }) => {
  await page.goto(ACTIVITY);
  await advanceTo(page, cleanTitle);

  const panel = page.locator('.ins-panel');
  await expect(panel).toHaveAttribute('data-kind', 'clean');
  await expect(panel.locator('.ins-kicker')).toContainText('Clean check');
});

test('Back steps through the walk in reverse', async ({ page }) => {
  await page.goto(ACTIVITY);
  const title = page.locator('.ins-panel .rv-title');
  const backBtn = page.getByRole('button', { name: 'Back' });

  // Absent until the walk starts.
  await expect(backBtn).toBeHidden();
  await page.locator('.ins-btn--primary').click();
  await expect(backBtn).toBeVisible();
  // Inert on the first card: going further back would unlock flagging.
  await expect(backBtn).toBeDisabled();

  const first = await title.textContent();
  await page.locator('.ins-btn--primary').click();
  const second = await title.textContent();
  expect(second).not.toBe(first);
  await expect(backBtn).toBeEnabled();

  await backBtn.click();
  await expect(title).toHaveText(first!.trim());
  await expect(backBtn).toBeDisabled();

  // Flagging stays locked the whole way back.
  await expect(page.locator('[data-inspector]')).toHaveClass(/is-locked/);
});

test('Back returns from the scorecard to the last finding', async ({ page }) => {
  await page.goto(ACTIVITY);
  // From a cold start: one click to open the walk, then one per remaining card.
  for (let i = 0; i < REVEALS + 1; i++) await page.locator('.ins-btn--primary').click();
  await expect(page.locator('.ins-panel .ins-kicker')).toHaveText('How you did');

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.locator('.ins-panel .rv-title')).toHaveText(cleanTitle);
  await expect(page.locator('.ins-panel')).toHaveAttribute('data-kind', 'clean');
});

test('start over clears flags and returns to the table', async ({ page }) => {
  await page.goto(ACTIVITY);
  await rowLocator(page, cfoRows[0]).click();
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
