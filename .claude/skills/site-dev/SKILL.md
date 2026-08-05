---
name: site-dev
description: >-
  Develop the ACCTG 5150 Astro site itself — everything under site/src/. Use when
  the user asks for a new slide component/block, a new interactive widget or island,
  a new icon, a new page or content collection (e.g. assignments/labs on the site),
  layout or styling changes, or content-schema changes (e.g. "add a Timeline
  component", "put the labs on the site", "add a flowchart icon", "restyle the
  header"). Content-only edits belong to deck-author / lab-author, not here.
---

# Developing the site (`site/src/`)

Architecture invariants (from the spec, enforced by review not tooling):

- **Content ≠ presentation ≠ behavior.** MDX/YAML in `content/`, `.astro`
  components in `src/components/`, client JS only in `src/components/islands/`.
- **Static output.** `output: 'static'`, deployed to GitHub Pages by CI. No
  server endpoints; islands must work from `localStorage`/static JSON only.
- **Zero-JS by default.** Blocks are plain `.astro` (server-rendered, scoped
  `<style>`). JS ships only via an island that progressively enhances
  `data-*` hooks emitted by a static block (see `Quiz.astro` + `QuizCard.astro`).
- **Tokens only.** All colors/spacing/type come from `src/styles/tokens.css`
  vars — never raw hex in a component. Base-path-safe links go through
  `src/lib/url.ts` `href()` (GitHub Pages serves under a subpath).

## Adding a slide block component

1. Create `src/components/blocks/Name.astro`: typed `Props` interface, scoped
   `<style>` using tokens, inline-format strings rendered through `Inline`
   (`src/lib/inline.ts` supports only `**bold**`, `*italic*`, `` `code` ``).
2. Export it from the barrel `src/components/blocks/index.ts` (grouped section
   comments — match them).
3. **Update the authoring docs — required, not optional:** add a cheatsheet row
   in `.claude/skills/deck-author/SKILL.md` and `site/content/README.md`. If you
   skip this, content agents can't use (or will misuse) the component.
4. Use it in one real deck slide as a smoke test.

## Adding an icon

Add the name to the `IconName` union and the SVG inner-markup entry in
`src/lib/icons.ts` (24×24 Lucide stroke icons, ISC license — paste the paths, not
a URL). Typo'd names fail type-check by design. Mirror the new name into the
deck-author cheatsheet's icon note.

## Adding an interactive widget (island)

1. Static block emits semantic HTML + `data-*` hooks; island in
   `src/components/islands/` enhances all instances via
   `document.querySelectorAll('[data-hook]')`, guarded by `dataset.enhanced`.
2. Persist student state in `localStorage` namespaced with `NS` from
   `src/lib/deck.ts` (see `quiz-score.ts` for the pattern).
3. Mount the island in the page/layout that renders the block (see
   `DeckController.astro` usage in `src/pages/`).
4. Must degrade gracefully with JS off (content readable, controls hidden).

## Adding a content collection (e.g. labs/assignments on the site)

1. Define the collection in `src/content.config.ts` with a `glob` loader based
   at `content/` (weeks/decks pattern) and a strict Zod schema; use
   `reference('weeks')` to tie items to weeks.
2. Add routes under `src/pages/` mirroring `[week].astro` / `[week]/` and link
   from the week page. All hrefs through `href()`.
3. For labs specifically: the `labs` collection already exists — a `glob` loader
   based at `../labs_hw` whose pattern (`week*/{Lab,Homework}-*_Instructions.md`
   minus `*_MAcc_*`) is the curation: it admits the ACCTG 5150 instruction
   sheets only. **Never widen it** toward solutions/notebooks/data, or back
   toward the MAcc variants — the site is undergrad-only. Ids keep the raw path
   (custom `generateId`); `src/lib/labs.ts` parses week/type from them. Python-markdown
   artifacts (`[TOC]`, `{: .class}`, missing figures) are scrubbed at render
   time by `src/lib/remark-scrub-pymd.mjs` (registered in `astro.config.mjs`).
4. New content type ⇒ new authoring rules: extend `deck-author` or `lab-author`
   accordingly.

## Week sub-page structure

Each week serves six pages: `/week-NN/` (overview, `[week].astro`) plus the five
tabs `slides | activity | lab | homework | quiz` (`[week]/<tab>.astro`, URLs owned
by `weekTabUrl()` in `src/lib/url.ts`). The slides page renders the week's single
monolithic deck (`content/decks/week-NN/slides.mdx`) as flat, full-width page
content — the slide is *not* a card: no surface, frame, or elevation of its own,
and when the active slide has a Key Concept or quiz the `Companion.astro`
reinforcement rail claims the right ~30% (`:has()` on a non-hidden aside, so an
empty rail collapses to one column). The other
four share the light `WeekShell.astro` layout, with `ComingSoon.astro` as the
empty state and `InstructionDocs.astro` (doc typography) for
lab/homework sheets. The header (`SiteHeader.astro`) reads each week's nav icon
and short label from `navLabel`/`icon` in `content/weeks/week-NN.yaml` — never
hardcode week→icon maps in components.

## Validation (required before claiming done)

```bash
cd site
npm run check        # astro check — types, props, icon names
npm run build        # schema-valid content + working static build
npm test             # vitest unit tests (tests/unit)
npm run test:e2e     # playwright (tests/e2e) — run when touching islands/pages
```

Visual changes additionally need `npm run dev` and an eyeball pass on: index
page, a week overview, a content-heavy week deck (e.g. `/week-03/slides/`), a
lab page (e.g. `/week-05/lab/`), and print preview (decks are print-styled).

Weeks are date-gated (`unlockOn`), so most of that content renders as a "Not
yet!" card until the term reaches it. Add `?preview=all` to any URL to see it
(or `?preview=YYYY-MM-DD` for a specific day, `?preview=off` to stop) — the
choice persists in `localStorage` and raises a corner badge. See
`src/lib/unlock.ts`.

The spacing scale is **1,2,3,4,5,6,8,12** — there is no `--space-7/9/10/11`, and
one undefined token silently voids the *entire* declaration it appears in (this
is what left the lock card jammed into the top-left corner for a while). When a
box mysteriously loses its margin or padding, check the token exists.
