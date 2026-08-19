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
