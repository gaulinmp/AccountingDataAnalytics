import { describe, expect, it } from 'vitest';
import {
  inspectionSummary,
  matchCount,
  matchShare,
  orderReveals,
  scoreInspection,
} from '../../src/lib/activity-score';
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

describe('orderReveals', () => {
  // Authored order == importance order; index 0 is the most important.
  const set = [
    reveal({ rows: [10, 11] }), // 0
    reveal({ rows: [20, 21, 22] }), // 1
    reveal({ rows: [30] }), // 2
    reveal({ rows: [40, 41], scored: false }), // 3 — broad pattern
    reveal({ columns: ['amount'] }), // 4 — column-scoped
    reveal({ kind: 'clean', columns: ['number'] }), // 5
  ];

  it('keeps authored order when nothing is flagged', () => {
    expect(orderReveals(set, [])).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('leads with a flagged finding', () => {
    expect(orderReveals(set, [30])).toEqual([2, 0, 1, 3, 4, 5]);
  });

  it('ranks by share of the finding caught, not by raw count', () => {
    // #2 matched 1 of 1 row; #1 matched 2 of 3. Fewer rows, bigger share, wins.
    expect(orderReveals(set, [20, 21, 30])).toEqual([2, 1, 0, 3, 4, 5]);
  });

  it('does not let a big finding win on volume alone', () => {
    // #1 (2 of 3 = .67) beats #0 (1 of 2 = .5) despite both being partial.
    expect(orderReveals(set, [10, 20, 21])).toEqual([1, 0, 2, 3, 4, 5]);
  });

  it('breaks ties by authored importance', () => {
    // #0 and #1 both fully caught — the earlier-authored one leads.
    expect(orderReveals(set, [10, 11, 20, 21, 22])).toEqual([0, 1, 2, 3, 4, 5]);
    // Half of #0 and half of #1... #0 is .5, #1 is .33, so no tie there.
    expect(orderReveals(set, [10, 30])).toEqual([2, 0, 1, 3, 4, 5]);
  });

  it('promotes a broad finding only when a real share of it was flagged', () => {
    // One row out of two is half the finding — that earns the front.
    expect(orderReveals(set, [40])).toEqual([3, 0, 1, 2, 4, 5]);
  });

  it('never promotes column-scoped or clean reveals', () => {
    // Shares: #2 = 1/1, #0 = 1/2, #3 = 1/2, #1 = 1/3. #0 and #3 tie and fall
    // back to authored order. #4 and #5 have no rows, so they stay put.
    expect(orderReveals(set, [10, 20, 30, 40])).toEqual([2, 0, 3, 1, 4, 5]);
  });

  it('returns every index exactly once', () => {
    const out = orderReveals(set, [10, 20, 30, 40]);
    expect([...out].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('matchShare', () => {
  it('is the flagged fraction of the finding\'s rows', () => {
    expect(matchShare(reveal({ rows: [1, 2, 3, 4] }), [2, 3])).toBe(0.5);
    expect(matchShare(reveal({ rows: [1] }), [1])).toBe(1);
    expect(matchShare(reveal({ rows: [1, 2] }), [9])).toBe(0);
  });

  it('ignores flags that belong to no finding', () => {
    expect(matchShare(reveal({ rows: [1, 2] }), [1, 7, 8, 9])).toBe(0.5);
  });

  it('is zero where there is nothing to match', () => {
    expect(matchShare(reveal({ columns: ['amount'] }), [1])).toBe(0);
    expect(matchShare(reveal({ rows: [1], kind: 'clean' }), [1])).toBe(0);
  });
});

describe('matchCount', () => {
  it('counts the flagged rows of a finding', () => {
    expect(matchCount(reveal({ rows: [1, 2, 3] }), [2, 3, 9])).toBe(2);
  });

  it('is zero for column-scoped and clean reveals', () => {
    expect(matchCount(reveal({ rows: [1], kind: 'clean' }), [1])).toBe(0);
    expect(matchCount(reveal({ columns: ['amount'] }), [1])).toBe(0);
  });
});
