---
name: pptx-to-deck
description: >-
  Convert the UG PowerPoint lecture decks in slides/ into the Astro site's per-week
  MDX decks under site/content/decks/week-NN/slides.mdx. Use when the user asks to
  convert, import, re-import, refresh, or migrate .pptx slides to the website (e.g.
  "convert the week 11 slides", "re-import 2-UG-Business Data.pptx", "pull the new
  UG decks into the site"). Wraps code/utils/pptx2md.py, which preserves
  hand-authored quizzes/keys/aiNotes across re-conversion.
---

# Converting UG PPTX → site decks

Conversion is **mechanical extraction followed by an editorial pass**. The script
gets the words, the structure, and the images onto the page; it cannot decide what
deserves a `ThreeCol` or where a quiz belongs. Budget your effort accordingly —
step 4 is the job, steps 1–3 are setup.

## Naming contract

The source of truth is the **UG lecture decks**:

```
slides/{N}-{Folder}/{N}-UG-{Title}.pptx      e.g. slides/2-data/2-UG-Business Data.pptx
slides/1-Intro/UG1-{Title}.pptx              week 1 only — legacy spelling
```

Out of scope, never converted:

- `*-UG-Lab*.pptx` — lab material. That feeds `labs_hw/` via the **`lab-author`** skill.
- `{N}.{M}-{Title}.pptx` — the older MAcc per-lecture decks. Superseded.
- Webinars, faculty decks, `template.pptx`, anything past **week 13**.

**Week number comes from the filename prefix, not the folder.** `14-UG-Speaker.pptx`
lives in `slides/13-recap/` and is week 14 — hence out of scope.

## Output shape

**One deck per week**, always `site/content/decks/week-NN/slides.mdx`, matching the
site's monolithic-deck model (see `deck-author`). Images land in
`site/public/decks/week-NN/{deck-slug}/imgK.{ext}` and are referenced as
`/decks/week-NN/{deck-slug}/imgK.{ext}`.

## Workflow

1. **Convert to staging** (never straight into `site/content/`):

   ```bash
   uv run python code/utils/pptx2md.py                          # every in-scope week
   uv run python code/utils/pptx2md.py "slides/2-data/2-UG-Business Data.pptx"
   ```

   Output goes to `build/decks-staging/` (gitignored). Read the run summary — it
   reports which decks were skipped, what was carried forward, and what was orphaned.

2. **Read the orphan reports.** Any `build/decks-staging/week-NN.orphans.md` holds
   `key=`, `aiNotes=`, and `<Quiz>` blocks from the *previous* deck whose slide title
   no longer exists upstream. **This is authored pedagogy that will be lost if you
   ignore it.** Re-home each item onto the closest regenerated slide, then delete the
   report. Expect a lot of these the first time a week switches source decks.

3. **Promote:**

   ```bash
   uv run python code/utils/pptx2md.py --promote
   ```

   This overwrites `site/content/decks/week-NN/slides.mdx`. Everything the script can
   match by slide title is carried over automatically; everything else was in step 2.

4. **Editorial pass — required, this is where the value is.** Load `deck-author` and:
   - fill week `objectives` in `content/weeks/week-NN.yaml` (stubs are empty) — the
     deck must teach to them;
   - add `key=` one-liners to concept slides; give the cover a real hook line;
   - upgrade flat `<Bullets>` into the right component (`ThreeCol`, `Schema`,
     `SqlWalk`, `JoinCompare`, `CodeBlock`, `DataTable`) wherever the PPTX used
     *layout* to convey structure that the extractor could only flatten;
   - add one `<Quiz>` per concept slide (`id` = `wN-short-slug`, 0-based `correct`);
   - set deck `topic` (+ `aiPrompt` if the deck needs pedagogy steering);
   - fix mangled text: fragment ordering, floating annotation labels swept into
     bullets, smart-quote artifacts.

5. **Validate** — required before claiming done:

   ```bash
   cd site && npm run build
   ```

   Then `npm run dev` and eyeball it. Image sizing and slide density only show visually.

## What the converter does and does not preserve

| Carried across a re-conversion | How |
|---|---|
| `<Quiz>` blocks | matched on normalized slide title |
| `key=` | matched on normalized slide title |
| `aiNotes=` | existing value wins; otherwise generated from PPTX speaker notes |
| anything on a **renamed** slide | **not** carried — dumped to `week-NN.orphans.md` |

Everything else in the deck body is regenerated from scratch. Component upgrades you
made by hand (a `ThreeCol` you built from flat bullets) **are destroyed** by a
re-convert. Re-import a week only when the PPTX genuinely changed.

## Why python-pptx, not raw XML

A `.pptx` is a zip of XML, so parsing `ppt/slides/slideN.xml` directly is tempting.
It was measured against this corpus (33 UG decks, 827 slides) and rejected:

- python-pptx **is** an object layer over exactly that XML. It adds relationship
  resolution (images, layouts, notes parts) and layout inheritance — the two things
  that are genuinely tedious by hand.
- The corpus contains **0 charts** and **2 SmartArt diagrams**. SmartArt is the only
  content python-pptx cannot reach, because the node text lives in `ppt/diagrams/dataN.xml`
  rather than in the slide part. The script handles that one gap with a small
  `zipfile` + regex fallback (`smartart_text()`), and uses python-pptx for everything else.

The old converter's flat output was never a parser limitation — it was **discarding
signal python-pptx already provides**. The current version uses:

| Signal | Becomes |
|---|---|
| slide-layout name (`Two Content`, `Title Slide`) | `<TwoColumn>`, section dividers |
| shape geometry (side-by-side, stacked) | `<TwoColumn>`; merged `<Bullets>` |
| run-level bold / italic / monospace font | `**bold**`, `*italic*`, `` `code` `` |
| hyperlinks | `<Cta label href>` |
| speaker notes | `aiNotes=` (AI tutor context) |
| image hash repeated ≥3 slides, or < 1.5 in² | dropped as template chrome |

If you extend the extractor, prefer reaching for more python-pptx signal over
dropping to XML. Go to the XML only for parts python-pptx models as opaque
(`ppt/diagrams/`, `ppt/charts/`, `ppt/embeddings/`).

## Gotchas

- **Newest-mtime-wins can drop a real lecture.** When several UG decks map to one
  week, only the newest is converted. That's right for `10-UG-Classifiers2.pptx` vs
  `10-UG-Classifiers.pptx` (a revision), but **wrong** for week 9, where
  `9-UG-Regressions.pptx` and `9-UG-Supervised Learning.pptx` are two distinct
  lectures. The run log prints every skipped file — read it. To combine two decks
  into one week, convert them separately and merge the section by hand.
- **All JSX attributes are emitted as expression containers** (`title={"…"}`, not
  `title="…"`). JSX has no backslash escape inside a quoted attribute, so any slide
  title containing a quote breaks the build otherwise. Keep this convention if you
  touch the emitters.
- **Text inside props is not Markdown.** `Bullets` `h` runs through `Inline`, which
  supports only `**bold**`, `*italic*`, `` `code` ``. No links, no lists.
- Grouped shapes flatten in reading order (top, then left), which is sometimes wrong —
  compare against the PPTX when a slide reads oddly.
- Floating annotation text boxes (callout labels over a figure) get swept into the
  slide's bullet list. Delete them in the editorial pass.
- `build/` is gitignored; staging output and orphan reports are scratch and are
  never committed.
