import { describe, expect, it } from 'vitest';
import {
  loadActivity,
  loadSourceRaw,
  loadSourceRows,
  revealByTitle,
} from '../support/activity';

/**
 * Week 1's activity against the extract it was built from.
 *
 * This is the one place the *content* is checked rather than the component, and
 * the only reason it can be: the oracle is `labs_hw/week1_opening-data/JEA
 * Detail.txt`, not the YAML. Reading the answer out of the YAML would prove
 * nothing — see the note in tests/support/activity.ts.
 *
 * It exists because the extract has already been replaced twice, and each time
 * a finding's row list silently stopped describing the data. Nothing in the
 * build catches that; the schema only checks that referenced rows *exist*.
 *
 * The prose inside each `body` still can't be machine-checked. When this file
 * fails, re-read the copy too — the counts in it ("thirty-eight of seventy-two")
 * go stale in exactly the same way.
 */

const doc = loadActivity('week-01');
const source = loadSourceRows();
const bare = (amount: string) => !amount.startsWith('"');

describe('week 1 activity vs. the source extract', () => {
  it('carries every row of the extract, and no others', () => {
    expect(doc.rows).toHaveLength(source.length);
    expect(doc.rows.map((r) => r.number).sort((a, b) => a - b)).toEqual(
      source.map((r) => Number(r.Number)).sort((a, b) => a - b)
    );
  });

  it('reproduces each cell exactly, quoting included', () => {
    const byNumber = new Map(source.map((r) => [Number(r.Number), r]));
    for (const row of doc.rows) {
      const src = byNumber.get(row.number);
      expect(src, `JE ${row.number} is not in the extract`).toBeDefined();
      expect({ ...row, number: undefined }).toEqual({
        number: undefined,
        date: src!.Date,
        period: Number(src!.Period),
        id: src!.ID,
        manual: src!.Manual,
        location: src!.Location,
        amount: src!.Amount, // literal quotes and commas preserved
      });
    }
  });

  it('declares a column for every field it shows', () => {
    const headers = new Set(Object.keys(source[0]).map((h) => h.toLowerCase()));
    for (const col of doc.columns) {
      expect(headers, `column "${col.key}" is not a field in the extract`).toContain(
        col.key.toLowerCase()
      );
    }
  });
});

describe('week 1 findings still describe the data', () => {
  it('the CFO finding covers exactly the CFO2 rows', () => {
    const expected = source.filter((r) => r.ID === 'CFO2').map((r) => Number(r.Number));
    expect(expected.length).toBeGreaterThan(0);
    expect(revealByTitle(doc, 'The CFO hand-keyed the rent').rows?.sort((a, b) => a - b)).toEqual(
      expected.sort((a, b) => a - b)
    );
  });

  it('the formatting finding covers exactly the unquoted amounts', () => {
    const expected = source.filter((r) => bare(r.Amount)).map((r) => Number(r.Number));
    expect(expected.length).toBeGreaterThan(0);
    expect(
      revealByTitle(doc, "One person's numbers are a different shape").rows?.sort((a, b) => a - b)
    ).toEqual(expected.sort((a, b) => a - b));
  });

  it('the unquoted amounts really do all belong to one person', () => {
    // The finding's whole claim. If a refreshed extract spreads bare amounts
    // across users, the copy is wrong even though the row list still matches.
    const posters = new Set(source.filter((r) => bare(r.Amount)).map((r) => r.ID));
    expect(posters.size).toBe(1);
    const [who] = [...posters];
    // ...and that person has no *other* formatting.
    expect(source.filter((r) => r.ID === who).every((r) => bare(r.Amount))).toBe(true);
  });

  it('the one-off user finding covers exactly the single-entry user', () => {
    const counts = new Map<string, number>();
    for (const r of source) counts.set(r.ID, (counts.get(r.ID) ?? 0) + 1);
    const oneOff = [...counts].filter(([, n]) => n === 1).map(([id]) => id);
    expect(oneOff).toHaveLength(1);
    expect(revealByTitle(doc, 'Who is Kayla?').rows).toEqual(
      source.filter((r) => r.ID === oneOff[0]).map((r) => Number(r.Number))
    );
  });

  it('the manual-postings finding covers exactly the manual rows', () => {
    const expected = source.filter((r) => r.Manual === 'Yes').map((r) => Number(r.Number));
    expect(
      revealByTitle(doc, "Half of an automated process isn't automated").rows?.sort((a, b) => a - b)
    ).toEqual(expected.sort((a, b) => a - b));
  });

  it('the clean check is still clean: no gaps, no duplicates, one entry per site-period', () => {
    const numbers = source.map((r) => Number(r.Number)).sort((a, b) => a - b);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(numbers[numbers.length - 1] - numbers[0] + 1).toBe(numbers.length);

    const seen = new Set(source.map((r) => `${r.Location}|${r.Period}`));
    expect(seen.size).toBe(source.length);
  });

  it('the date column is still ambiguous, and Period still resolves it', () => {
    const ambiguous = source.filter((r) => Number(r.Date.split('/')[1]) <= 12);
    expect(ambiguous.length).toBeGreaterThan(0); // else the finding is moot
    for (const r of source) {
      expect(Number(r.Date.split('/')[0]), `JE ${r.Number} month vs period`).toBe(Number(r.Period));
    }
  });

  it('the amount column is still mixed, so it still loads as text', () => {
    const kinds = new Set(source.map((r) => (bare(r.Amount) ? 'bare' : 'quoted')));
    expect(kinds).toEqual(new Set(['bare', 'quoted']));
  });

  it('the padding finding still has padding to describe', () => {
    const { header, rows } = loadSourceRaw();
    expect(header.some((h) => h !== h.trim())).toBe(true);
    expect(rows[0].some((c) => c !== c.trim())).toBe(true);
  });
});
