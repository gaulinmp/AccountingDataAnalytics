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
