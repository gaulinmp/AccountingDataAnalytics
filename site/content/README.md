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
| `columns`* | `{ key, label, align: left\|right, mono: bool }` — `key` indexes into each row. |
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

- **How to write a deck:** see [../README.md](../README.md).
- **The schemas your files are validated against:** `site/src/content.config.ts`.
  A typo'd reference or an out-of-range quiz answer **fails the build**, so you find
  out immediately.
- **How the app reads files here:** via Astro glob loaders with `base: 'content/...'`.
  See [../repo-structure.md](../repo-structure.md).

The actual files are seeded in Stage 1 (one course, one week, one quiz)
and the first real deck in Stage 4.
