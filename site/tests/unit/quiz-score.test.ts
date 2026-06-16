import { describe, expect, it } from 'vitest';
import { isAnswerCorrect, quizFeedback } from '../../src/lib/quiz-score';

describe('quiz scoring', () => {
  it('scores the selected option against the correct index', () => {
    expect(isAnswerCorrect(1, 1)).toBe(true);
    expect(isAnswerCorrect(0, 1)).toBe(false);
    expect(isAnswerCorrect(2, 1)).toBe(false);
  });

  it('composes feedback: verdict + the why', () => {
    expect(quizFeedback(1, 1, 'Because SQL.')).toBe('Correct. Because SQL.');
    expect(quizFeedback(0, 1, 'Because SQL.')).toBe('Not quite. Because SQL.');
  });
});
