import { z } from 'astro/zod';

// Single source of truth for the in-class activity shape (`content/activities/`),
// rendered by <DataInspector> on /week-NN/activity/.
//
// The model is deliberately generic: "here is a small table, flag what deserves
// a question, then walk the findings". Week 1 uses the Lab 1 journal-entry
// extract; later weeks can point it at a dirty ETL pull or a bad join result
// without touching the component.
//
// The `week` reference is attached in content.config.ts (reference() needs
// astro:content, which this file deliberately avoids so it stays cheap to import).

const columnSchema = z.object({
  /** Key into each row object. */
  key: z.string(),
  label: z.string(),
  /** Right-align numerics; default left. */
  align: z.enum(['left', 'right']).default('left'),
  /** Render in the mono face — for codes, amounts, anything column-scannable. */
  mono: z.boolean().default(false),
  /**
   * How clicking this header orders the table. `number` and `date` see past the
   * export's quotes and commas; `date` assumes M/D/YYYY and is an assertion by
   * you, the author, not a detection. See src/lib/activity-sort.ts.
   */
  sort: z.enum(['text', 'number', 'date']).default('text'),
});

const revealSchema = z.object({
  id: z.string(),
  /**
   * `finding` = something is off. `clean` = a check that *passes*, which the
   * activity needs at least one of so "skepticism" doesn't collapse into
   * "everything is fraud".
   */
  kind: z.enum(['finding', 'clean']),
  title: z.string(),
  body: z.string(),
  /** Row ids (values of the table's `idKey` column) this reveal highlights. */
  rows: z.array(z.number()).optional(),
  /** Column keys this reveal highlights — for problems that live in a column, not a row. */
  columns: z.array(z.string()).optional(),
  /**
   * Whether this reveal's rows count toward the scorecard. Set false for broad
   * pattern findings where flagging every covered row was never the ask.
   */
  scored: z.boolean().default(true),
});

/**
 * The field shape, unrefined. content.config.ts extends this with the
 * `week` reference before applying `checkActivity` — hence the split: a
 * `.superRefine()` result is a ZodEffects and can no longer be `.extend()`ed.
 */
export const activityBase = z.object({
  title: z.string(),
  /** One line under the page title. */
  lede: z.string().optional(),
  /** The instruction students act on before revealing anything. */
  prompt: z.string(),
  /** Provenance note — where this table came from, and what was trimmed. */
  source: z.string().optional(),
  /** Column whose value identifies a row (must be numeric and unique). */
  idKey: z.string(),
  columns: z.array(columnSchema).min(1),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1),
  reveals: z.array(revealSchema).min(1),
  /** Closing line shown after the last reveal — the activity's takeaway. */
  closer: z.string().optional(),
});

/** Just the parts the cross-field checks read — so it applies to the extended shape too. */
interface Checkable {
  idKey: string;
  columns: { key: string }[];
  rows: Record<string, string | number>[];
  reveals: { rows?: number[]; columns?: string[] }[];
}

/**
 * Authoring mistakes that would otherwise surface as a silently empty highlight
 * in the browser: a reveal pointing at a row or column that doesn't exist, a
 * duplicate row id, a reveal that highlights nothing. Each fails `astro build`.
 */
export function checkActivity(a: Checkable, ctx: z.RefinementCtx): void {
  const colKeys = new Set(a.columns.map((c) => c.key));
  if (!colKeys.has(a.idKey)) {
    ctx.addIssue({
      code: 'custom',
      message: `idKey "${a.idKey}" is not a declared column`,
      path: ['idKey'],
    });
  }

  const ids = new Set<number>();
  a.rows.forEach((row, i) => {
    const raw = row[a.idKey];
    if (typeof raw !== 'number') {
      ctx.addIssue({
        code: 'custom',
        message: `row is missing a numeric "${a.idKey}"`,
        path: ['rows', i, a.idKey],
      });
      return;
    }
    if (ids.has(raw)) {
      ctx.addIssue({
        code: 'custom',
        message: `duplicate ${a.idKey} ${raw}`,
        path: ['rows', i, a.idKey],
      });
    }
    ids.add(raw);
  });

  a.reveals.forEach((r, i) => {
    if (!r.rows?.length && !r.columns?.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'a reveal must highlight `rows` or `columns`',
        path: ['reveals', i],
      });
    }
    r.rows?.forEach((n) => {
      if (!ids.has(n)) {
        ctx.addIssue({
          code: 'custom',
          message: `reveal targets ${a.idKey} ${n}, which is not in \`rows\``,
          path: ['reveals', i, 'rows'],
        });
      }
    });
    r.columns?.forEach((c) => {
      if (!colKeys.has(c)) {
        ctx.addIssue({
          code: 'custom',
          message: `reveal targets column "${c}", which is not declared`,
          path: ['reveals', i, 'columns'],
        });
      }
    });
  });
}

/** Standalone validator (the collection schema composes the parts itself). */
export const activitySchema = activityBase.superRefine(checkActivity);

// Mirrors activitySchema. (Explicit rather than z.infer, matching quiz.ts — the
// `z` re-export isn't usable as a type namespace, and defaults make infer lie
// about optionality anyway.)
export interface ActivityColumn {
  key: string;
  label: string;
  align: 'left' | 'right';
  mono: boolean;
  sort: 'text' | 'number' | 'date';
}

export interface ActivityReveal {
  id: string;
  kind: 'finding' | 'clean';
  title: string;
  body: string;
  rows?: number[];
  columns?: string[];
  scored: boolean;
}

export interface Activity {
  title: string;
  lede?: string;
  prompt: string;
  source?: string;
  idKey: string;
  columns: ActivityColumn[];
  rows: Record<string, string | number>[];
  reveals: ActivityReveal[];
  closer?: string;
}

/** The rows the scorecard grades against: every scored `finding` reveal's rows. */
export function scoredFindingRows(reveals: ActivityReveal[]): number[] {
  const out = new Set<number>();
  for (const r of reveals) {
    if (r.kind !== 'finding' || !r.scored) continue;
    r.rows?.forEach((n) => out.add(n));
  }
  return [...out].sort((a, b) => a - b);
}
