import { describe, expect, it } from 'vitest';
import { compareCells, sortKey, sortRows, unquote } from '../../src/lib/activity-sort';

describe('unquote', () => {
  it('strips the export\'s wrapping quotes but keeps commas', () => {
    expect(unquote('"50,000.00"')).toBe('50,000.00');
    expect(unquote('"BeanCounter25"')).toBe('BeanCounter25');
    expect(unquote('Laura4')).toBe('Laura4');
  });

  it('leaves commas in text intact — they are not always separators', () => {
    expect(unquote('"Smith, John"')).toBe('Smith, John');
  });

  it('leaves inner quotes alone', () => {
    expect(unquote('a"b')).toBe('a"b');
  });
});

describe('sortKey', () => {
  it('reads quoted, comma-grouped amounts as numbers', () => {
    expect(sortKey('"50,000.00"', 'number')).toBe(50000);
    expect(sortKey('"5,000.00"', 'number')).toBe(5000);
  });

  it('reads M/D/YYYY dates as instants, padded or not', () => {
    expect(sortKey('12/5/2024', 'date')).toBe(Date.UTC(2024, 11, 5));
    expect(sortKey('1/15/2024', 'date')).toBe(Date.UTC(2024, 0, 15));
    // The week 1 extract zero-pads; both forms must land on the same instant.
    expect(sortKey('01/15/2024', 'date')).toBe(sortKey('1/15/2024', 'date'));
    expect(sortKey('01/02/2024', 'date')).toBe(Date.UTC(2024, 0, 2));
  });

  it('returns null for values it cannot read', () => {
    expect(sortKey('', 'number')).toBeNull();
    expect(sortKey('n/a', 'number')).toBeNull();
    expect(sortKey('2024-05-01', 'date')).toBeNull(); // not M/D/YYYY
  });
});

describe('compareCells', () => {
  it('orders quoted, comma-grouped amounts by value within their block', () => {
    expect(compareCells('"5,000.00"', '"50,000.00"', 'number')).toBeLessThan(0);
    expect(compareCells('"50,000.00"', '"15,000.00"', 'number')).toBeGreaterThan(0);
  });

  it('keeps machine-numeric values in a separate block from text ones', () => {
    // 50000 is a number; "50,000.00" is text that looks like one. Equal value,
    // different type — the number leads, and they never interleave.
    expect(compareCells('50000', '"50,000.00"', 'number')).toBeLessThan(0);
    // A large bare number still precedes a small quoted one: block beats value.
    expect(compareCells('50000', '"1,000.00"', 'number')).toBeLessThan(0);
  });

  it('orders dates chronologically', () => {
    expect(compareCells('9/11/2024', '10/11/2024', 'date')).toBeLessThan(0);
    expect(compareCells('1/5/2024', '1/15/2024', 'date')).toBeLessThan(0);
  });

  it('beats text collation across a year boundary', () => {
    // Within one year, numeric collation happens to agree with the calendar —
    // it's the year rollover that separates a real date sort from a clever
    // string sort, so that's what this pins.
    expect(compareCells('12/5/2023', '1/5/2024', 'date')).toBeLessThan(0);
    expect(compareCells('12/5/2023', '1/5/2024', 'text')).toBeGreaterThan(0);
  });

  it('ignores the export\'s quoting when comparing names', () => {
    expect(compareCells('"BeanCounter25"', 'BeanCounter25', 'text')).toBe(0);
  });

  it('sorts Bob2 before Bob10', () => {
    expect(compareCells('Bob2', 'Bob10', 'text')).toBeLessThan(0);
  });

  it('puts unreadable values last in either direction', () => {
    expect(compareCells('', '5', 'number')).toBeGreaterThan(0);
    expect(compareCells('5', '', 'number')).toBeLessThan(0);
  });
});

describe('sortRows', () => {
  const rows = [
    { id: 1, amt: '"50,000.00"', who: 'Laura4' },
    { id: 2, amt: '"5,000.00"', who: '"BeanCounter25"' },
    { id: 3, amt: '"15,000.00"', who: 'Bob2' },
  ];

  it('orders ascending and descending', () => {
    expect(sortRows(rows, (r) => r.amt, 'number', 'asc').map((r) => r.id)).toEqual([2, 3, 1]);
    expect(sortRows(rows, (r) => r.amt, 'number', 'desc').map((r) => r.id)).toEqual([1, 3, 2]);
  });

  it('clusters bare numbers apart from quoted ones, and reverses wholesale', () => {
    const mixed = [
      { id: 1, amt: '"50,000.00"' },
      { id: 2, amt: '1000' }, // bare
      { id: 3, amt: '"1,000.00"' },
      { id: 4, amt: '50000' }, // bare
    ];
    // Ascending: the two bare values first (by value), then the two quoted ones.
    expect(sortRows(mixed, (r) => r.amt, 'number', 'asc').map((r) => r.id)).toEqual([2, 4, 3, 1]);
    // Descending is the exact reverse — blocks flip too, not just their contents.
    expect(sortRows(mixed, (r) => r.amt, 'number', 'desc').map((r) => r.id)).toEqual([1, 3, 4, 2]);
  });

  it('is stable — ties keep their prior order', () => {
    const tied = [
      { id: 1, k: 'a' },
      { id: 2, k: 'a' },
      { id: 3, k: 'a' },
    ];
    expect(sortRows(tied, (r) => r.k, 'text', 'asc').map((r) => r.id)).toEqual([1, 2, 3]);
    expect(sortRows(tied, (r) => r.k, 'text', 'desc').map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it('keeps nulls last even when descending', () => {
    const withGap = [{ id: 1, k: '' }, { id: 2, k: '5' }, { id: 3, k: '9' }];
    expect(sortRows(withGap, (r) => r.k, 'number', 'asc').map((r) => r.id)).toEqual([2, 3, 1]);
    expect(sortRows(withGap, (r) => r.k, 'number', 'desc').map((r) => r.id)).toEqual([3, 2, 1]);
  });

  it('does not mutate the input', () => {
    const before = rows.map((r) => r.id);
    sortRows(rows, (r) => r.amt, 'number', 'desc');
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});
