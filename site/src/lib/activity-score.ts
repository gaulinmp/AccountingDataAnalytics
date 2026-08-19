// Pure scoring for the DataInspector activity — no DOM, no astro:content — so
// it's fast to unit-test and safe to import into the island's client script.
// (The Zod schema lives in activity.ts, which is build-time only.)

export interface InspectionScore {
  /** Flagged rows that a scored finding actually covers. */
  hits: number[];
  /** Scored-finding rows the student never flagged. */
  misses: number[];
  /** Rows the student flagged that no scored finding covers. */
  extras: number[];
  /** Total rows across all scored findings — the denominator. */
  total: number;
}

/**
 * Compare what a student flagged against the rows the scored findings cover.
 *
 * `extras` is deliberately *not* called "false positives": on a JE population
 * a curious flag is rarely wrong, just unexplained, and the activity's copy
 * frames it that way. Don't teach students that asking is a penalty.
 */
export function scoreInspection(flagged: number[], findingRows: number[]): InspectionScore {
  const target = new Set(findingRows);
  const picked = new Set(flagged);
  return {
    hits: [...picked].filter((n) => target.has(n)).sort((a, b) => a - b),
    misses: [...target].filter((n) => !picked.has(n)).sort((a, b) => a - b),
    extras: [...picked].filter((n) => !target.has(n)).sort((a, b) => a - b),
    total: target.size,
  };
}

export interface OrderableReveal {
  kind: 'finding' | 'clean';
  scored: boolean;
  rows?: number[];
}

/**
 * What share of a finding's rows the student flagged, 0..1.
 *
 * The *proportion* matters, not the raw count: week 1's broad "half of these are
 * manual" card covers 38 of 72 rows, so on absolute count it would out-match
 * every sharp finding almost regardless of what the student clicked. Scoring it
 * as 3/38 against the CFO card's 1/3 puts the sharp one first, which is the
 * point — and a broad card still surfaces when someone really did flag a large
 * slice of it, which is exactly when it deserves to.
 */
export function matchShare(reveal: OrderableReveal, flagged: number[]): number {
  const rows = reveal.rows ?? [];
  if (reveal.kind !== 'finding' || rows.length === 0) return 0;
  const picked = new Set(flagged);
  return rows.filter((n) => picked.has(n)).length / rows.length;
}

/**
 * The order the reveals are walked in, as indices into the authored list.
 *
 * Findings the student actually flagged come first, ranked by the share of their
 * rows that were caught, so the walk opens on something they spotted rather than
 * always on the same card. Everything else follows in **authored order**, which
 * is therefore the importance order — reordering the `reveals:` list in the YAML
 * is how an author ranks them, and it also breaks ties between findings the
 * student caught equal proportions of.
 *
 * Column-scoped and `clean` reveals have no rows, so they never promote.
 */
export function orderReveals(reveals: OrderableReveal[], flagged: number[]): number[] {
  return reveals
    .map((r, i) => ({ i, share: matchShare(r, flagged) }))
    .sort((a, b) => b.share - a.share || a.i - b.i)
    .map((m) => m.i);
}

/** How many of a reveal's rows the student flagged — drives the "you caught this" mark. */
export function matchCount(reveal: OrderableReveal, flagged: number[]): number {
  if (reveal.kind !== 'finding') return 0;
  const picked = new Set(flagged);
  return (reveal.rows ?? []).filter((n) => picked.has(n)).length;
}

/** The one-line verdict shown above the scorecard detail. */
export function inspectionSummary(score: InspectionScore): string {
  const { hits, extras, total } = score;
  if (total === 0) return 'Nothing to score on this one — read the findings below.';

  const caught = `You flagged ${hits.length} of the ${total} rows behind the findings`;
  const also =
    extras.length === 0
      ? '.'
      : `, plus ${extras.length} other row${extras.length === 1 ? '' : 's'} worth a question.`;

  if (hits.length === total) return `${caught} — all of them${extras.length ? also : '.'}`;
  if (hits.length === 0)
    return `${caught}${also} The findings below are what an auditor's eye lands on first.`;
  return `${caught}${also}`;
}
