# Authoring guide — writing a deck

This is for whoever writes course content (an instructor, or an AI). You only ever
touch `site/content/`. You never need to open `site/src/`. If you write something
invalid, the build fails with a clear error instead of shipping a broken slide
(spec §2, §7).

## The content hierarchy

```
Course (one course.yaml)
└── Week        (site/content/weeks/week-03.yaml)
    └── Deck    (site/content/decks/week-03/lec-data-sources.mdx)   ← the lecture
        └── Slide (a <Slide> in the deck body)
            └── Quiz (an optional <Quiz> inside a slide)
```

Weeks and the course are tiny **YAML** files. Decks are **MDX** —
Markdown prose plus a handful of components for rich blocks.

## A week file (`site/content/weeks/week-03.yaml`)

```yaml
number: 3
title: "Where accounting data lives"
summary: "Files, databases, and APIs — and the JOIN that stitches them together."
```

## A deck (`site/content/decks/week-03/lec-data-sources.mdx`)

Frontmatter is metadata; the body is slides. See spec §2.2 for the full example.

```mdx
---
week: week-03
title: "Data Sources: Files, Databases, APIs"
subtitle: "Real analysis is many tables, not one file an LLM can see."
estMinutes: 50
instructors: ["Maclean Gaulin", "Other Person"]
aiPrompt: "This deck is about relational data. Favor JOIN intuition over syntax."
---
import { Slide, Bullets, Schema, SqlWalk, Quiz } from '@components/blocks';

<Slide variant="title" kicker="Week 3 · Lecture" icon="layers">
This week: where accounting data actually lives.
</Slide>

<Slide title="Three places data lives" icon="database"
       key="Files, databases, and APIs are the three shapes of source data.">
  <Bullets items={[
    { l: 1, h: "**Files** — CSV, Excel, JSON exported from a system" },
    { l: 1, h: "**Databases** — many related tables, queried with SQL" },
    { l: 1, h: "**APIs** — data fetched live over HTTP" },
  ]} />

  <Quiz
    id="w3-data-shapes"
    q="Which source is queried with SQL?"
    opts={["A flat CSV", "A relational database", "A PDF"]}
    correct={1}
    why="Relational databases store related tables and are queried with SQL JOINs." />
</Slide>
```

## Frontmatter fields (deck)

| Field         | Required | Meaning                                            |
|---------------|----------|----------------------------------------------------|
| `week`        | yes      | id of the week this deck belongs to                |
| `title`       | yes      | deck title (shown in breadcrumb, present mode)     |
| `subtitle`    | no       | one-line framing                                   |
| `instructors` | no       | overrides the course-level instructor list         |
| `date`        | no       | lecture date                                       |
| `estMinutes`  | no       | estimated length                                   |
| `topic`       | no       | subject label sent to the AI tutor as context on every slide (a `<Slide topic>` overrides it) |
| `aiPrompt`    | no       | per-deck addendum appended to the AI tutor's system prompt |

## `<Slide>` conventions

- `variant="title"` for the cover slide; default otherwise.
- `title` / `kicker` / `icon` — header chrome (`icon` names come from the icon map, spec §3.1).
- `key="…"` — the **Key Concept** reinforcement line shown in the side pane (spec §4.3).
- `topic="…"` — overrides the deck-level `topic` for this slide's AI-tutor context only.
- A `<Quiz>` placed inside a slide becomes that slide's self-check.

## The blocks you can use (spec §3.1)

`<Bullets>`, `<ThreeCol>`, `<SqlWalk>`, `<JoinCompare>`, `<Schema>`,
`<DataTable>`, `<CodeBlock>`, `<Demo>`, `<Cta>`, `<Quiz>`, `<CoverMeta>`, and the
layout wrappers `<TwoColumn>`, `<ImageCaption>`, `<ChartPane>`, `<FullBleed>`,
`<CardGrid>`. Each has typed props; a missing or wrong prop fails the build.

## Inline formatting in block text

String props that hold prose (e.g. `Bullets` `h`, `ThreeCol`/`JoinCompare` body,
`SqlWalk` `desc`) support a **deliberately tiny** inline syntax — `**bold**`,
`*italic*`, and `` `code` `` — and nothing else. This is not Markdown: there are no
links, lists, or headings inside a string (use the dedicated components for those).
Everything is escaped, so the text is safe by construction. Example:

```jsx
{ l: 1, h: "**Databases** — many related tables, queried with `SQL`" }
```

## Quiz rules

- `correct` is the **0-based index** into `opts`. Out-of-range fails the build.
- `id` must be stable and unique — it keys `localStorage` progress and analytics.
- `why` is shown only after the student answers.
- The quiz's correct answer is passed to the AI tutor as **hint-only**
  (`canonicalSelfCheckAnswer`); the tutor will never reveal it verbatim (spec §5.4,
  Rule 1).

## How to preview your work

```bash
cd site && npm run dev      # then open the deck's URL
npm run build               # this is what CI runs; if it passes, your content is valid
make gate                   # everything CI checks: types, build, unit tests, e2e
```

`make gate` (or `npm run gate`) runs the four checks in order and prints one
line each — it only gets chatty when something fails, and then it shows you the
whole failure. Run a subset with `npm run gate -- check build`. It also works
from the repo root, as do `make screenshot` and `make site-help`.

### Screenshotting a page

```bash
make screenshot PAGES="/ /week-04/" PREVIEW=2026-09-08
npm run screenshot -- /week-03/slides/ --full
npm run screenshot -- / --selector=".site-header"
```

PNGs land in `site/.screenshots/` (gitignored). If a dev or preview server is
already running on :4321 it uses that; otherwise it builds, starts one, and
shuts it down afterwards. `PREVIEW=` sets the preview clock (below) for the
shot, which is how you photograph a week that has not unlocked yet.

### Seeing a week that hasn't unlocked yet

Weeks carry an `unlockOn` date; before it passes, the week still appears in the
header nav and the home-page syllabus, but greyed out and un-clickable, with a
lock icon and an "Unlocks *Monday, September 21*" note — students can see the
shape of the term without wandering into it. **Individual week pages still
render at their URLs** — type `/week-05/slides/` and it works. The gate is a
courtesy (keep attention on this week), not security.

To open the gated entries while you are working ahead, append `?preview=` to
any URL:

| URL | What you see |
|-----|--------------|
| `?preview=all` | every week live and clickable, whatever the date |
| `?preview=2026-09-21` | the site exactly as it looks that day |
| `?preview=off` | back to the real clock |

The setting sticks as you click around (it lives in `localStorage`), and a black
pill in the bottom-left corner shows it is on — click the pill to turn it off.
It works in `npm run dev` and on the deployed site alike.
