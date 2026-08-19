// Pure sorting for the DataInspector table — no DOM — so it unit-tests fast and
// imports cleanly into the island's client script.
//
// The cells hold text exactly as the source file wrote it, quote characters and
// all (that fidelity is the point: `"50,000.00"` is what makes the "amounts are
// not numbers" finding legible). So every comparator has to see past the export's
// punctuation before it can order anything.

export type SortKind = 'text' | 'number' | 'date';

/**
 * Strip the export's wrapping quotes. Commas are *not* touched here — they are a
 * numeric-grouping artifact, and stripping them from a text field would mangle
 * any prose cell that legitimately contains one.
 */
export function unquote(raw: string): string {
  return raw.trim().replace(/^"(.*)"$/s, '$1');
}

const MDY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * Sort key for one cell. Unparseable values return null and are ordered last in
 * both directions, so a stray blank never silently leads the table.
 *
 * `date` assumes M/D/YYYY. That is an *assertion by the activity author*, not a
 * detection — this dataset's dates are genuinely ambiguous (1/5/2024), and the
 * Period column is what resolves them. Declaring `sort: date` is the author
 * saying "I checked". See the date-ambiguity reveal in content/activities/.
 */
export function sortKey(raw: string, kind: SortKind): number | string | null {
  const v = unquote(raw);
  if (v === '') return null;

  if (kind === 'number') {
    const n = Number(v.replace(/,/g, '')); // thousands separators, only here
    return Number.isFinite(n) ? n : null;
  }

  if (kind === 'date') {
    const m = MDY.exec(v);
    if (!m) return null;
    const [, mo, d, y] = m;
    return Date.UTC(Number(y), Number(mo) - 1, Number(d));
  }

  return v.toLowerCase();
}

/**
 * Which block a value belongs to in a `number` column: 0 if a parser reads it as
 * a number as written, 1 if it reads as text.
 *
 * This is what makes a mixed column *show* that it is mixed. `50000` is a number;
 * `"50,000.00"` is a string that happens to contain digits, and no amount of
 * squinting changes that. Sorting keeps the two apart rather than interleaving
 * them by value — which is both what Excel does with a mixed column and the
 * fastest way for a student to see that a "number" column isn't one.
 */
export function numericTier(raw: string): 0 | 1 {
  return Number.isFinite(Number(raw.trim())) ? 0 : 1;
}

/** Compare two raw cell values. Nulls sort last regardless of direction. */
export function compareCells(a: string, b: string, kind: SortKind): number {
  const ka = sortKey(a, kind);
  const kb = sortKey(b, kind);

  if (ka === null && kb === null) return 0;
  if (ka === null) return 1;
  if (kb === null) return -1;

  // Numbers-as-written before numbers-as-text; within a block, by value.
  if (kind === 'number') {
    const ta = numericTier(a);
    const tb = numericTier(b);
    if (ta !== tb) return ta - tb;
  }

  if (typeof ka === 'string' || typeof kb === 'string') {
    return String(ka).localeCompare(String(kb), undefined, {
      numeric: true, // Bob2 before Bob10, not after
      sensitivity: 'base',
    });
  }
  return ka - kb;
}

/**
 * Order a list of rows by one column. Stable: ties keep their prior order, so
 * sorting by Loc then by Date gives Date-within-Loc rather than a reshuffle.
 * Nulls stay last on a descending pass (hence the flip before, not after).
 */
export function sortRows<T>(
  rows: T[],
  cell: (row: T) => string,
  kind: SortKind,
  dir: 'asc' | 'desc'
): T[] {
  const sign = dir === 'desc' ? -1 : 1;
  return rows
    .map((row, i) => ({ row, i }))
    .sort((x, y) => {
      const ka = sortKey(cell(x.row), kind);
      const kb = sortKey(cell(y.row), kind);
      if (ka === null || kb === null) {
        // Null handling is direction-independent, so bypass `sign`.
        if (ka === null && kb === null) return x.i - y.i;
        return ka === null ? 1 : -1;
      }
      const c = compareCells(cell(x.row), cell(y.row), kind);
      return c !== 0 ? c * sign : x.i - y.i;
    })
    .map((w) => w.row);
}
