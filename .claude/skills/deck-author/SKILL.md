---
name: deck-author
description: >-
  Author or edit ACCTG 5150 "Accounting Analytics" course content in the Astro site
  under site/content/ — MDX lecture decks (slides), week-NN.yaml metadata, and inline
  <Quiz> blocks. Use whenever the user asks to create, draft, write, scaffold, or revise
  a deck, lecture, slide, week, or quiz for this course (e.g. "make a deck for week 6 on
  ETL", "add a slide about joins", "scaffold week 11"). Knows the component library,
  frontmatter schema, and the course's audience, arc, and teaching style.
---

# Authoring ACCTG 5150 decks

You are writing course content for **Accounting Analytics (ACCTG 5150)**, University of
Utah, taught by Maclean Gaulin. Content is authored as MDX decks and YAML metadata in the
Astro site. Your job is to produce slides that are **build-valid on the first try** and
**pedagogically consistent** with the rest of the course.

## Scope — one hard rule

**Only ever edit files under `site/content/`.** Never touch `site/src/`. The `src/` tree
(components, schema, icons) is canonical and read-only for authoring. If a task seems to
require a new component, a new icon, or a schema change, stop and tell the user — that is a
`src/` change outside authoring scope, not something to work around by inventing props.

The content hierarchy:

```
course.yaml                          (the course singleton — don't edit casually)
└── content/weeks/week-NN.yaml       (week metadata: title, summary, objectives)
    ├── content/decks/week-NN/slides.mdx     (the week's single monolithic deck)
    │   └── <Slide> … <Quiz> …       (slides and their self-checks live in the deck body)
    └── content/activities/week-NN.yaml      (optional in-class exercise → /week-NN/activity/)
```

**One deck per week**, always named `slides.mdx` (served at `/week-NN/slides/`). Former
per-lecture decks live on as *sections* inside it: each section opens with a
`<Slide variant="title" kicker="Week N · Part M">` divider slide carrying the section
title. To add a new lecture's material, append a new divider + its slides to the week's
`slides.mdx` rather than creating a new file.

### Provenance: these decks are generated from PowerPoint

A week's `slides.mdx` is initially extracted from the UG lecture deck
`slides/**/{N}-UG-{Title}.pptx` by the **`pptx-to-deck`** skill, then edited by hand.
Two consequences for authoring:

- **`key=`, `aiNotes=`, and `<Quiz>` survive a re-conversion** — the converter harvests
  them from the existing deck and re-attaches them by matching slide title. Authoring
  them is safe and durable.
- **Structural work does not survive.** A `ThreeCol` you built from flat bullets, a
  reordered slide, a rewritten title — all regenerated away if the week is re-imported.
  Titles are the join key, so **renaming a slide orphans its quiz and key.** If you're
  about to re-import a week, read `pptx-to-deck` first.

Editing a deck that has no upstream change pending? None of this applies — just author.

## Workflow for a new deck (or week)

1. **Read the week's objectives.** Open `site/content/weeks/week-NN.yaml` and read
   `title`, `summary`, `objectives`. **The deck must teach to those objectives.** If the
   week file doesn't exist yet, create it first (schema below).
2. **Read the pedagogy guide** in [references/course-context.md](references/course-context.md)
   — audience, course arc, voice/tone, and the recurring teaching patterns. This is the part
   of the brief that isn't written down anywhere in the repo.
3. **Read 1–2 real exemplar decks** from a neighboring week to match rhythm and density
   before writing (see the exemplar list in the pedagogy guide).
4. **Draft the slides.** Use the component cheatsheet below. One concept per slide. For any
   prop detail not in the cheatsheet, open the canonical source rather than guessing.
5. **Validate** with the build (see "Validation" — required before you claim done).

## Frontmatter schema (deck `.mdx`)

Source of truth: [site/src/content.config.ts](../../../site/src/content.config.ts). `*` = required.

| Field         | Type            | Notes |
|---------------|-----------------|-------|
| `week`*       | string ref      | The week id, e.g. `week-09`. Must match an existing `content/weeks/week-NN.yaml`. |
| `title`*      | string          | Deck title (breadcrumb + present mode). |
| `subtitle`    | string          | One-line framing. |
| `instructors` | string[]        | Overrides the course-level instructor list for this deck. |
| `date`        | date            | Lecture date (coerced from `YYYY-MM-DD`). |
| `estMinutes`  | number          | Estimated length. |
| `topic`       | string          | Subject label sent to the AI tutor as context on every slide; a `<Slide topic>` overrides it. |
| `aiPrompt`    | string          | Per-deck addendum appended to the AI tutor's system prompt. |

## Week metadata schema (`content/weeks/week-NN.yaml`)

| Field         | Type     | Notes |
|---------------|----------|-------|
| `number`*     | integer  | Week number. |
| `title`*      | string   | Week title. |
| `navLabel`    | string   | Short label under the header-nav icon (e.g. `"Viz"`). |
| `icon`        | string   | Header-nav icon name — must exist in `src/lib/icons.ts` (build-validated). |
| `summary`     | string   | One-line summary (shown in nav). |
| `description` | string   | Paragraph intro (YAML block scalar `|`). |
| `objectives`  | string[] | Learning objectives — **decks teach to these.** |
| `unlockOn`    | date     | Optional date-gate (`2026-09-14`). Before it, the week is greyed out and un-clickable in the nav and home syllabus, with an "Unlocks …" note; the week's own pages still render at their URLs. Client-side clock check only — intentionally not secure. A bare date unlocks at midnight UTC (the evening before, Mountain Time). |

## Component cheatsheet

Import only what you use, from the barrel:

```mdx
import { Slide, Bullets, Quiz } from '@components/blocks';
```

**One `<Slide>` = one slide.** Wrap every slide in `<Slide>`; there are no `---` separators.

| Component | What it is | Key props | Reach for it when… |
|-----------|------------|-----------|--------------------|
| `Slide` | The slide container (required wrapper) | `variant="title"` (cover) \| default; `title`; `kicker`; `icon`; `key` (Key-Concept line in side pane); `topic` (per-slide AI-tutor context); `aiNotes` (instructor notes for the AI tutor only — misconceptions, worked-solution steps; never rendered on the slide) | every slide |
| `Bullets` | Nested bullet list from data | `items={[{ l: 1, h: "text" }]}` — `l`=indent 1–4, `h`=inline text | the default body for most slides |
| `ThreeCol` | Three comparison cards | `cols={[{ title?, body }]}` | 3 parallel categories/options |
| `TwoColumn` | Two-column layout (`left`/`right` slots) | `ratio="1-1"\|"1-2"\|"2-1"` | code beside explanation; compare two things |
| `CardGrid` | Responsive card grid (slotted children) | `min` (min card width) | a flexible set of cards |
| `FullBleed` | Full-width emphasis band (slotted) | `tone="default"\|"brand"\|"muted"` | a single high-emphasis statement |
| `DataTable` | Striped HTML table | `columns={[]}`, `rows={[[]]}`, `caption?` | showing example data / comparisons |
| `CodeBlock` | Static code frame | `code`, `lang?`, `title?` | showing Python/SQL code (no live exec) |
| `SqlWalk` | SQL query + clause-by-clause walkthrough | `sql`, `rows={[{ clause, desc }]}` | teaching a SQL statement |
| `JoinCompare` | Input tables → joined result | `inputs={[{title, items[]}]}`, `result={…}`, `caption?` | explaining a JOIN / merge |
| `Schema` | Relational schema with PK/FK badges | `tables={[{ name, columns:[{name, pk?, fk?}] }]}` | showing table structure / keys |
| `ImageCaption` | Image + caption | `src`, `alt`, `caption?` | a figure (chart screenshot, diagram) |
| `ChartPane` | Framed container for a chart (slotted) | `title?`, `caption?` | wrapping an embedded visual |
| `Demo` | Worked-example callout (slotted) | `title?`, `icon?` | a live demo / worked example |
| `Cta` | Link button | `label`, `href` | sending students to a lab/tool/resource |
| `Quiz` | Inline multiple-choice self-check | `id`, `q`, `opts[]`, `correct`, `why` | a check-for-understanding (see rules) |
| `CoverMeta` | Instructor/date/duration block | `instructors?`, `date?`, `estMinutes?` | on the title slide |

**Hard rules:**

- **Inline formatting inside string props** (`Bullets` `h`, `ThreeCol`/`JoinCompare` body,
  `SqlWalk` `desc`, etc.) supports **only** `**bold**`, `*italic*`, and `` `code` ``. It is
  **not Markdown** — no links, lists, or headings inside a string. Use the dedicated
  component for those.
- **Icons** are a fixed union in [site/src/lib/icons.ts](../../../site/src/lib/icons.ts) —
  check that file for the current list (currently: `layers`, `database`, `splitSquare`,
  `playCircle`, `grid`, `chart`, `tools`, `terminal`, `document`, `clipboard`, `trend`,
  `gitMerge`, `bubble`, `sparkles`, `award`, `book`, `chevronLeft`, `chevronRight`,
  `search`, `user`, `slides`, `info`, `puzzle`, `flask`, `pencil`, `helpCircle`, `lock`,
  `home`). A typo'd or new icon name **fails the build** —
  don't invent one. Adding an icon is a `src/` change: use the `site-dev` skill.
- Plain Markdown prose and standard bullets also work directly inside a `<Slide>` body
  (see `1-1-course-welcome.mdx`); `Bullets` is for when you want nesting/inline formatting.
- **Full prop types** live in [site/README.md](../../../site/README.md) and the component
  sources under [site/src/components/blocks/](../../../site/src/components/blocks/) — consult
  them for anything beyond this cheatsheet.

## Week activities (`content/activities/week-NN.yaml`)

Separate from decks: the in-class exercise served at `/week-NN/activity/`, rendered
by `<DataInspector>`. **You never write the component** — the activity is pure data,
one optional YAML file per week, and a week without one keeps its "coming soon"
placeholder.

The shape is always *here is a small table, flag what deserves a question, then walk
the findings*, which suits any week with a dataset worth reading skeptically (a JE
extract, a dirty ETL pull, a bad join result). Fields, and the reveal contract, are
documented in [site/content/README.md](../../../site/content/README.md) — read it
before authoring one.

Two rules worth repeating here, because they're pedagogy and not schema:

- **Always include at least one `kind: clean` reveal** — a check that comes back
  fine. Without it the activity teaches that skepticism means "everything is fraud".
- **A reveal's `columns` (rather than `rows`) is for problems that live in the
  column** — a text-typed amount, an ambiguous date format. Students can't flag
  those by clicking a record, and saying so is part of the lesson.

`week-01.yaml` is the reference implementation; match its density and its voice.

## Quiz rules

- Prefer **one inline `<Quiz>` per concept slide** as a check-for-understanding — a recurring
  pattern in this course.
- `id` must be **stable and unique** (keys localStorage progress + analytics). Convention:
  `wN-short-slug` (e.g. `w3-data-shapes`).
- `correct` is the **0-based index** into `opts`. Out-of-range **fails the build**.
- `opts` needs **≥ 2** options. `why` (the explanation) is shown only after the student answers.

## AI tutor context (deck + slide level)

The on-device AI tutor reads three author-controlled channels; only the first two are
visible to students:

- **`topic`** (deck frontmatter, overridable per-slide via `<Slide topic>`): a short
  subject label ("accruals", "LEFT JOIN semantics") — used in tutor context and in the
  seed-question chips ("Explain accruals simply").
- **`aiPrompt`** (deck frontmatter): a per-deck addendum to the tutor's system prompt.
  Use for deck-wide pedagogy steering, e.g. `Favor JOIN intuition over syntax.`
- **`<Slide aiNotes="…">`**: instructor notes for the tutor only — **never rendered on
  the slide**. This is where per-slide tutoring quality comes from. Best content:
  common misconceptions ("students confuse net income with cash flow here"), worked-solution
  steps for the slide's example, or what a good hint should point at. Keep it 1–3 sentences;
  it's fed to a small on-device model with a tight context budget.

Priority when adding `aiNotes`: slides with a `<Quiz>` first (the tutor uses the notes to
hint without revealing the answer), then slides teaching a calculation or multi-step
procedure. The quiz `why` is already sent to the tutor — don't duplicate it in `aiNotes`.

## Validation (required before claiming done)

```bash
cd site && npm run build      # what CI runs — a green build means the content is schema-valid
cd site && npm run dev        # optional: visual preview of the deck in the browser
```

A passing `npm run build` confirms frontmatter, props, icon names, and quiz indices are all
valid. Always run it after generating or editing content.
