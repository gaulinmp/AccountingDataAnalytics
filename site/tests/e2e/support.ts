import type { Page } from '@playwright/test';

/** The week deck every spec exercises. One deck per week lives at
 *  /week-NN/slides/ (the per-lecture /week-NN/<deck-slug>/ route is gone).
 *
 *  These three travel together: re-converting week 3 from its PPTX changes the
 *  slide count and can move the quiz, so update them as a set. */
export const DECK = '/week-03/slides/';
/** Total <Slide> blocks in content/decks/week-03/slides.mdx. */
export const DECK_SLIDES = 25;
/** 1-based index of "Central tendency", the slide holding quiz w3-median-vs-mean. */
export const QUIZ_SLIDE = 9;

/** Every week in content/weeks/ carries an `unlockOn` date, and applyLocks
 *  (src/lib/unlock.ts) collapses the week's content with `display: none` until
 *  the visitor's clock passes it. Real dates would make this suite pass or fail
 *  depending on the day it runs — week 3 alone is locked until 2026-09-07 — and
 *  a collapsed ancestor gives every descendant a 0x0 box, which Playwright
 *  reports as "hidden".
 *
 *  So pin the clock past the last unlockOn in the course. Specs that assert the
 *  locked state itself should install their own earlier time instead. */
export const UNLOCKED_TIME = new Date('2027-01-04T12:00:00Z');

export async function unlockWeeks(page: Page) {
  // setFixedTime, not install: install() also swaps in fake timers that never
  // advance on their own, which stalls the deck's smooth-scroll and any
  // setTimeout the islands rely on. All applyLocks needs is Date.now().
  await page.clock.setFixedTime(UNLOCKED_TIME);
}
