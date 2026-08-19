import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

/**
 * Loads a week's activity YAML so tests can read its *structure* — how many
 * rows, how many reveals, which rows a named finding covers — instead of
 * restating it as literals.
 *
 * The line to hold: a test may read structure from here, never its expected
 * answer. Asserting "the CFO finding covers the rows the YAML says it covers"
 * proves nothing, because the YAML is the thing under test. Assertions about
 * whether the *content is correct* belong in activity-source.test.ts, whose
 * oracle is the original extract — a genuinely independent source.
 */

const repoFile = (rel: string) => fileURLToPath(new URL(`../../${rel}`, import.meta.url));

export interface ActivityRow {
  number: number;
  date: string;
  period: number;
  id: string;
  manual: string;
  location: string;
  amount: string;
}

export interface ActivityReveal {
  id: string;
  kind: 'finding' | 'clean';
  title: string;
  body: string;
  rows?: number[];
  columns?: string[];
  scored?: boolean;
}

export interface ActivityDoc {
  week: string;
  title: string;
  idKey: string;
  columns: { key: string; label: string; sort?: string }[];
  rows: ActivityRow[];
  reveals: ActivityReveal[];
}

export function loadActivity(week = 'week-01'): ActivityDoc {
  return parse(readFileSync(repoFile(`content/activities/${week}.yaml`), 'utf8')) as ActivityDoc;
}

/** The reveal with this exact title. Throws rather than returning undefined, so
 *  a retitled finding fails loudly instead of silently skipping assertions. */
export function revealByTitle(doc: ActivityDoc, title: string): ActivityReveal {
  const found = doc.reveals.find((r) => r.title === title);
  if (!found) {
    throw new Error(
      `no reveal titled "${title}" — titles are: ${doc.reveals.map((r) => r.title).join(' | ')}`
    );
  }
  return found;
}

/** Rows the scorecard grades against: scored findings only, deduped. */
export function scoredRows(doc: ActivityDoc): number[] {
  const out = new Set<number>();
  for (const r of doc.reveals) {
    if (r.kind !== 'finding' || r.scored === false) continue;
    r.rows?.forEach((n) => out.add(n));
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * The original tab-separated extract the activity was built from, parsed into
 * trimmed fields. This is the independent oracle for content correctness.
 *
 * Fields *and headers* are space-padded in the file, and the working copy can
 * carry CRLF (`.gitattributes` stores LF, checks out native), so both are
 * normalized here — the padding is a finding in its own right, asserted
 * separately rather than relied on for lookups.
 */
export function loadSourceRows(
  rel = 'labs_hw/week1_opening-data/JEA Detail.txt'
): Record<string, string>[] {
  const text = readFileSync(
    fileURLToPath(new URL(`../../../${rel}`, import.meta.url)),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const header = lines[0].split('\t').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split('\t').map((c) => c.trim());
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

/** Raw (unstripped) header and first data line, for asserting the padding itself. */
export function loadSourceRaw(
  rel = 'labs_hw/week1_opening-data/JEA Detail.txt'
): { header: string[]; rows: string[][] } {
  const text = readFileSync(
    fileURLToPath(new URL(`../../../${rel}`, import.meta.url)),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  return {
    header: lines[0].split('\t'),
    rows: lines.slice(1).map((l) => l.split('\t')),
  };
}
