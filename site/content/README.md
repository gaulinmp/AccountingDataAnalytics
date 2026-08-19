# site/content/

All course material lives here, authored as YAML (structure) and MDX (lectures).
This folder is intentionally code-free: you can write a whole course without ever
opening `site/src/`.

```
content/
├─ course.yaml          # the course singleton (title, term, brand, week order)
├─ weeks/               # one YAML file per week        — week-03.yaml
├─ decks/               # one MDX file per lecture       — week-03/lec-data-sources.mdx
├─ activities/          # optional in-class exercise per week — week-01.yaml
└─ quizzes/             # optional standalone quizzes     — *.yaml
```

## Activities (`activities/week-NN.yaml`)

The interactive exercise served at `/week-NN/activity/`. One optional file per
week; a week without one keeps the "coming soon" placeholder. The model is
always the same shape — *here is a small table, flag what deserves a question,
then walk the findings* — so a new week is a data file, not a component.

| Field | Notes |
|-------|-------|
| `week`* | Week id, e.g. `week-01`. Must match a file in `weeks/`. |
| `title`* | Page title (replaces the generic "Activity"). |
| `lede` | One line under the title. |
| `prompt`* | What students do *before* revealing anything. |
| `source` | Provenance note under the table — where the data came from, what was trimmed. |
| `idKey`* | Column whose value identifies a row. Must be numeric and unique. |
| `columns`* | `{ key, label, align: left\|right, mono: bool, sort: text\|number\|date }` — `key` indexes into each row. |
| `rows`* | Objects keyed by column `key`. |
| `reveals`* | The staged walk (below). |
| `closer` | Takeaway shown after the scorecard. |

Each reveal is `{ id, kind, title, body, rows?, columns?, scored? }`:

- **`kind: finding`** — something is off. **`kind: clean`** — a check that
  *passes*. Include at least one `clean`, or the activity teaches that
  skepticism means "everything is fraud".
- **`rows`** (ids from `idKey`) highlights records; **`columns`** (column keys)
  highlights a whole column, for problems that live in the column rather than
  any one row. At least one is required.
- **`scored: false`** keeps a broad pattern finding out of the scorecard, for
  when flagging every covered row was never the ask. Defaults to `true`.
- `body` supports the usual inline formatting only: `**bold**`, `*italic*`,
  `` `code` ``.

A reveal pointing at a row id or column key that doesn't exist **fails the
build**, as does a duplicate `idKey`.

### Transcribe the data exactly, quotes and all

Cell values render verbatim. If the source file writes `"50,000.00"` — quoted,
comma-grouped — then write `'"50,000.00"'` in the YAML (single-quoted, so the
double quotes survive) and the student sees the quotes. **Don't tidy the data on
its way in.** The export's punctuation is usually the evidence: week 1's amounts
are text *because* of those quotes, and the eight rows written `50000` instead
are what expose one user posting through a different route.

The one exception is **whitespace**, which HTML collapses and cannot show
meaningfully. Trim it for display, then say you did — week 1 notes it in `source`
and gives the padding its own reveal, quoting the raw value (`' LA      '`) in
the body. Never silently normalize anything else.

Generate the rows from the real file with a script rather than retyping them,
and re-derive every count in the reveal copy when the data changes. Phrases like
"fifteen of thirty" and lists of row ids go stale the moment the extract is
refreshed, and nothing in the build will catch it.

### Sorting

Clicking a header sorts; clicking again reverses; a third click restores the
file's own order (which is itself information — don't make students hunt for it).
The `sort` hint per column decides how:

- `number` sees past quotes and thousands separators, so `"15,000.00"` orders
  between `"5,000.00"` and `"50,000.00"` rather than lexically. Where a column
  **mixes** machine-readable numbers with formatted text (`50000` alongside
  `"50,000.00"`), the two are kept in separate blocks — numbers first ascending,
  and the whole thing reverses on descending. This mirrors what Excel does with a
  mixed column, and it turns the sort into a diagnostic: the odd rows clump
  instead of hiding among equal values.
- `date` parses `M/D/YYYY`. This is **your assertion as the author, not a
  detection** — if a dataset's dates are genuinely ambiguous, resolve them
  (week 1 uses the Period column) before you declare it.
- `text` is the default and uses natural collation, so `Bob2` precedes `Bob10`.

- **How to write a deck:** see [../README.md](../README.md).
- **The schemas your files are validated against:** `site/src/content.config.ts`.
  A typo'd reference or an out-of-range quiz answer **fails the build**, so you find
  out immediately.
- **How the app reads files here:** via Astro glob loaders with `base: 'content/...'`.
  See [../repo-structure.md](../repo-structure.md).

The actual files are seeded in Stage 1 (one course, one week, one quiz)
and the first real deck in Stage 4.
