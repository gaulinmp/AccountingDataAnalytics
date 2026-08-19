import { describe, expect, it } from 'vitest';
import { inspectionSummary, scoreInspection } from '../../src/lib/activity-score';
import { scoredFindingRows, type ActivityReveal } from '../../src/lib/activity';

const reveal = (p: Partial<ActivityReveal>): ActivityReveal => ({
  id: 'r',
  kind: 'finding',
  title: 't',
  body: 'b',
  scored: true,
  ...p,
});

describe('scoreInspection', () => {
  it('splits flags into hits, misses and extras', () => {
    const s = scoreInspection([1023, 1028, 1018], [1023, 1024, 1028]);
    expect(s.hits).toEqual([1023, 1028]);
    expect(s.misses).toEqual([1024]);
    expect(s.extras).toEqual([1018]);
    expect(s.total).toBe(3);
  });

  it('handles flagging nothing', () => {
    const s = scoreInspection([], [1023, 1028]);
    expect(s.hits).toEqual([]);
    expect(s.misses).toEqual([1023, 1028]);
    expect(s.total).toBe(2);
  });

  it('handles flagging everything', () => {
    const s = scoreInspection([1, 2, 3], [2]);
    expect(s.hits).toEqual([2]);
    expect(s.misses).toEqual([]);
    expect(s.extras).toEqual([1, 3]);
  });

  it('de-duplicates and sorts', () => {
    const s = scoreInspection([3, 1, 3], [1, 2]);
    expect(s.hits).toEqual([1]);
    expect(s.extras).toEqual([3]);
    expect(s.misses).toEqual([2]);
  });
});

describe('inspectionSummary', () => {
  it('calls out a clean sweep', () => {
    expect(inspectionSummary(scoreInspection([1, 2], [1, 2]))).toMatch(/all of them/);
  });

  it('mentions extra flags without calling them wrong', () => {
    const line = inspectionSummary(scoreInspection([1, 9], [1]));
    expect(line).toMatch(/1 other row worth a question/);
    expect(line).not.toMatch(/wrong|incorrect|false/i);
  });

  it('pluralises extras', () => {
    expect(inspectionSummary(scoreInspection([1, 8, 9], [1]))).toMatch(/2 other rows/);
  });

  it('degrades when there is nothing to score', () => {
    expect(inspectionSummary(scoreInspection([], []))).toMatch(/Nothing to score/);
  });
});

describe('scoredFindingRows', () => {
  it('unions rows from scored findings only', () => {
    const rows = scoredFindingRows([
      reveal({ rows: [1023, 1028] }),
      reveal({ rows: [1024, 1028] }),
      reveal({ rows: [1000], scored: false }), // broad pattern — not graded
      reveal({ rows: [1001], kind: 'clean' }), // a passing check — not graded
      reveal({ columns: ['amount'] }), // column-scoped — unflaggable
    ]);
    expect(rows).toEqual([1023, 1024, 1028]);
  });

  it('is empty when nothing is scored', () => {
    expect(scoredFindingRows([reveal({ rows: [1], scored: false })])).toEqual([]);
  });
});
