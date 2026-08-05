import { expect, test } from '@playwright/test';
import { DECK, QUIZ_SLIDE, unlockWeeks } from './support';

// Wide viewport so the reinforcement aside (min-width: 1100px) is active.
test.use({ viewport: { width: 1280, height: 800 } });

// Week 3 is date-gated until 2026-09-07; without this the deck renders inside a
// display:none WeekLock and every visibility assertion below fails. See support.ts.
test.beforeEach(async ({ page }) => {
  await unlockWeeks(page);
});

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

test('reinforcement aside shows the active slide Key Concept', async ({ page }) => {
  await page.goto(`${DECK}?slide=2`);
  const pane = page.locator('[data-reinforcement]');
  await expect(pane.locator('.rp-label')).toHaveText(/key concept/i);
  await expect(pane.locator('.rp-body')).toContainText('location, spread, and shape');
  // On a wide screen the key concept lives in the aside, not the slide.
  await expect(page.locator('[data-deck-aside] .slide__key-concept')).toBeVisible();
  await expect(page.locator('[data-slide].is-active .slide__key-concept')).toHaveCount(0);
});

test('quiz relocates to the aside, collapses, and remembers the preference', async ({ page }) => {
  await page.goto(`${DECK}?slide=${QUIZ_SLIDE}`);
  const details = page.locator('[data-aside-quiz]');
  const quiz = page.locator('[data-deck-aside] [data-quiz][data-quiz-id="w3-median-vs-mean"]');
  await expect(quiz).toBeVisible(); // expanded by default

  await details.locator('summary').click();
  await expect(quiz).toBeHidden();

  // <details> collapses synchronously but fires `toggle` on a later task, and
  // that handler is what writes the preference. Wait for the write itself —
  // reloading on "visually hidden" alone can outrun it.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('acctg5150:aside-quiz-open')))
    .toBe('0');

  await page.reload(); // collapse preference persists (localStorage)
  await expect(page.locator('[data-aside-quiz][open]')).toHaveCount(0);

  // Paging away and back: the quiz follows the active slide.
  await page.keyboard.press('ArrowLeft');
  await expect(quiz).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-deck-aside] [data-quiz]')).toHaveCount(1);
});

test('quiz: check reveals why, persists across reload, hidden before answering', async ({ page }) => {
  await page.goto(`${DECK}?slide=${QUIZ_SLIDE}`);
  const quiz = page.locator('[data-quiz][data-quiz-id="w3-median-vs-mean"]');
  const feedback = quiz.locator('.quiz__feedback');

  await expect(feedback).toBeHidden(); // why not shown before answering
  await quiz.getByRole('radio', { name: 'The median (middle value)' }).check();
  await quiz.getByRole('button', { name: 'Check answer' }).click();
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveText(/Correct\..*50th percentile/);

  // persistence
  await page.reload();
  const quiz2 = page.locator('[data-quiz][data-quiz-id="w3-median-vs-mean"]');
  await expect(quiz2.getByRole('radio', { name: 'The median (middle value)' })).toBeChecked();
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

test.describe('narrow viewport (no aside)', () => {
  test.use({ viewport: { width: 800, height: 900 } });

  test('key concept and quiz stay inline in the slide', async ({ page }) => {
    await page.goto(`${DECK}?slide=${QUIZ_SLIDE}`);
    await expect(page.locator('[data-slide].is-active [data-quiz]')).toHaveCount(1);
    await expect(page.locator('[data-slide].is-active .slide__key-concept')).toBeVisible();
    await expect(page.locator('[data-deck-aside]')).toBeHidden();
  });
});

test.describe('no-JS baseline (Stage 4 parity)', () => {
  test.use({ javaScriptEnabled: false });

  test('deck reads with JavaScript disabled and enhancements do not run', async ({ page }) => {
    await page.goto(DECK);
    // Static slide content is present and readable.
    await expect(page.getByText('which metric best represents')).toBeVisible();
    await expect(page.getByText('The median (middle value)')).toBeVisible();
    // The controller never runs, so no slide is marked active.
    await expect(page.locator('[data-deck][data-active]')).toHaveCount(0);
    // Quizzes stay inline in their slides (never relocated to the aside).
    await expect(page.locator('[data-slide] [data-quiz]')).toHaveCount(6);
    await expect(page.locator('[data-deck-aside] [data-quiz]')).toHaveCount(0);
  });
});
