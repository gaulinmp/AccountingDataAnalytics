// Pure quiz scoring — no DOM, no astro:content — so it's fast to unit-test and
// safe to import into the QuizCard client script. (The Zod schema + Quiz type
// live in quiz.ts, which is server-only because it imports astro:content.)

export function isAnswerCorrect(selected: number, correct: number): boolean {
  return selected === correct;
}

/** The feedback line shown after answering: verdict + the explanation (`why`). */
export function quizFeedback(selected: number, correct: number, why: string): string {
  return `${isAnswerCorrect(selected, correct) ? 'Correct. ' : 'Not quite. '}${why}`;
}
