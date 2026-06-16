import { expect, test } from '@playwright/test';

const DECK = '/week-03/3-1-vis-overview/';

// Wide viewport so the reinforcement pane (min-width: 901px) is active.
test.use({ viewport: { width: 1280, height: 800 } });

test('keyboard nav + ?slide deep-link track the active slide', async ({ page }) => {
  await page.goto(DECK);
  const deck = page.locator('[data-deck]');
  await expect(deck).toHaveAttribute('data-active', '0');

  await page.keyboard.press('ArrowRight');
  await expect(deck).toHaveAttribute('data-active', '1');
  await expect(page).toHaveURL(/slide=2/);

  await page.keyboard.press('Home');
  await expect(deck).toHaveAttribute('data-active', '0');

  // deep link (0-based data-active = slide - 1)
  await page.goto(`${DECK}?slide=2`);
  await expect(deck).toHaveAttribute('data-active', '1');
});

test('reinforcement pane shows the active slide Key Concept', async ({ page }) => {
  await page.goto(`${DECK}?slide=2`);
  const pane = page.locator('[data-reinforcement]');
  await expect(pane.locator('.rp-label')).toHaveText(/key concept/i);
  await expect(pane.locator('.rp-body')).toContainText('three shapes of source data');
});

test('quiz: check reveals why, persists across reload, hidden before answering', async ({ page }) => {
  await page.goto(`${DECK}?slide=2`); // the quiz lives on slide 2
  const quiz = page.locator('[data-quiz][data-quiz-id="w3-data-shapes"]');
  const feedback = quiz.locator('.quiz__feedback');

  await expect(feedback).toBeHidden(); // why not shown before answering
  await quiz.getByRole('radio', { name: 'A relational database' }).check();
  await quiz.getByRole('button', { name: 'Check answer' }).click();
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveText(/Correct\..*SQL JOINs/);

  // persistence
  await page.reload();
  const quiz2 = page.locator('[data-quiz][data-quiz-id="w3-data-shapes"]');
  await expect(quiz2.getByRole('radio', { name: 'A relational database' })).toBeChecked();
  await expect(quiz2.locator('.quiz__feedback')).toBeVisible();
});

test('paged navigation: only active slide is visible; pager transitions between them', async ({ page }) => {
  await page.goto(DECK);
  const deck = page.locator('[data-deck]');
  await expect(deck).toHaveAttribute('data-active', '0');

  const slides = page.locator('[data-slide]');
  await expect(slides.nth(0)).toBeVisible();
  await expect(slides.nth(1)).toBeHidden();

  // Next pages (active advances, slide visibility toggles).
  await page.locator('.deck-pager__btn[aria-label="Next slide"]').click();
  await expect(deck).toHaveAttribute('data-active', '1');
  await expect(slides.nth(0)).toBeHidden();
  await expect(slides.nth(1)).toBeVisible();

  // Prev pages back to the start.
  await page.locator('.deck-pager__btn[aria-label="Previous slide"]').click();
  await expect(deck).toHaveAttribute('data-active', '0');
  await expect(slides.nth(0)).toBeVisible();
  await expect(slides.nth(1)).toBeHidden();
});

test('no inline onclick handlers anywhere (CSP-friendly)', async ({ page }) => {
  await page.goto(DECK);
  const count = await page.locator('[onclick]').count();
  expect(count).toBe(0);
});

test.describe('no-JS baseline (Stage 4 parity)', () => {
  test.use({ javaScriptEnabled: false });

  test('deck reads with JavaScript disabled and enhancements do not run', async ({ page }) => {
    await page.goto(DECK);
    // Static slide content is present and readable.
    await expect(page.getByText('Which source is queried with SQL?')).toBeVisible();
    await expect(page.getByText('A relational database')).toBeVisible();
    // The controller never runs, so no slide is marked active.
    await expect(page.locator('[data-deck][data-active]')).toHaveCount(0);
    // The quiz stays inline in its slide (never relocated to the pane).
    await expect(page.locator('[data-slide] [data-quiz]')).toHaveCount(1);
  });
});
